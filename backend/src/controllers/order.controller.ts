import type { Request, Response } from "express";
import { createHmac } from "crypto";
import { prisma } from "../config/prisma";
import { uploadPrivateDocument } from "../utils/uploadthing";

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
  const nonCancellableStatuses = ["rider_assigned", "picked_up", "relay_pending", "on_the_way", "delivered", "cancelled", "rejected", "disputed"];
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
  if (order.status !== "pending_verification") {
    res.status(409).json({ error: "Prescriptions can only be uploaded for orders awaiting verification." });
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
