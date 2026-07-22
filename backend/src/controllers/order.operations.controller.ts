import { randomInt, randomUUID, timingSafeEqual } from "crypto";
import type { Request, Response } from "express";
import { prisma } from "../config/prisma";
import {
  matchOrderItems,
  type RequestedItem,
} from "../services/matching.service";
import {
  amountToPaise,
  failAndCancelOnlineOrder,
  triggerOrderRefund,
} from "../services/payment-lifecycle.service";
import {
  createRazorpayOrder,
  razorpayKeyId,
} from "../services/razorpay.service";
import { publishOrderUpdate } from "../realtime";

type DeliveryStatus = "picked_up" | "on_the_way" | "delivered";
type TaskLeg = "primary" | "relay";

const DELIVERY_STATUSES: DeliveryStatus[] = [
  "picked_up",
  "on_the_way",
  "delivered",
];
const PAYMENT_METHODS = ["upi", "card", "cod"] as const;

function httpError(message: string, status = 400) {
  return Object.assign(new Error(message), { status });
}

function requestBody(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw httpError("Request body must be an object.");
  }
  return value as Record<string, unknown>;
}

function requiredText(value: unknown, field: string) {
  const result = typeof value === "string" ? value.trim() : "";
  if (!result) throw httpError(`${field} is required.`);
  return result;
}

function optionalText(value: unknown) {
  return typeof value === "string" ? value.trim() || null : null;
}

function createDeliveryOtp() {
  return randomInt(100_000, 1_000_000).toString();
}

function createPickupOtp() {
  return randomInt(100_000, 1_000_000).toString();
}

function pickupOtpMatches(expected: string | null, supplied: string | null) {
  if (!expected || !supplied || !/^\d{6}$/.test(supplied)) return false;
  const expectedBytes = Buffer.from(expected);
  const suppliedBytes = Buffer.from(supplied);
  return (
    expectedBytes.length === suppliedBytes.length &&
    timingSafeEqual(expectedBytes, suppliedBytes)
  );
}

function deliveryOtpMatches(expected: string | null, supplied: string | null) {
  if (!expected || !supplied || !/^\d{6}$/.test(supplied)) return false;
  const expectedBytes = Buffer.from(expected);
  const suppliedBytes = Buffer.from(supplied);
  return (
    expectedBytes.length === suppliedBytes.length &&
    timingSafeEqual(expectedBytes, suppliedBytes)
  );
}

function createOrderCode() {
  return `GC-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`;
}

function parseRequestedItems(value: unknown): RequestedItem[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw httpError("At least one item is required.");
  }

  return value.map((item) => {
    const input = requestBody(item);
    const productId = requiredText(input.productId, "productId");
    const qty = Number(input.qty);

    if (!Number.isInteger(qty) || qty < 1) {
      throw httpError("Each item quantity must be a positive whole number.");
    }

    return { productId, qty };
  });
}

function taskLeg(value: unknown): TaskLeg {
  if (value === undefined) return "primary";
  if (value === "primary" || value === "relay") return value;
  throw httpError("leg must be either primary or relay.");
}

const RIDER_LOCATION_FRESHNESS_MS = 90_000;
const DISPATCH_RADIUS_METRES = 5_000;

async function nearbyPharmacyIds(riderId: string) {
  const location = await prisma.riderLocation.findUnique({
    where: { riderId },
    select: { lat: true, lng: true, isOnline: true, updatedAt: true },
  });
  const isFresh =
    location &&
    Date.now() - location.updatedAt.getTime() <= RIDER_LOCATION_FRESHNESS_MS;
  if (!location?.isOnline || !isFresh) {
    return { isDispatchable: false, ids: [] as string[] };
  }

  const pharmacies = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id
    FROM pharmacies
    WHERE location IS NOT NULL
      AND ST_DWithin(
        location,
        ST_SetSRID(ST_MakePoint(${location.lng}, ${location.lat}), 4326)::geography,
        ${DISPATCH_RADIUS_METRES}
      )
  `;
  return {
    isDispatchable: true,
    ids: pharmacies.map((pharmacy) => pharmacy.id),
  };
}

export async function placeMatchedOrder(req: Request, res: Response) {
  const input = requestBody(req.body);
  const dropAddress = requiredText(input.dropAddress, "dropAddress");
  if (dropAddress.length > 500)
    throw httpError("dropAddress must be at most 500 characters.");
  const parsedDropLat = Number(input.dropLat);
  const parsedDropLng = Number(input.dropLng);
  const hasDropCoordinates =
    Number.isFinite(parsedDropLat) && Number.isFinite(parsedDropLng);
  const dropLat = hasDropCoordinates ? parsedDropLat : null;
  const dropLng = hasDropCoordinates ? parsedDropLng : null;
  const paymentMethod = input.paymentMethod as (typeof PAYMENT_METHODS)[number];

  if (
    !PAYMENT_METHODS.includes(paymentMethod as (typeof PAYMENT_METHODS)[number])
  ) {
    throw httpError("Invalid payment method.");
  }

  const order = await prisma.$transaction(async (tx) => {
    const match = await matchOrderItems(tx, parseRequestedItems(input.items));

    for (const item of match.items) {
      const updated = await tx.product.updateMany({
        where: { id: item.productId, stock: { gte: item.qty } },
        data: { stock: { decrement: item.qty } },
      });
      if (updated.count === 0) {
        throw httpError(`Insufficient stock for ${item.name}.`, 409);
      }
    }

    const productIds = match.items.map((item) => item.productId);
    const prescriptionProductCount = await tx.product.count({
      where: { id: { in: productIds }, category: { not: "otc" } },
    });
    const requiresPrescription = prescriptionProductCount > 0;
    // OTC + COD is immediately verified; prescription or online-payment orders await confirmation
    const status =
      requiresPrescription || paymentMethod !== "cod"
        ? "pending_verification"
        : "verified";
    const subtotal = match.items.reduce(
      (sum, item) => sum + item.price * item.qty,
      0,
    );
    const deliveryFee = Math.max(0, Number(input.deliveryFee) || 0);
    const estimatedMinutes = Math.max(1, Number(input.estimatedMinutes) || 30);

    return tx.order.create({
      data: {
        orderCode: createOrderCode(),
        customerId: req.user!.id,
        pharmacyId: match.primaryPharmacyId,
        relayPharmacyId: match.relayPharmacyId,
        // isRelay is true whenever a second pharmacy is involved, regardless of relay node distance
        isRelay: match.relayNode !== null,
        relayNodeLat: match.relayNode?.lat,
        relayNodeLng: match.relayNode?.lng,
        relayStatus: match.relayNode ? "pending" : null,
        status,
        requiresPrescription,
        subtotal,
        deliveryFee,
        total: subtotal + deliveryFee,
        paymentMethod,
        dropAddress,
        dropLat,
        dropLng,
        deliveryInstructions: (() => {
          const instructions = optionalText(input.deliveryInstructions);
          if (instructions && instructions.length > 300) {
            throw httpError(
              "deliveryInstructions must be at most 300 characters.",
            );
          }
          return instructions;
        })(),
        estimatedDeliveryTime: new Date(Date.now() + estimatedMinutes * 60_000),
        items: {
          create: match.items.map((item) => ({
            productId: item.productId,
            name: item.name,
            qty: item.qty,
            price: item.price,
            fromRelayPharmacy: item.fromRelayPharmacy,
          })),
        },
        events: {
          create: {
            status,
            note: requiresPrescription
              ? "Awaiting pharmacy prescription review."
              : "Order placed and awaiting packing.",
          },
        },
        payment: {
          create: {
            provider: paymentMethod === "cod" ? "cod" : "razorpay",
            amount: subtotal + deliveryFee,
            status: "pending",
          },
        },
      },
      include: { items: true, payment: true },
    });
  });

  if (paymentMethod === "cod") {
    res.status(201).json(order);
    return;
  }

  try {
    const providerOrder = await createRazorpayOrder({
      amount: amountToPaise(order.total),
      receipt: order.orderCode,
      notes: { orderId: order.id, customerId: req.user!.id },
    });
    await prisma.payment.update({
      where: { orderId: order.id },
      data: {
        providerOrderId: providerOrder.id,
        rawPayload: providerOrder as never,
      },
    });
    res.status(201).json({
      ...order,
      razorpay: {
        keyId: razorpayKeyId(),
        orderId: providerOrder.id,
        amount: providerOrder.amount,
        currency: providerOrder.currency,
      },
    });
  } catch (error) {
    await failAndCancelOnlineOrder(
      order.id,
      "Payment could not be started. The order was cancelled.",
    );
    throw error;
  }
}

export async function vendorOrderQueue(req: Request, res: Response) {
  const vendorId = req.user!.id;
  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { pharmacy: { vendorUserId: vendorId } },
        { relayPharmacy: { vendorUserId: vendorId } },
      ],
    },
    include: {
      items: true,
      customer: { select: { name: true } },
      pharmacy: { select: { name: true, vendorUserId: true } },
      relayPharmacy: { select: { vendorUserId: true } },
      rider: {
        select: {
          id: true,
          name: true,
          riderLocation: {
            select: { lat: true, lng: true, isOnline: true, updatedAt: true },
          },
        },
      },
      relayRider: { select: { id: true, name: true } },
      payment: true,
      refund: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const items = await Promise.all(
    orders.map(async (order) => {
      const isRelayPharmacy = order.relayPharmacy?.vendorUserId === vendorId;
      const isPrimaryPharmacy = order.pharmacy.vendorUserId === vendorId;
      const needsLegacyPickupOtp =
        isPrimaryPharmacy &&
        !order.pickupOtp &&
        ["awaiting_rider", "rider_assigned"].includes(order.status);
      const pickupOtp = needsLegacyPickupOtp
        ? createPickupOtp()
        : order.pickupOtp;

      if (needsLegacyPickupOtp) {
        await prisma.order.update({
          where: { id: order.id },
          data: { pickupOtp, pickupOtpIssuedAt: new Date() },
        });
      }

      const {
        customer: _customer,
        dropAddress: _dropAddress,
        dropLat: _dropLat,
        dropLng: _dropLng,
        deliveryInstructions: _deliveryInstructions,
        prescriptionPath: _prescriptionPath,
        ...safeOrder
      } = order;

      return {
        ...safeOrder,
        customer: { name: "Customer" },
        customerMasked: true,
        pickupOtp,
        fulfilmentLeg: isRelayPharmacy ? "relay" : "primary",
        canPackRelay:
          isRelayPharmacy &&
          !order.relayPackedAt &&
          ["verified", "awaiting_rider"].includes(order.status),
      };
    }),
  );

  res.json({ items });
}

export async function verifyVendorOrder(req: Request, res: Response) {
  const input = requestBody(req.body);
  const approved = input.approved;
  const reason = optionalText(input.reason);

  if (typeof approved !== "boolean")
    throw httpError("approved must be a boolean.");
  if (!approved && !reason) throw httpError("A rejection reason is required.");

  const order = await prisma.order.findFirst({
    where: {
      id: String(req.params.id),
      pharmacy: { vendorUserId: req.user!.id },
    },
  });
  if (!order) return void res.status(404).json({ error: "Order not found." });
  if (order.status !== "pending_verification") {
    return void res
      .status(409)
      .json({ error: "This order is not awaiting verification." });
  }
  if (order.paymentMethod !== "cod" && order.paymentStatus !== "paid") {
    return void res.status(409).json({
      error: "Payment must be confirmed before approving this order.",
    });
  }
  if (order.requiresPrescription && !order.prescriptionPath) {
    return void res
      .status(409)
      .json({ error: "The customer has not uploaded a prescription." });
  }

  if (approved) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "verified",
        events: {
          create: {
            status: "verified",
            note: "Prescription approved by pharmacy.",
          },
        },
      },
    });
  } else {
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "rejected",
          cancelledAt: new Date(),
          cancelledBy: req.user!.id,
          cancelledReason: reason,
          events: {
            create: {
              status: "rejected",
              note: `Prescription rejected: ${reason}`,
            },
          },
        },
      });
      const items = await tx.orderItem.findMany({
        where: { orderId: order.id },
        select: { productId: true, qty: true },
      });
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.qty } },
        });
      }
      if (order.paymentStatus === "paid") {
        await tx.refund.create({
          data: { orderId: order.id, amount: order.total, reason },
        });
      }
    });
  }

  if (!approved && order.paymentStatus === "paid") {
    try {
      await triggerOrderRefund(order.id);
    } catch (error) {
      console.error(
        "Razorpay refund initiation failed after vendor rejection",
        error,
      );
    }
  }

  res.json({ id: order.id, status: approved ? "verified" : "rejected" });
}

export async function markVendorOrderPacked(req: Request, res: Response) {
  const vendorId = req.user!.id;

  const order = await prisma.order.findFirst({
    where: { id: String(req.params.id) },
    include: {
      pharmacy: { select: { vendorUserId: true } },
      relayPharmacy: { select: { vendorUserId: true } },
    },
  });

  if (!order) return void res.status(404).json({ error: "Order not found." });

  const isPrimaryPharmacy = order.pharmacy.vendorUserId === vendorId;
  const isRelayPharmacy = order.relayPharmacy?.vendorUserId === vendorId;
  if (!isPrimaryPharmacy && !isRelayPharmacy) {
    return void res.status(404).json({ error: "Order not found." });
  }

  if (order.paymentMethod !== "cod" && order.paymentStatus !== "paid") {
    return void res
      .status(409)
      .json({ error: "Payment must be confirmed before packing this order." });
  }

  if (isRelayPharmacy && !isPrimaryPharmacy) {
    if (
      !["verified", "awaiting_rider"].includes(order.status) ||
      order.relayPackedAt
    ) {
      return void res
        .status(409)
        .json({ error: "This relay order is not awaiting packing." });
    }
    await prisma.order.update({
      where: { id: order.id },
      data: {
        relayPackedAt: new Date(),
        events: {
          create: {
            status: order.status,
            note: "Relay pharmacy packed its items.",
          },
        },
      },
    });
    return void res.json({ id: order.id, status: "relay_packed" });
  }

  if (order.status !== "verified") {
    return void res
      .status(409)
      .json({ error: "Only verified orders can be marked packed." });
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: "awaiting_rider",
      pickupOtp: order.pickupOtp ?? createPickupOtp(),
      pickupOtpIssuedAt: order.pickupOtpIssuedAt ?? new Date(),
      events: {
        create: {
          status: "awaiting_rider",
          note: "Primary pharmacy packed its items.",
        },
      },
    },
  });

  publishOrderUpdate(order.id, { id: order.id, status: "awaiting_rider" });
  res.json({ id: order.id, status: "awaiting_rider" });
}

export async function riderAvailableTasks(req: Request, res: Response) {
  const dispatch = await nearbyPharmacyIds(req.user!.id);
  if (!dispatch.isDispatchable) {
    return void res.json({
      items: [],
      availability: "offline_or_location_stale",
    });
  }
  if (dispatch.ids.length === 0) return void res.json({ items: [] });
  const [primaryTasks, relayTasks] = await Promise.all([
    prisma.order.findMany({
      where: {
        status: "awaiting_rider",
        riderId: null,
        pharmacyId: { in: dispatch.ids },
        OR: [{ paymentMethod: "cod" }, { paymentStatus: "paid" }],
        AND: [
          { OR: [{ relayPharmacyId: null }, { relayPackedAt: { not: null } }] },
        ],
      },
      include: {
        pharmacy: { select: { name: true, address: true } },
        relayPharmacy: { select: { name: true, address: true } },
        items: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.order.findMany({
      where: {
        isRelay: true,
        status: "rider_assigned",
        relayRiderId: null,
        relayPharmacyId: { in: dispatch.ids },
        OR: [{ paymentMethod: "cod" }, { paymentStatus: "paid" }],
      },
      include: {
        pharmacy: { select: { name: true, address: true } },
        relayPharmacy: { select: { name: true, address: true } },
        items: true,
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  res.json({
    items: [
      ...primaryTasks.map(
        ({
          dropAddress: _dropAddress,
          dropLat: _dropLat,
          dropLng: _dropLng,
          deliveryInstructions: _deliveryInstructions,
          deliveryOtp: _deliveryOtp,
          pickupOtp: _pickupOtp,
          ...order
        }) => ({
          ...order,
          leg: "primary" as const,
        }),
      ),
      ...relayTasks.map(
        ({
          dropAddress: _dropAddress,
          dropLat: _dropLat,
          dropLng: _dropLng,
          deliveryInstructions: _deliveryInstructions,
          deliveryOtp: _deliveryOtp,
          pickupOtp: _pickupOtp,
          ...order
        }) => ({
          ...order,
          leg: "relay" as const,
        }),
      ),
    ],
  });
}

export async function riderMyTasks(req: Request, res: Response) {
  const items = await prisma.order.findMany({
    where: {
      OR: [{ riderId: req.user!.id }, { relayRiderId: req.user!.id }],
      status: {
        in: ["rider_assigned", "picked_up", "relay_pending", "on_the_way"],
      },
    },
    include: {
      pharmacy: { select: { name: true, address: true } },
      relayPharmacy: { select: { name: true, address: true } },
      items: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  res.json({
    items: items.map(
      ({ deliveryOtp: _deliveryOtp, pickupOtp: _pickupOtp, ...order }) => ({
        ...order,
        leg: order.relayRiderId === req.user!.id ? "relay" : "primary",
      }),
    ),
  });
}

export async function acceptRiderTask(req: Request, res: Response) {
  const leg = taskLeg(req.body ? requestBody(req.body).leg : undefined);
  const id = String(req.params.id);
  const dispatch = await nearbyPharmacyIds(req.user!.id);
  if (!dispatch.isDispatchable || dispatch.ids.length === 0) {
    return void res.status(409).json({
      error: "Go online and share a current location before accepting a job.",
    });
  }

  if (leg === "primary") {
    const claimed = await prisma.order.updateMany({
      where: {
        id,
        status: "awaiting_rider",
        riderId: null,
        pharmacyId: { in: dispatch.ids },
        OR: [{ paymentMethod: "cod" }, { paymentStatus: "paid" }],
        AND: [
          { OR: [{ relayPharmacyId: null }, { relayPackedAt: { not: null } }] },
        ],
      },
      data: { status: "rider_assigned", riderId: req.user!.id },
    });
    if (claimed.count === 0)
      return void res
        .status(409)
        .json({ error: "This delivery task is no longer available." });
    await prisma.orderEvent.create({
      data: {
        orderId: id,
        status: "rider_assigned",
        note: "Primary rider accepted delivery task.",
      },
    });
  } else {
    const claimed = await prisma.order.updateMany({
      where: {
        id,
        isRelay: true,
        status: "rider_assigned",
        relayRiderId: null,
        relayPharmacyId: { in: dispatch.ids },
        riderId: { not: req.user!.id },
        OR: [{ paymentMethod: "cod" }, { paymentStatus: "paid" }],
      },
      data: { relayRiderId: req.user!.id },
    });
    if (claimed.count === 0)
      return void res
        .status(409)
        .json({ error: "This relay task is no longer available." });
    await prisma.orderEvent.create({
      data: {
        orderId: id,
        status: "rider_assigned",
        note: "Relay rider accepted handoff task.",
      },
    });
  }

  publishOrderUpdate(id, {
    id,
    status: "rider_assigned",
    riderId: req.user!.id,
  });
  res.json({ id, leg, status: "rider_assigned" });
}

export async function updateRiderDelivery(req: Request, res: Response) {
  const input = requestBody(req.body);
  const status = input.status;
  if (!DELIVERY_STATUSES.includes(status as DeliveryStatus))
    throw httpError("Unsupported delivery status.");

  const order = await prisma.order.findFirst({
    where: { id: String(req.params.id) },
  });
  if (!order) return void res.status(404).json({ error: "Order not found." });
  if (order.riderId !== req.user!.id)
    return void res.status(403).json({
      error: "Only the assigned primary rider can update delivery status.",
    });

  const nextStatus = status as DeliveryStatus;
  const isValidTransition =
    (order.status === "rider_assigned" && nextStatus === "picked_up") ||
    (order.status === "picked_up" && nextStatus === "on_the_way") ||
    (order.status === "relay_pending" && nextStatus === "on_the_way") ||
    (order.status === "on_the_way" && nextStatus === "delivered");
  if (!isValidTransition)
    return void res
      .status(409)
      .json({ error: "This delivery transition is not allowed." });
  if (
    nextStatus === "on_the_way" &&
    order.isRelay &&
    order.relayStatus !== "handoff_done"
  ) {
    return void res.status(409).json({
      error: "Relay handoff must be completed before delivery can begin.",
    });
  }

  const suppliedDeliveryOtp = optionalText(input.deliveryOtp);
  const suppliedPickupOtp = optionalText(input.pickupOtp);
  if (
    nextStatus === "picked_up" &&
    !pickupOtpMatches(order.pickupOtp, suppliedPickupOtp)
  ) {
    return void res.status(400).json({
      error: order.pickupOtp
        ? "Enter the 6-digit pickup code provided by the pharmacy."
        : "Pickup code is not available for this order.",
    });
  }

  if (
    nextStatus === "delivered" &&
    !deliveryOtpMatches(order.deliveryOtp, suppliedDeliveryOtp)
  ) {
    return void res.status(400).json({
      error: order.deliveryOtp
        ? "Enter the 6-digit delivery OTP provided by the customer."
        : "Delivery OTP is not available for this order.",
    });
  }

  const deliveryOtp =
    nextStatus === "on_the_way"
      ? (order.deliveryOtp ?? createDeliveryOtp())
      : undefined;

  const orderStatus =
    nextStatus === "picked_up" && order.isRelay ? "relay_pending" : nextStatus;
  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: orderStatus,
      deliveredAt: nextStatus === "delivered" ? new Date() : undefined,
      deliveryOtp,
      deliveryOtpIssuedAt:
        nextStatus === "on_the_way"
          ? (order.deliveryOtpIssuedAt ?? new Date())
          : undefined,
      pickupOtpVerifiedAt: nextStatus === "picked_up" ? new Date() : undefined,
      deliveryOtpVerifiedAt:
        nextStatus === "delivered" ? new Date() : undefined,
      events: {
        create: {
          status: orderStatus,
          note:
            nextStatus === "picked_up"
              ? "Primary rider reached the relay handoff point."
              : nextStatus === "on_the_way"
                ? "Order is on the way to the customer."
                : "Order delivered.",
        },
      },
    },
  });
  publishOrderUpdate(order.id, { id: order.id, status: orderStatus });

  if (nextStatus === "delivered" && order.paymentMethod === "cod") {
    await prisma.$transaction([
      prisma.payment.update({
        where: { orderId: order.id },
        data: { status: "paid", paidAt: new Date() },
      }),
      prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: "paid" },
      }),
    ]);
  }

  res.json({ id: order.id, status: orderStatus });
}

export async function completeRelayHandoff(req: Request, res: Response) {
  const order = await prisma.order.findFirst({
    where: {
      id: String(req.params.id),
      relayRiderId: req.user!.id,
      status: "relay_pending",
      relayStatus: "pending",
    },
  });
  if (!order)
    return void res
      .status(409)
      .json({ error: "No pending relay handoff is assigned to you." });

  await prisma.order.update({
    where: { id: order.id },
    data: {
      relayStatus: "handoff_done",
      events: {
        create: {
          status: "relay_pending",
          note: "Relay rider confirmed handoff at the relay node.",
        },
      },
    },
  });

  res.json({ id: order.id, relayStatus: "handoff_done" });
}
