"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { io, type Socket } from "socket.io-client";

type RiderLocation = {
  riderId: string;
  lat: number;
  lng: number;
  isOnline: boolean;
  recordedAt: number;
};

type TrackingSubscription = { ok: boolean; location?: RiderLocation | null };

type Coordinates = { lat: number; lng: number };

const fallbackCenter: [number, number] = [78.4867, 17.385];
const mapStyle: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

function socketUrl() {
  return (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api")
    .replace(/\/api\/?$/, "")
    .replace(/\/$/, "");
}

export function LiveRiderMap({
  orderId,
  token,
  destination,
}: {
  orderId: string;
  token: string;
  destination: Coordinates | null;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const riderMarker = useRef<maplibregl.Marker | null>(null);
  const [location, setLocation] = useState<RiderLocation | null>(null);
  const [connected, setConnected] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => setCurrentTime(Date.now()), 15_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!container.current || map.current) return;
    const center: [number, number] = destination
      ? [destination.lng, destination.lat]
      : fallbackCenter;
    const instance = new maplibregl.Map({
      container: container.current,
      center,
      zoom: destination ? 14 : 11,
      style: mapStyle,
    });
    if (destination) {
      new maplibregl.Marker({ color: "#2EB68F" })
        .setLngLat([destination.lng, destination.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 20 }).setText("Delivery address"),
        )
        .addTo(instance);
    }
    map.current = instance;
    return () => {
      instance.remove();
      map.current = null;
      riderMarker.current = null;
    };
  }, [destination]);

  useEffect(() => {
    const socket: Socket = io(socketUrl(), {
      auth: { token },
      transports: ["websocket", "polling"],
    });
    const subscribe = () => {
      socket.emit(
        "tracking:subscribe",
        orderId,
        (result: TrackingSubscription) => {
          setConnected(result.ok);
          if (result.location) setLocation(result.location);
        },
      );
    };
    const onLocation = (next: RiderLocation) => setLocation(next);
    socket.on("connect", subscribe);
    socket.on("rider:location", onLocation);
    socket.on("connect_error", () => setConnected(false));
    return () => {
      socket.close();
    };
  }, [orderId, token]);

  useEffect(() => {
    if (!location || !map.current) return;
    const point: [number, number] = [location.lng, location.lat];
    if (!riderMarker.current) {
      riderMarker.current = new maplibregl.Marker({ color: "#1976A8" })
        .setLngLat(point)
        .setPopup(
          new maplibregl.Popup({ offset: 20 }).setText("Delivery partner"),
        )
        .addTo(map.current);
    } else {
      riderMarker.current.setLngLat(point);
    }
    map.current.flyTo({
      center: point,
      zoom: 15,
      duration: 800,
      essential: true,
    });
  }, [location]);

  const isStale = location && currentTime > 0 && currentTime - location.recordedAt > 70_000;
  const message = !connected
    ? "Connecting to live tracking…"
    : !location
      ? "Waiting for your delivery partner’s live location."
      : isStale || !location.isOnline
        ? "Your delivery partner is temporarily offline."
        : "Your delivery partner is moving toward you.";

  return (
    <section className="rounded-3xl border border-[#E5EAE8] bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#17212B]">
            Live delivery map
          </h2>
          <p className="mt-0.5 text-xs text-[#64717D]">{message}</p>
        </div>
        <span className="rounded-full bg-[#EAF7FF] px-3 py-1 text-xs font-bold text-[#1976A8]">
          Live
        </span>
      </div>
      <div
        ref={container}
        className="mt-5 h-72 w-full overflow-hidden rounded-2xl border border-[#DDE5E2]"
        aria-label="Live delivery tracking map"
      />
    </section>
  );
}
