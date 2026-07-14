import type { Request, Response } from "express";
import { createHmac, randomUUID } from "crypto";
import { prisma } from "../config/prisma";
import { uploadPrivateDocument } from "../utils/uploadthing";
const statuses = [
  "pending_verification",
  "verified",
  "rejected",
  "awaiting_rider",
  "rider_assigned",
  "picked_up",
  "relay_pending",
  "relay_failed",
  "on_the_way",
  "delivered",
  "cancelled",
  "disputed",
] as const;


function body(v: unknown) {
  if (!v || typeof v !== "object" || Array.isArray(v))
    throw Object.assign(new Error("Request body must be an object."), {
      status: 400,
    });
  return v as Record<string, unknown>;
}
function orderCode() {
  return `GC-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`;
}



export async function createOrder(req: Request, res: Response) {
  const b = body(req.body),
    rawItems = b.items;
  if (!Array.isArray(rawItems) || !rawItems.length)
    throw Object.assign(new Error("At least one item is required."), {
      status: 400,
    });
  const dropAddress =
    typeof b.dropAddress === "string" ? b.dropAddress.trim() : "";
  const dropLat = Number(b.dropLat),
    dropLng = Number(b.dropLng);
  if (!dropAddress || !Number.isFinite(dropLat) || !Number.isFinite(dropLng))
    throw Object.assign(
      new Error("A valid delivery address and coordinates are required."),
      { status: 400 },
    );
  const paymentMethod = b.paymentMethod;
  if (!["upi", "card", "cod"].includes(String(paymentMethod)))
    throw Object.assign(new Error("Invalid payment method."), { status: 400 });
  const ids = rawItems.map((x) =>
    typeof x === "object" && x ? String((x as any).productId) : "",
  );
  const products = await prisma.product.findMany({
    where: { id: { in: ids }, isActive: true },
    include: { pharmacy: true },
  });
  if (products.length !== rawItems.length)
    throw Object.assign(new Error("One or more products are unavailable."), {
      status: 400,
    });
  const pharmacyId = products[0]!.pharmacyId;
  if (products.some((p) => p.pharmacyId !== pharmacyId))
    throw Object.assign(
      new Error("Items from different pharmacies must be ordered separately."),
      { status: 400 },
    );
  const items = rawItems.map((x) => {
    const i = x as any,
      p = products.find((v) => v.id === String(i.productId))!,
      qty = Number(i.qty);
    if (!Number.isInteger(qty) || qty < 1 || p.stock < qty)
      throw Object.assign(new Error(`Insufficient stock for ${p.name}.`), {
        status: 400,
      });
    return { product: p, qty };
  });
  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.qty, 0),
    deliveryFee = Number(b.deliveryFee) || 0,
    requiresPrescription = items.some((i) => i.product.category !== "otc");
  const order = await prisma.$transaction(async (tx) => {
    for (const i of items) {
      const updated = await tx.product.updateMany({
        where: { id: i.product.id, stock: { gte: i.qty } },
        data: { stock: { decrement: i.qty } },
      });
      if (!updated.count)
        throw Object.assign(
          new Error(`Insufficient stock for ${i.product.name}.`),
          { status: 409 },
        );
    }
    const created = await tx.order.create({
      data: {
        orderCode: orderCode(),
        customerId: req.user!.id,
        pharmacyId,
        status:
          requiresPrescription || paymentMethod !== "cod"
            ? "pending_verification"
            : "verified",
        requiresPrescription,
        subtotal,
        deliveryFee,
        total: subtotal + deliveryFee,
        paymentMethod: paymentMethod as any,
        dropAddress,
        dropLat,
        dropLng,
        deliveryInstructions:
          typeof b.deliveryInstructions === "string"
            ? b.deliveryInstructions.trim() || null
            : null,
        estimatedDeliveryTime: new Date(
          Date.now() + Math.max(1, Number(b.estimatedMinutes) || 30) * 60000,
        ),
        items: {
          create: items.map((i) => ({
            productId: i.product.id,
            name: i.product.name,
            qty: i.qty,
            price: i.product.price,
          })),
        },
        events: {
          create: {
            status:
              requiresPrescription || paymentMethod !== "cod"
                ? "pending_verification"
                : "verified",
            note: requiresPrescription
              ? "Prescription required."
              : "Order placed.",
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
    return created;
  });
  res.status(201).json(order);
}


export async function listMyOrders(req: Request, res: Response) {
  res.json({
    items: await prisma.order.findMany({
      where: { customerId: req.user!.id },
      include: {
        items: true,
        pharmacy: { select: { name: true, address: true } },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  });
}


export async function getMyOrder(req: Request, res: Response) {
  const order = await prisma.order.findFirst({
    where: { id: String(req.params.id), customerId: req.user!.id },
    include: {
      items: {
        include: {
          product: {
            include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
          },
        },
      },
      pharmacy: true,
      events: { orderBy: { createdAt: "asc" } },
      payment: true,
      refund: true,
    },
  });
  if (!order) {
    res.status(404).json({ error: "Order not found." });
    return;
  }
  res.json(order);
}



export async function cancelMyOrder(req: Request, res: Response) {
  const id = String(req.params.id),
    b = body(req.body);
  const order = await prisma.order.findFirst({
    where: { id, customerId: req.user!.id },
  });
  if (!order) {
    res.status(404).json({ error: "Order not found." });
    return;
  }
  if (
    ["picked_up", "on_the_way", "delivered", "cancelled"].includes(order.status)
  ) {
    res.status(409).json({ error: "This order can no longer be cancelled." });
    return;
  }
  const reason =
    typeof b.reason === "string" ? b.reason.trim() : "Cancelled by customer";
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id },
      data: {
        status: "cancelled",
        cancelledAt: new Date(),
        cancelledBy: req.user!.id,
        cancelledReason: reason,
        events: { create: { status: "cancelled", note: reason } },
      },
    });
    for (const item of await tx.orderItem.findMany({
      where: { orderId: id },
      select: { productId: true, qty: true },
    }))
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.qty } },
      });
    if (order.paymentStatus === "paid")
      await tx.refund.create({
        data: { orderId: id, amount: order.total, reason },
      });
  });
  res.json({ id, status: "cancelled" });
}



export async function uploadPrescription(req: Request, res: Response) {
  const order = await prisma.order.findFirst({
    where: { id: String(req.params.id), customerId: req.user!.id },
  });
  if (!order) {
    res.status(404).json({ error: "Order not found." });
    return;
  }
  if (!req.file)
    throw Object.assign(new Error("Prescription image is required."), {
      status: 400,
    });
  const path = await uploadPrivateDocument(req.file, "prescription");
  await prisma.order.update({
    where: { id: order.id },
    data: {
      prescriptionPath: path,
      events: {
        create: {
          status: "pending_verification",
          note: "Prescription uploaded.",
        },
      },
    },
  });
  await prisma.prescription.create({
    data: { customerId: req.user!.id, path },
  });
  res.status(201).json({ path });
}


export async function razorpayWebhook(req: Request, res: Response) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    res.status(503).json({ error: "Payment webhook is not configured." });
    return;
  }
  const signature = req.header("x-razorpay-signature"),
    payload = JSON.stringify(req.body);
  if (
    !signature ||
    createHmac("sha256", secret).update(payload).digest("hex") !== signature
  ) {
    res.status(401).json({ error: "Invalid payment webhook signature." });
    return;
  }
  const payment = (req.body as any).payload?.payment?.entity;
  if (payment?.order_id) {
    await prisma.payment.updateMany({
      where: { providerOrderId: payment.order_id },
      data: {
        providerPaymentId: payment.id,
        status: payment.status === "captured" ? "paid" : "failed",
        paidAt: payment.status === "captured" ? new Date() : null,
        rawPayload: req.body as any,
      },
    });
    await prisma.order.updateMany({
      where: { payment: { providerOrderId: payment.order_id } },
      data: {
        paymentStatus: payment.status === "captured" ? "paid" : "failed",
      },
    });
  }
  res.status(200).json({ ok: true });
}
