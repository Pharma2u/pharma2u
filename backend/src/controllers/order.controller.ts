import type { Request, Response } from "express";
import { createHash, createHmac, timingSafeEqual } from "crypto";
import { prisma } from "../config/prisma";
import {
  deleteUploadedFiles,
  signedDocumentUrl,
  uploadPrivateDocument,
} from "../utils/uploadthing";
import {
  failAndCancelOnlineOrder,
  markOrderPaymentPaid,
  triggerOrderRefund,
} from "../services/payment-lifecycle.service";
import { fetchRazorpayPayment } from "../services/razorpay.service";

function body(v: unknown) {
  if (!v || typeof v !== "object" || Array.isArray(v))
    throw Object.assign(new Error("Request body must be an object."), {
      status: 400,
    });
  return v as Record<string, unknown>;
}

// NOTE: createOrder was removed — use placeMatchedOrder in order.operations.controller.ts

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
  const { deliveryOtp, ...orderDetails } = order;
  res.json({
    ...orderDetails,
    deliveryOtp: order.status === "on_the_way" ? deliveryOtp : null,
  });

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
  const nonCancellableStatuses = [
    "rider_assigned",
    "picked_up",
    "relay_pending",
    "on_the_way",
    "delivered",
    "cancelled",
    "rejected",
    "disputed",
  ];
  if (nonCancellableStatuses.includes(order.status)) {
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
  let refundStatus: string | null = null;
  if (order.paymentStatus === "paid") {
    try {
      refundStatus = (await triggerOrderRefund(id))?.status ?? null;
    } catch (error) {
      console.error(
        "Razorpay refund initiation failed after cancellation",
        error,
      );
      refundStatus = "failed";
    }
  }
  res.json({ id, status: "cancelled", refundStatus });
}


export async function uploadPrescription(req: Request, res: Response) {
  const order = await prisma.order.findFirst({
    where: { id: String(req.params.id), customerId: req.user!.id },
  });
  if (!order) {
    res.status(404).json({ error: "Order not found." });
    return;
  }
  if (order.status !== "pending_verification") {
    res.status(409).json({
      error:
        "Prescriptions can only be uploaded for orders awaiting verification.",
    });
    return;
  }
  if (!req.file)
    throw Object.assign(new Error("Prescription image is required."), {
      status: 400,
    });
  const path = await uploadPrivateDocument(req.file, "prescription");
  try {
    await prisma.$transaction([
      prisma.order.update({
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
      }),
      prisma.prescription.create({
        data: { customerId: req.user!.id, path },
      }),
    ]);
  } catch (error) {
    await deleteUploadedFiles([path], "prescription");
    throw error;
  }
  res.status(201).json({ path });
}

function safeSignatureMatch(expected: string, received: string) {
  const left = Buffer.from(expected, "utf8");
  const right = Buffer.from(received, "utf8");
  return left.length === right.length && timingSafeEqual(left, right);
}



export async function verifyRazorpayPayment(req: Request, res: Response) {
  const input = body(req.body);
  const orderId = String(req.params.id);

  const providerOrderId =
    typeof input.razorpay_order_id === "string" ? input.razorpay_order_id : "";

  const providerPaymentId =
    typeof input.razorpay_payment_id === "string"
      ? input.razorpay_payment_id
      : "";
  const signature =
    typeof input.razorpay_signature === "string"
      ? input.razorpay_signature
      : "";

  if (!providerOrderId || !providerPaymentId || !signature) {
    res.status(400).json({ error: "Razorpay payment details are incomplete." });
    return;
  }

  const payment = await prisma.payment.findFirst({
    where: { orderId, providerOrderId, order: { customerId: req.user!.id } },
  });

  if (!payment) {
    res.status(404).json({ error: "Payment order not found." });
    return;
  }

  const secret = (
    process.env.RAZORPAY_KEY_SECRET ?? process.env.RAZORPAY_SECRET
  )?.trim();

  if (!secret) {
    res.status(503).json({ error: "Razorpay is not configured." });
    return;
  }

  const expected = createHmac("sha256", secret)
    .update(`${payment.providerOrderId}|${providerPaymentId}`)
    .digest("hex");

  if (!safeSignatureMatch(expected, signature)) {
    res.status(401).json({ error: "Payment signature verification failed." });
    return;
  }

  const providerPayment = await fetchRazorpayPayment(providerPaymentId);
  if (
    providerPayment.order_id !== payment.providerOrderId ||
    providerPayment.status !== "captured"
  ) {
    res.status(409).json({ error: "Payment has not been captured yet." });
    return;
  }

  const result = await markOrderPaymentPaid({
    providerOrderId,
    providerPaymentId,
    amount: providerPayment.amount,
    currency: providerPayment.currency,
    rawPayload: providerPayment,
  });

  if (result?.wasCancelled) {
    try {
      await triggerOrderRefund(orderId);
    } catch (error) {
      console.error(
        "Refund initiation failed for a late captured payment",
        error,
      );
    }
  }

  res.json({
    id: orderId,
    paymentStatus: "paid",
    status: result?.order.status,
  });
}

export async function markRazorpayPaymentFailed(req: Request, res: Response) {
  const input = body(req.body);
  const orderId = String(req.params.id);
  const order = await prisma.order.findFirst({
    where: { id: orderId, customerId: req.user!.id },
  });

  if (!order) {
    res.status(404).json({ error: "Order not found." });
    return;
  }

  const reason =
    typeof input.reason === "string" && input.reason.trim()
      ? input.reason.trim().slice(0, 500)
      : "Online payment was not completed.";
  await failAndCancelOnlineOrder(orderId, reason, input);

  res.json({ id: orderId, status: "cancelled", paymentStatus: "failed" });
}

type WebhookEntity = Record<string, unknown>;

export async function razorpayWebhook(req: Request, res: Response) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    res.status(503).json({ error: "Payment webhook is not configured." });
    return;
  }

  const signature = req.header("x-razorpay-signature");

  if (!Buffer.isBuffer(req.body)) {
    res.status(400).json({ error: "Webhook body must be raw bytes." });
    return;
  }

  const rawBody = req.body as Buffer;

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");

  if (!signature || !safeSignatureMatch(expected, signature)) {
    res.status(401).json({ error: "Invalid payment webhook signature." });
    return;
  }

  const webhook = JSON.parse(rawBody.toString("utf8")) as {
    event?: string;
    payload?: {
      payment?: { entity?: WebhookEntity };
      refund?: { entity?: WebhookEntity };
    };
  };

  const eventType = webhook.event ?? "unknown";

  const eventId =
    req.header("x-razorpay-event-id") ??
    createHash("sha256").update(rawBody).digest("hex");

  const savedEvent = await prisma.paymentWebhookEvent.upsert({
    where: { eventId },
    create: {
      provider: "razorpay",
      eventId,
      eventType,
      payload: webhook as never,
    },
    update: {},
  });

  if (savedEvent.processedAt) {
    res.status(200).json({ ok: true, duplicate: true });
    return;
  }

  const payment = webhook.payload?.payment?.entity;

  const providerOrderId =
    typeof payment?.order_id === "string" ? payment.order_id : null;
  if (
    (eventType === "payment.captured" || eventType === "order.paid") &&
    providerOrderId
  ) {
    const result = await markOrderPaymentPaid({
      providerOrderId,
      providerPaymentId: String(payment?.id ?? ""),
      amount: Number(payment?.amount),
      currency: String(payment?.currency ?? ""),
      rawPayload: webhook,
    });
    if (result?.wasCancelled) {
      try {
        await triggerOrderRefund(result.order.id);
      } catch (error) {
        console.error(
          "Refund initiation failed for a late captured webhook",
          error,
        );
      }
    }
  } else if (eventType === "payment.failed" && providerOrderId) {
    const localPayment = await prisma.payment.findUnique({
      where: { providerOrderId },
    });
    if (localPayment) {
      await failAndCancelOnlineOrder(
        localPayment.orderId,
        typeof payment?.error_description === "string"
          ? payment.error_description
          : "Online payment failed.",
        webhook,
      );
    }
  }

  const refundEntity = webhook.payload?.refund?.entity;
  const providerRefundId =
    typeof refundEntity?.id === "string" ? refundEntity.id : null;
  const providerPaymentId =
    typeof refundEntity?.payment_id === "string"
      ? refundEntity.payment_id
      : null;
  if (
    providerRefundId &&
    providerPaymentId &&
    eventType.startsWith("refund.")
  ) {
    const localPayment = await prisma.payment.findUnique({
      where: { providerPaymentId },
    });
    if (localPayment) {
      const status =
        eventType === "refund.processed"
          ? "completed"
          : eventType === "refund.failed"
            ? "failed"
            : "processing";
      await prisma.refund.upsert({
        where: { orderId: localPayment.orderId },
        create: {
          orderId: localPayment.orderId,
          amount: Number(refundEntity?.amount ?? 0) / 100,
          providerRef: providerRefundId,
          reason: "Razorpay refund event",
          status,
          processedAt: status === "completed" ? new Date() : null,
          rawPayload: webhook as never,
        },
        update: {
          providerRef: providerRefundId,
          status,
          processedAt: status === "completed" ? new Date() : undefined,
          errorReason:
            status === "failed"
              ? "Razorpay reported that the refund failed."
              : null,
          rawPayload: webhook as never,
        },
      });
      if (status === "completed") {
        await prisma.$transaction([
          prisma.payment.update({
            where: { id: localPayment.id },
            data: { status: "refunded" },
          }),
          prisma.order.update({
            where: { id: localPayment.orderId },
            data: { paymentStatus: "refunded" },
          }),
        ]);
      }
    }
  }

  await prisma.paymentWebhookEvent.update({
    where: { id: savedEvent.id },
    data: { processedAt: new Date() },
  });

  res.status(200).json({ ok: true });
}


export async function getVendorPrescriptionUrl(req: Request, res: Response) {
  const order = await prisma.order.findFirst({
    where: {
      id: String(req.params.id),
      requiresPrescription: true,
      prescriptionPath: { not: null },
      pharmacy: { vendorUserId: req.user!.id },
    },
    select: { prescriptionPath: true },
  });

  if (!order?.prescriptionPath) {
    res.status(404).json({ error: "Prescription not found." });
    return;
  }

  res.json({ url: await signedDocumentUrl(order.prescriptionPath) });
}
