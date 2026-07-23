import type { Request, Response } from "express";
import { prisma } from "../config/prisma";

const earningTypes = ["delivery_earning", "relay_earning"];

export async function riderFinance(req: Request, res: Response) {
  const riderId = req.user!.id;
  const deliveries = await prisma.order.findMany({
    where: {
      OR: [{ riderId }, { relayRiderId: riderId }],
      status: "delivered",
    },
    select: {
      id: true,
      orderCode: true,
      deliveredAt: true,
      paymentMethod: true,
      riderId: true,
      relayRiderId: true,
      riderEarning: true,
      isRelay: true,
      total: true,
      pharmacy: { select: { name: true } },
    },
    orderBy: { deliveredAt: "desc" },
    take: 100,
  });

  // Idempotently reconstruct ledger rows for deliveries completed before the
  // accounting feature was deployed, so the rider sees a complete history.
  await prisma.riderLedgerEntry.createMany({
    data: deliveries.flatMap((delivery) => {
      const isRelayRider = delivery.relayRiderId === riderId;
      const earning = isRelayRider
        ? delivery.riderEarning * 0.3
        : delivery.riderEarning * (delivery.isRelay ? 0.7 : 1);
      const rows = [
        {
          riderId,
          orderId: delivery.id,
          type: isRelayRider ? "relay_earning" : "delivery_earning",
          amount: earning,
          description: `${isRelayRider ? "Relay" : "Delivery"} earning for ${delivery.orderCode}`,
          paymentMethod: delivery.paymentMethod,
          createdAt: delivery.deliveredAt ?? undefined,
        },
      ];
      if (!isRelayRider && delivery.paymentMethod === "cod") {
        rows.push({
          riderId,
          orderId: delivery.id,
          type: "cod_collected",
          amount: -delivery.total,
          description: `COD cash collected for ${delivery.orderCode}`,
          paymentMethod: delivery.paymentMethod,
          createdAt: delivery.deliveredAt ?? undefined,
        });
      }
      return rows;
    }),
    skipDuplicates: true,
  });

  const entries = await prisma.riderLedgerEntry.findMany({
    where: { riderId },
    include: { order: { select: { orderCode: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const totalEarnings = entries
    .filter((entry) => earningTypes.includes(entry.type))
    .reduce((sum, entry) => sum + entry.amount, 0);
  const codCollected = Math.abs(
    entries
      .filter((entry) => entry.type === "cod_collected")
      .reduce((sum, entry) => sum + entry.amount, 0),
  );
  const onlineEarnings = entries
    .filter(
      (entry) =>
        earningTypes.includes(entry.type) && entry.paymentMethod !== "cod",
    )
    .reduce((sum, entry) => sum + entry.amount, 0);
  const balance = entries.reduce((sum, entry) => sum + entry.amount, 0);

  res.json({
    summary: {
      totalEarnings,
      codCollected,
      onlineEarnings,
      balance,
      settlementDirection:
        balance > 0
          ? "platform_owes_rider"
          : balance < 0
            ? "rider_owes_platform"
            : "settled",
      settlementAmount: Math.abs(balance),
    },
    entries: entries.map((entry) => ({
      id: entry.id,
      orderCode: entry.order?.orderCode ?? null,
      type: entry.type,
      amount: entry.amount,
      description: entry.description,
      paymentMethod: entry.paymentMethod,
      createdAt: entry.createdAt,
    })),
    deliveries: deliveries.map((delivery) => ({
      id: delivery.id,
      orderCode: delivery.orderCode,
      deliveredAt: delivery.deliveredAt,
      paymentMethod: delivery.paymentMethod,
      pharmacyName: delivery.pharmacy.name,
      earning:
        delivery.relayRiderId === riderId
          ? delivery.riderEarning * 0.3
          : delivery.riderEarning * (delivery.isRelay ? 0.7 : 1),
    })),
  });
}
