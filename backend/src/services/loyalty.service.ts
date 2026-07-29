import type { Prisma } from "../generated/prisma/client";

export async function refundRedeemedPoints(
  tx: Prisma.TransactionClient,
  order: { id: string; customerId: string; orderCode: string; loyaltyPointsUsed: number },
) {
  if (order.loyaltyPointsUsed <= 0) return;
  const existing = await tx.loyaltyTransaction.findUnique({
    where: { orderId_type: { orderId: order.id, type: "order_redemption_refund" } },
  });
  if (existing) return;
  await tx.loyaltyAccount.upsert({
    where: { customerId: order.customerId },
    create: { customerId: order.customerId, balance: order.loyaltyPointsUsed },
    update: {
      balance: { increment: order.loyaltyPointsUsed },
      lifetimeUsed: { decrement: order.loyaltyPointsUsed },
    },
  });
  await tx.loyaltyTransaction.create({
    data: {
      customerId: order.customerId,
      orderId: order.id,
      type: "order_redemption_refund",
      points: order.loyaltyPointsUsed,
      description: `Points restored for cancelled order ${order.orderCode}`,
    },
  });
}
