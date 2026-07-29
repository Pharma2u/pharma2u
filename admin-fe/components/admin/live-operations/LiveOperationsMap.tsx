"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { LiveOperationsData } from "./types";

const FALLBACK_CENTER: [number, number] = [78.4867, 17.385];
const token =
  process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ??
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const escapeHtml = (value: string) =>
  value.replace(/[&<>'"]/g, (character) =>
    ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#039;",
      '"': "&quot;",
    })[character]!,
  );

export function LiveOperationsMap({
  data,
  selectedRiderId,
  onSelectRider,
}: {
  data: LiveOperationsData;
  selectedRiderId: string | null;
  onSelectRider: (id: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef(new Map<string, mapboxgl.Marker>());
  useEffect(() => {
    if (!container.current || map.current || !token) return;
    mapboxgl.accessToken = token;
    const instance = new mapboxgl.Map({
      container: container.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: FALLBACK_CENTER,
      zoom: 11,
      attributionControl: false,
    });
    instance.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "top-right",
    );
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
    const visibleRiders = data.riders.filter((rider) => rider.location);
    const visibleVendors = data.pharmacies.filter(
      (pharmacy) => pharmacy.isOpen && pharmacy.location,
    );
    const ids = new Set([
      ...visibleRiders.map((rider) => `rider:${rider.id}`),
      ...visibleVendors.map((pharmacy) => `vendor:${pharmacy.id}`),
    ]);
    markers.current.forEach((marker, id) => {
      if (!ids.has(id)) {
        marker.remove();
        markers.current.delete(id);
      }
    });
    const bounds = new mapboxgl.LngLatBounds();
    visibleRiders.forEach((rider) => {
      const location = rider.location!;
      const point: [number, number] = [location.lng, location.lat];
      const markerId = `rider:${rider.id}`;
      const existing = markers.current.get(markerId);
      if (existing) existing.setLngLat(point);
      else {
        const element = document.createElement("button");
        element.type = "button";
        element.title = rider.name;
        element.style.cssText = `display:grid;place-items:center;width:32px;height:32px;border-radius:999px;border:3px solid white;box-shadow:0 2px 10px #0f172a33;color:white;font-size:12px;font-weight:700;background:${rider.status === "busy" ? "#7c3aed" : rider.status === "available" ? "#059669" : "#64748b"}`;
        element.textContent = rider.name.slice(0, 1).toUpperCase();
        element.onclick = () => onSelectRider(rider.id);
        markers.current.set(
          markerId,
          new mapboxgl.Marker({ element, anchor: "center" })
            .setLngLat(point)
            .addTo(map.current!),
        );
      }
      bounds.extend(point);
    });
    visibleVendors.forEach((pharmacy) => {
      const location = pharmacy.location!;
      const point: [number, number] = [location.lng, location.lat];
      const markerId = `vendor:${pharmacy.id}`;
      const existing = markers.current.get(markerId);
      if (existing) existing.setLngLat(point);
      else {
        const element = document.createElement("button");
        element.type = "button";
        element.title = `${pharmacy.name} - Open vendor`;
        element.setAttribute("aria-label", `${pharmacy.name}, open vendor`);
        element.style.cssText =
          "display:grid;place-items:center;width:34px;height:34px;border-radius:10px;border:3px solid white;box-shadow:0 2px 12px #0f172a40;color:white;font-size:11px;font-weight:800;background:#0f766e";
        element.textContent = "V";
        const popup = new mapboxgl.Popup({ offset: 18 }).setHTML(
          `<strong>${escapeHtml(pharmacy.name)}</strong><br/><span>${escapeHtml(pharmacy.address)}</span><br/><span style="color:#047857;font-weight:700">Open now</span>`,
        );
        markers.current.set(
          markerId,
          new mapboxgl.Marker({ element, anchor: "center" })
            .setLngLat(point)
            .setPopup(popup)
            .addTo(map.current!),
        );
      }
      bounds.extend(point);
    });
    if (!bounds.isEmpty() && !selectedRiderId)
      map.current.fitBounds(bounds, {
        padding: 56,
        maxZoom:
          visibleRiders.length + visibleVendors.length === 1 ? 14 : 12,
        duration: 450,
      });
  }, [data.pharmacies, data.riders, onSelectRider, selectedRiderId]);
  if (!token)
    return (
      <div className="flex h-full min-h-80 items-center justify-center rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">
        Add{" "}
        <code className="mx-1 rounded bg-slate-200 px-1 py-0.5 text-slate-700">
          NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
        </code>{" "}
        to enable the live map.
      </div>
    );
  return (
    <div
      ref={container}
      className="h-full min-h-80 overflow-hidden rounded-2xl"
      aria-label="Live operations map"
    />
  );
}
