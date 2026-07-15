import { prisma } from "../config/prisma";
import { createRazorpayRefund } from "./razorpay.service";

export function amountToPaise(amount: number) {
  const paise = Math.round((amount + Number.EPSILON) * 100);
  if (!Number.isSafeInteger(paise) || paise < 100) {
    throw Object.assign(
      new Error("Online payment amount must be at least INR 1."),
      {
        status: 400,
      },
    );
  }
  return paise;
}

export async function markOrderPaymentPaid(input: {
  providerOrderId: string;
  providerPaymentId: string;
  amount: number;
  currency: string;
  rawPayload: unknown;
}) {
  const payment = await prisma.payment.findUnique({
    where: { providerOrderId: input.providerOrderId },
    include: { order: true },
  });
  if (!payment) return null;

  if (
    input.amount !== amountToPaise(payment.amount) ||
    input.currency !== payment.currency
  ) {
    throw Object.assign(
      new Error("Payment amount or currency does not match the order."),
      {
        status: 409,
      },
    );
  }

  return prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        providerPaymentId: input.providerPaymentId,
        status: "paid",
        failureReason: null,
        paidAt: payment.paidAt ?? new Date(),
        rawPayload: input.rawPayload as never,
      },
    });
    const shouldAutoVerify =
      !payment.order.requiresPrescription &&
      payment.order.status === "pending_verification";
    const order = await tx.order.update({
      where: { id: payment.orderId },
      data: {
        paymentStatus: "paid",
        paymentRef: input.providerPaymentId,
        ...(shouldAutoVerify
          ? {
              status: "verified" as const,
              events: {
                create: {
                  status: "verified" as const,
                  note: "Online payment confirmed.",
                },
              },
            }
          : {}),
      },
    });
    return { order, wasCancelled: payment.order.status === "cancelled" };
  });
}

export async function failAndCancelOnlineOrder(
  orderId: string,
  reason: string,
  rawPayload?: unknown,
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (
      !order ||
      order.paymentMethod === "cod" ||
      order.paymentStatus === "paid"
    ) {
      return order;
    }
    await tx.payment.updateMany({
      where: { orderId, status: { not: "paid" } },
      data: {
        status: "failed",
        failureReason: reason,
        ...(rawPayload === undefined
          ? {}
          : { rawPayload: rawPayload as never }),
      },
    });
    if (order.status !== "cancelled") {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: "cancelled",
          paymentStatus: "failed",
          cancelledAt: new Date(),
          cancelledBy: "payment_system",
          cancelledReason: reason,
          events: { create: { status: "cancelled", note: reason } },
        },
      });
      const items = await tx.orderItem.findMany({
        where: { orderId },
        select: { productId: true, qty: true },
      });
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.qty } },
        });
      }
    } else {
      await tx.order.update({
        where: { id: orderId },
        data: { paymentStatus: "failed" },
      });
    }
    return order;
  });
}

export async function triggerOrderRefund(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payment: true, refund: true },
  });
  if (
    !order ||
    order.paymentStatus !== "paid" ||
    order.payment?.provider !== "razorpay" ||
    !order.payment.providerPaymentId
  ) {
    return order?.refund ?? null;
  }

  const reason = order.cancelledReason ?? "Order cancelled";
  const refund = await prisma.refund.upsert({
    where: { orderId },
    create: { orderId, amount: order.total, reason },
    update: {},
  });
  const claimed = await prisma.refund.updateMany({
    where: { id: refund.id, status: { in: ["pending", "failed"] } },
    data: { status: "processing", errorReason: null },
  });
  if (claimed.count === 0) return refund;

  try {
    const providerRefund = await createRazorpayRefund(
      order.payment.providerPaymentId,
      {
        amount: amountToPaise(refund.amount),
        orderId,
        reason,
      },
    );
    const completed = providerRefund.status === "processed";
    const updated = await prisma.refund.update({
      where: { id: refund.id },
      data: {
        providerRef: providerRefund.id,
        status: completed ? "completed" : "processing",
        processedAt: completed ? new Date() : null,
        rawPayload: providerRefund as never,
      },
    });
    if (completed) {
      await prisma.$transaction([
        prisma.payment.update({
          where: { orderId },
          data: { status: "refunded" },
        }),
        prisma.order.update({
          where: { id: orderId },
          data: { paymentStatus: "refunded" },
        }),
      ]);
    }
    return updated;
  } catch (error) {
    await prisma.refund.update({
      where: { id: refund.id },
      data: {
        status: "failed",
        errorReason:
          error instanceof Error ? error.message : "Refund request failed.",
      },
    });
    throw error;
  }
}
