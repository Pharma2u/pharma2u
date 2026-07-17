import type { Server as HttpServer } from "node:http";
import { createAdapter } from "@socket.io/redis-adapter";
import { Server } from "socket.io";
import { prisma } from "./config/prisma";
import { redis } from "./config/redis";
import { getLiveRiderLocation } from "./services/rider-location.service";
import { verifyAuthToken } from "./utils/jwt";

let io: Server | undefined;

export async function initializeRealtime(
  server: HttpServer,
  origins: string[],
) {
  const publisher = redis.duplicate({
    lazyConnect: true,
    maxRetriesPerRequest: null,
  });
  const subscriber = publisher.duplicate({
    lazyConnect: true,
    maxRetriesPerRequest: null,
  });
  await Promise.all([publisher.connect(), subscriber.connect()]);

  io = new Server(server, { cors: { origin: origins, credentials: true } });
  io.adapter(createAdapter(publisher, subscriber));
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (typeof token !== "string") throw new Error("Missing token");
      const payload = verifyAuthToken(token);
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, role: true },
      });
      if (!user) throw new Error("Unknown user");
      socket.data.user = user;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });
  io.on("connection", (socket) => {
    socket.on(
      "tracking:subscribe",
      async (
        orderId: unknown,
        done?: (result: {
          ok: boolean;
          location?: LiveRiderLocation | null;
        }) => void,
      ) => {
        try {
          if (typeof orderId !== "string") return done?.({ ok: false });
          const user = socket.data.user as { id: string; role: string };
          const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: { customerId: true, riderId: true, relayRiderId: true },
          });
          const allowed =
            order &&
            (user.role === "admin" ||
              user.id === order.customerId ||
              user.id === order.riderId ||
              user.id === order.relayRiderId);
          if (!allowed) return done?.({ ok: false });
          const riderIds = [order.riderId, order.relayRiderId].filter(
            (id): id is string => Boolean(id),
          );
          for (const riderId of riderIds) socket.join(`rider:${riderId}`);
          const locations = await Promise.all(
            riderIds.map(getLiveRiderLocation),
          );
          done?.({ ok: true, location: locations[0] ?? null });
        } catch {
          done?.({ ok: false });
        }
      },
    );
  });
}

export function publishRiderLocation(
  location: Pick<
    LiveRiderLocation,
    "riderId" | "lat" | "lng" | "isOnline" | "recordedAt"
  >,
) {
  io?.to(`rider:${location.riderId}`).emit("rider:location", location);
}

type LiveRiderLocation = {
  riderId: string;
  lat: number;
  lng: number;
  isOnline: boolean;
  recordedAt: number;
};
