"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export type FleetMapRider = {
  id: string;
  name: string;
  availability: "online" | "offline";
  riderLocation: {
    lat: number;
    lng: number;
    isOnline: boolean;
    updatedAt: string;
  } | null;
  ordersAsRider: {
    id: string;
    orderCode: string;
    status: string;
    pharmacy: { name: string };
  }[];
};

const fallbackCenter: [number, number] = [78.4867, 17.385];
const mapStyle: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

export function FleetMap({ riders }: { riders: FleetMapRider[] }) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef(new Map<string, maplibregl.Marker>());

  useEffect(() => {
    if (!container.current || map.current) return;

    const instance = new maplibregl.Map({
      container: container.current,
      style: mapStyle,
      center: fallbackCenter,
      zoom: 11,
    });
    instance.addControl(new maplibregl.NavigationControl(), "top-right");
    map.current = instance;
    const currentMarkers = markers.current;

    return () => {
      currentMarkers.forEach((marker) => marker.remove());
      currentMarkers.clear();
      instance.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;

    const visibleRiders = riders.filter((rider) => rider.riderLocation);
    const nextIds = new Set(visibleRiders.map((rider) => rider.id));
    markers.current.forEach((marker, riderId) => {
      if (!nextIds.has(riderId)) {
        marker.remove();
        markers.current.delete(riderId);
      }
    });

    const bounds = new maplibregl.LngLatBounds();
    for (const rider of visibleRiders) {
      const location = rider.riderLocation!;
      const point: [number, number] = [location.lng, location.lat];
      const color = rider.availability === "online" ? "#059669" : "#64748b";
      const delivery = rider.ordersAsRider[0];
      const popup = new maplibregl.Popup({ offset: 20 }).setHTML(
        `<strong>${escapeHtml(rider.name)}</strong><br/>${rider.availability}<br/>${delivery ? `${escapeHtml(delivery.orderCode)} - ${escapeHtml(delivery.status.replaceAll("_", " "))}` : "No active delivery"}`,
      );
      const existing = markers.current.get(rider.id);
      if (existing) {
        existing.setLngLat(point).setPopup(popup);
      } else {
        markers.current.set(
          rider.id,
          new maplibregl.Marker({ color })
            .setLngLat(point)
            .setPopup(popup)
            .addTo(map.current),
        );
      }
      bounds.extend(point);
    }

    if (!bounds.isEmpty() && visibleRiders.length > 0) {
      map.current.fitBounds(bounds, {
        padding: 64,
        maxZoom: visibleRiders.length === 1 ? 15 : 13,
        duration: 500,
      });
    }
  }, [riders]);

  return (
    <div
      ref={container}
      className="h-96 w-full overflow-hidden rounded-2xl border border-slate-200"
      aria-label="Live rider fleet map"
    />
  );
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        character
      ]!,
  );
}
