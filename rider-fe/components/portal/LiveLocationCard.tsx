"use client";

import { useEffect, useRef, useState } from "react";
import { LocateFixed, MapPin, RefreshCw } from "lucide-react";
import mapboxgl from "mapbox-gl";

const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
type Point = { lat: number; lng: number };

export function LiveLocationCard({
  isOnline,
  fallback,
}: {
  isOnline: boolean;
  fallback: Point | null;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [point, setPoint] = useState<Point | null>(fallback);
  const [locating, setLocating] = useState(false);

  function refresh() {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPoint({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 },
    );
  }

  useEffect(() => {
    if (!isOnline) return;
    const request = window.setTimeout(refresh, 0);
    return () => window.clearTimeout(request);
  }, [isOnline]);

  useEffect(() => {
    if (!container.current || !mapboxToken || !point) return;
    mapboxgl.accessToken = mapboxToken;
    const instance = new mapboxgl.Map({
      container: container.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [point.lng, point.lat],
      zoom: 13,
      attributionControl: false,
      interactive: true,
    });
    instance.addControl(new mapboxgl.NavigationControl({ showCompass: false }));
    marker.current = new mapboxgl.Marker({ color: "#0aa77f" })
      .setLngLat([point.lng, point.lat])
      .addTo(instance);
    map.current = instance;
    return () => {
      instance.remove();
      map.current = null;
      marker.current = null;
    };
  }, [point]);

  return (
    <section className="overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white">
      <header className="flex items-center justify-between px-5 py-4">
        <div>
          <h2 className="text-sm font-extrabold text-slate-950">
            Live location
          </h2>
          <p className="mt-0.5 text-[11px] text-slate-400">
            {isOnline ? "Visible to dispatch" : "Location sharing paused"}
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={locating}
          className="flex items-center gap-1.5 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-700 disabled:opacity-50"
        >
          <RefreshCw className={locating ? "animate-spin" : ""} size={14} />
          Update
        </button>
      </header>
      <div className="relative mx-4 mb-4 h-64 overflow-hidden rounded-2xl bg-[#edf2f6]">
        {mapboxToken && point ? (
          <div ref={container} className="h-full w-full" />
        ) : (
          <div className="grid h-full place-items-center px-8 text-center">
            <div>
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white text-emerald-600 shadow-sm">
                <LocateFixed size={24} />
              </span>
              <p className="mt-3 text-xs font-semibold text-slate-600">
                {point
                  ? "Map preview is not configured."
                  : "Go online to show your live position."}
              </p>
            </div>
          </div>
        )}
        <div className="absolute inset-x-3 bottom-3 flex items-center gap-2 rounded-xl bg-white/95 px-3 py-3 text-[11px] font-semibold text-slate-600 shadow-lg backdrop-blur">
          <MapPin className="shrink-0 text-slate-800" size={16} />
          {point
            ? `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`
            : "Location unavailable"}
        </div>
      </div>
    </section>
  );
}
