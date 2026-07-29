import type { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { Prisma, type OrderStatus } from "../generated/prisma/client";

const ACTIVE: OrderStatus[] = [
  "rider_assigned",
  "picked_up",
  "relay_pending",
  "on_the_way",
];
const WAITING: OrderStatus[] = ["verified", "awaiting_rider"];
const STALE_LOCATION_MS = 90_000;
const DELAY_GRACE_MS = 5 * 60_000;

export async function getLiveOperations(_req: Request, res: Response) {
  const now = new Date();
  const [orders, riders, pharmacies, failedPayments] = await Promise.all([
    prisma.order.findMany({
      where: { status: { in: [...ACTIVE, ...WAITING] } },
      include: {
        customer: { select: { name: true } },
        pharmacy: {
          select: { id: true, name: true, address: true, isOpen: true },
        },
        rider: { select: { id: true, name: true } },
        events: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
      take: 150,
    }),
    prisma.user.findMany({
      where: { role: "rider", applicationStatus: "approved" },
      select: {
        id: true,
        name: true,
        riderLocation: {
          select: { lat: true, lng: true, isOnline: true, updatedAt: true },
        },
        ordersAsRider: {
          where: { status: { in: ACTIVE } },
          select: { id: true, orderCode: true, status: true },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        address: string;
        isOpen: boolean;
        lat: number | null;
        lng: number | null;
      }>
    >(Prisma.sql`
      SELECT
        id,
        name,
        address,
        "isOpen",
        ST_Y(location::geometry)::float AS lat,
        ST_X(location::geometry)::float AS lng
      FROM pharmacies
    `),
    prisma.payment.count({
      where: {
        status: "failed",
        updatedAt: { gte: new Date(now.getTime() - 86_400_000) },
      },
    }),
  ]);
  const delayed = orders.filter(
    (order) =>
      order.estimatedDeliveryTime &&
      order.estimatedDeliveryTime.getTime() + DELAY_GRACE_MS < now.getTime(),
  );
  const riderItems = riders.map((rider) => {
    const location = rider.riderLocation;
    const online = Boolean(
      location?.isOnline &&
      now.getTime() - location.updatedAt.getTime() <= STALE_LOCATION_MS,
    );
    return {
      id: rider.id,
      name: rider.name,
      status: !online
        ? "offline"
        : rider.ordersAsRider.length
          ? "busy"
          : "available",
      location: location
        ? {
            lat: location.lat,
            lng: location.lng,
            isOnline: online,
            updatedAt: location.updatedAt.toISOString(),
          }
        : null,
      currentOrder: rider.ordersAsRider[0] ?? null,
    };
  });
  const orderItems = orders.map((order) => ({
    id: order.id,
    orderCode: order.orderCode,
    customer: order.customer.name,
    vendor: order.pharmacy.name,
    rider: order.rider?.name ?? null,
    status: order.status,
    eta: order.estimatedDeliveryTime?.toISOString() ?? null,
    updatedAt: order.updatedAt.toISOString(),
    drop:
      order.dropLat !== null && order.dropLng !== null
        ? { lat: order.dropLat, lng: order.dropLng }
        : null,
    total: order.total,
  }));
  const criticalAlerts = [
    ...delayed.map((order) => ({
      id: `delay-${order.id}`,
      type: "late_order",
      label: `Order ${order.orderCode} is delayed`,
      count: 1,
      orderId: order.id,
    })),
    ...(failedPayments
      ? [
          {
            id: "payment-failures",
            type: "payment_failure",
            label: "Payment failures in the last 24 hours",
            count: failedPayments,
          },
        ]
      : []),
    ...pharmacies
      .filter(
        (p) =>
          !p.isOpen &&
          orders.some(
            (o) =>
              o.pharmacyId === p.id && ACTIVE.includes(o.status as OrderStatus),
          ),
      )
      .map((p) => ({
        id: `vendor-${p.id}`,
        type: "vendor_offline",
        label: `${p.name} is offline with active orders`,
        count: 1,
      })),
  ].slice(0, 10);
  res.json({
    generatedAt: now.toISOString(),
    metrics: {
      ordersLive: orders.filter((o) => ACTIVE.includes(o.status as OrderStatus))
        .length,
      ordersWaiting: orders.filter((o) =>
        WAITING.includes(o.status as OrderStatus),
      ).length,
      ridersOnline: riderItems.filter((r) => r.status !== "offline").length,
      ridersBusy: riderItems.filter((r) => r.status === "busy").length,
      ridersAvailable: riderItems.filter((r) => r.status === "available")
        .length,
      vendorsOpen: pharmacies.filter((p) => p.isOpen).length,
      delayedOrders: delayed.length,
      criticalAlerts: criticalAlerts.reduce((sum, item) => sum + item.count, 0),
    },
    riders: riderItems,
    pharmacies: pharmacies.map(({ lat, lng, ...pharmacy }) => ({
      ...pharmacy,
      location:
        lat !== null && lng !== null
          ? { lat, lng }
          : null,
    })),
    orders: orderItems,
    delayedOrders: orderItems.filter((order) =>
      delayed.some((item) => item.id === order.id),
    ),
    activities: orders.slice(0, 12).map((order) => ({
      id: order.id,
      at: (order.events[0]?.createdAt ?? order.updatedAt).toISOString(),
      type: order.status,
      message: order.events[0]?.note ?? `Order ${order.orderCode} updated.`,
      orderCode: order.orderCode,
    })),
    criticalAlerts,
  });
}
