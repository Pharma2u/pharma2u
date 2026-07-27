import type { Request, Response } from "express";
import { prisma } from "../config/prisma";

function startOfTodayInIndia(now = new Date()) {
  const indiaOffsetMs = 5.5 * 60 * 60 * 1000;
  const indiaNow = new Date(now.getTime() + indiaOffsetMs);
  return new Date(
    Date.UTC(
      indiaNow.getUTCFullYear(),
      indiaNow.getUTCMonth(),
      indiaNow.getUTCDate(),
    ) - indiaOffsetMs,
  );
}

export async function riderDashboard(req: Request, res: Response) {
  const riderId = req.user!.id;
  const today = startOfTodayInIndia();
  const activeStatuses = [
    "rider_assigned",
    "picked_up",
    "relay_pending",
    "on_the_way",
  ] as const;

  const [rider, todayOrders, activeOrders, ledger] = await Promise.all([
    prisma.user.findUnique({
      where: { id: riderId },
      select: {
        name: true,
        applicationStatus: true,
        riderKyc: { select: { vehicleType: true, vehicleNumber: true } },
        riderLocation: {
          select: { lat: true, lng: true, isOnline: true, updatedAt: true },
        },
      },
    }),
    prisma.order.findMany({
      where: {
        OR: [{ riderId }, { relayRiderId: riderId }],
        updatedAt: { gte: today },
      },
      select: { id: true, status: true },
    }),
    prisma.order.findMany({
      where: {
        OR: [{ riderId }, { relayRiderId: riderId }],
        status: { in: [...activeStatuses] },
      },
      select: { total: true, paymentMethod: true, riderId: true },
    }),
    prisma.riderLedgerEntry.findMany({
      where: {
        riderId,
        createdAt: { gte: today },
        type: { in: ["delivery_earning", "relay_earning"] },
      },
      select: { amount: true },
    }),
  ]);

  if (!rider) {
    res.status(404).json({ error: "Rider account not found." });
    return;
  }

  const completed = todayOrders.filter(
    (order) => order.status === "delivered",
  ).length;
  const locationIsFresh =
    rider.riderLocation &&
    Date.now() - rider.riderLocation.updatedAt.getTime() <= 90_000;
  const activeCod = activeOrders
    .filter(
      (order) =>
        order.paymentMethod === "cod" && order.riderId === riderId,
    )
    .reduce((total, order) => total + order.total, 0);

  res.json({
    profile: {
      name: rider.name,
      verified: rider.applicationStatus === "approved",
      vehicleType: rider.riderKyc?.vehicleType ?? null,
      vehicleNumber: rider.riderKyc?.vehicleNumber ?? null,
    },
    availability: {
      isOnline: Boolean(rider.riderLocation?.isOnline && locationIsFresh),
      location: rider.riderLocation
        ? {
            lat: rider.riderLocation.lat,
            lng: rider.riderLocation.lng,
            updatedAt: rider.riderLocation.updatedAt,
          }
        : null,
    },
    today: {
      earnings: ledger.reduce((sum, entry) => sum + entry.amount, 0),
      trips: completed,
      completionRate:
        todayOrders.length > 0
          ? Math.round((completed / todayOrders.length) * 100)
          : null,
    },
    active: {
      count: activeOrders.length,
      codToCollect: activeCod,
    },
  });
}
