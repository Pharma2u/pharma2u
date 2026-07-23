"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { io, type Socket } from "socket.io-client";

type RiderLocation = {
  riderId: string;
  lat: number;
  lng: number;
  isOnline: boolean;
  recordedAt: number;
};
type Coordinates = { lat: number; lng: number };
type TrackingSubscription = { ok: boolean; location?: RiderLocation | null };
type Route = { coordinates: number[][]; distance: number; duration: number };

const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const fallbackCenter: [number, number] = [78.4867, 17.385];
const fullRouteSource = "delivery-route";
const coveredSource = "delivery-route-covered";
const remainingSource = "delivery-route-remaining";

function socketUrl() {
  return (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api")
    .replace(/\/api\/?$/, "")
    .replace(/\/$/, "");
}
function line(coordinates: number[][]) {
  return {
    type: "Feature" as const,
    properties: {},
    geometry: { type: "LineString" as const, coordinates },
  };
}
function formatDistance(metres: number) {
  return metres >= 1000
    ? `${(metres / 1000).toFixed(1)} km`
    : `${Math.round(metres)} m`;
}
function formatMinutes(seconds: number) {
  return `${Math.max(1, Math.round(seconds / 60))} min`;
}

export function LiveRiderMap({
  orderId,
  token,
  destination,
  origin,
}: {
  orderId: string;
  token: string;
  destination: Coordinates | null;
  origin: Coordinates | null;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const riderMarker = useRef<mapboxgl.Marker | null>(null);
  const route = useRef<Route | null>(null);
  const [location, setLocation] = useState<RiderLocation | null>(null);
  const [connected, setConnected] = useState(false);
  const [progress, setProgress] = useState<{
    distance: number;
    duration: number;
  } | null>(null);

  useEffect(() => {
    if (!container.current || map.current || !mapboxToken) return;
    mapboxgl.accessToken = mapboxToken;
    const center: [number, number] = destination
      ? [destination.lng, destination.lat]
      : fallbackCenter;
    const instance = new mapboxgl.Map({
      container: container.current,
      center,
      zoom: destination ? 13 : 11,
      style: "mapbox://styles/mapbox/streets-v12",
    });
    if (destination)
      new mapboxgl.Marker({ color: "#17212B" })
        .setLngLat([destination.lng, destination.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 20 }).setText("Delivery address"),
        )
        .addTo(instance);
    if (origin)
      new mapboxgl.Marker({ color: "#2EB68F" })
        .setLngLat([origin.lng, origin.lat])
        .setPopup(new mapboxgl.Popup({ offset: 20 }).setText("Pharmacy"))
        .addTo(instance);
    map.current = instance;
    return () => {
      instance.remove();
      map.current = null;
      riderMarker.current = null;
      route.current = null;
    };
  }, [destination, origin]);

  useEffect(() => {
    if (!origin || !destination || !mapboxToken || !map.current) return;
    let cancelled = false;
    const loadRoute = async () => {
      const instance = map.current;
      if (!instance) return;
      if (!instance.isStyleLoaded())
        await new Promise<void>((resolve) =>
          instance.once("load", () => resolve()),
        );
      try {
        const params = new URLSearchParams({
          geometries: "geojson",
          overview: "full",
          access_token: mapboxToken,
        });
        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?${params}`,
        );
        const data = (await response.json()) as {
          routes?: Array<{
            geometry: { coordinates: number[][] };
            distance: number;
            duration: number;
          }>;
        };
        const next = data.routes?.[0];
        if (!response.ok || !next || cancelled || !map.current) return;
        route.current = {
          coordinates: next.geometry.coordinates,
          distance: next.distance,
          duration: next.duration,
        };
        const feature = line(next.geometry.coordinates);
        map.current.addSource(fullRouteSource, {
          type: "geojson",
          data: feature,
        });
        map.current.addSource(coveredSource, {
          type: "geojson",
          data: line([]),
        });
        map.current.addSource(remainingSource, {
          type: "geojson",
          data: feature,
        });
        map.current.addLayer({
          id: "delivery-route-base",
          type: "line",
          source: fullRouteSource,
          paint: {
            "line-color": "#CBD5E1",
            "line-width": 7,
            "line-opacity": 0.75,
          },
        });
        map.current.addLayer({
          id: "delivery-route-covered-line",
          type: "line",
          source: coveredSource,
          paint: {
            "line-color": "#2563EB",
            "line-width": 7,
            "line-opacity": 0.9,
          },
        });
        map.current.addLayer({
          id: "delivery-route-remaining-line",
          type: "line",
          source: remainingSource,
          paint: {
            "line-color": "#16A34A",
            "line-width": 7,
            "line-opacity": 0.9,
          },
        });
        const bounds = new mapboxgl.LngLatBounds(
          [origin.lng, origin.lat],
          [destination.lng, destination.lat],
        );
        next.geometry.coordinates.forEach((point) =>
          bounds.extend(point as [number, number]),
        );
        map.current.fitBounds(bounds, {
          padding: 52,
          maxZoom: 15,
          duration: 0,
        });
        setLocation((current) => current ? { ...current } : current);
      } catch {
        /* The rider marker remains live if Directions is unavailable. */
      }
    };
    void loadRoute();
    return () => {
      cancelled = true;
    };
  }, [destination, origin]);

  useEffect(() => {
    const socket: Socket = io(socketUrl(), {
      auth: { token },
      transports: ["websocket", "polling"],
    });
    const subscribe = () =>
      socket.emit(
        "tracking:subscribe",
        orderId,
        (result: TrackingSubscription) => {
          setConnected(result.ok);
          if (result.location) setLocation(result.location);
        },
      );
    socket.on("connect", subscribe);
    socket.on("rider:location", (next: RiderLocation) => setLocation(next));
    socket.on("connect_error", () => setConnected(false));
    return () => {
      socket.close();
    };
  }, [orderId, token]);

  useEffect(() => {
    if (!location || !map.current) return;
    const point: [number, number] = [location.lng, location.lat];
    if (!riderMarker.current)
      riderMarker.current = new mapboxgl.Marker({ color: "#2563EB" })
        .setLngLat(point)
        .setPopup(
          new mapboxgl.Popup({ offset: 20 }).setText("Delivery partner"),
        )
        .addTo(map.current);
    else riderMarker.current.setLngLat(point);
    const currentRoute = route.current;
    if (!currentRoute || currentRoute.coordinates.length < 2) {
      map.current.flyTo({
        center: point,
        zoom: 15,
        duration: 800,
        essential: true,
      });
      return;
    }
    let nearestIndex = 0;
    let nearestDistance = Infinity;
    currentRoute.coordinates.forEach(([lng, lat], index) => {
      const distance = (lng - location.lng) ** 2 + (lat - location.lat) ** 2;
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });
    const covered = currentRoute.coordinates.slice(
      0,
      Math.max(2, nearestIndex + 1),
    );
    const remaining = currentRoute.coordinates.slice(
      Math.min(nearestIndex, currentRoute.coordinates.length - 2),
    );
    (
      map.current.getSource(coveredSource) as mapboxgl.GeoJSONSource | undefined
    )?.setData(line(covered));
    (
      map.current.getSource(remainingSource) as
        | mapboxgl.GeoJSONSource
        | undefined
    )?.setData(line(remaining));
    const remainingRatio =
      1 - nearestIndex / (currentRoute.coordinates.length - 1);
    setProgress({
      distance: currentRoute.distance * remainingRatio,
      duration: currentRoute.duration * remainingRatio,
    });
  }, [location]);

  const message = !connected
    ? "Connecting to live trackingâ€¦"
    : !location
      ? "Waiting for your delivery partnerâ€™s live location."
      : !location.isOnline
        ? "Your delivery partner is temporarily offline."
        : "Your rider is on the way.";
  if (!mapboxToken)
    return (
      <section className="rounded-3xl border border-[#E5EAE8] bg-white p-5">
        <p className="text-sm text-slate-500">
          Live location is active, but this map needs a Mapbox token to render.
        </p>
      </section>
    );
  return (
    <section className="rounded-3xl border border-[#E5EAE8] bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#17212B]">
            Live delivery tracking
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
        aria-label="Live delivery progress map"
      />
      {progress && (
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
          <span className="rounded-full bg-blue-50 px-3 py-1.5 text-blue-700">
            {formatDistance(progress.distance)} remaining
          </span>
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700">
            ETA {formatMinutes(progress.duration)}
          </span>
        </div>
      )}
      <p className="mt-3 text-[11px] text-slate-400">
        <span className="font-semibold text-blue-600">Blue</span> covered route
        Â· <span className="font-semibold text-emerald-600">Green</span>{" "}
        remaining route
      </p>
    </section>
  );
}
