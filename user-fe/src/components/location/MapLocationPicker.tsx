"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

type Coordinates = { latitude: number; longitude: number };

const defaultCenter: [number, number] = [78.4867, 17.385];
const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export function MapLocationPicker({
  value,
  onChange,
}: {
  value: Coordinates | null;
  onChange: (coordinates: Coordinates) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!container.current || map.current || !mapboxToken) return;
    const initial: [number, number] = value
      ? [value.longitude, value.latitude]
      : defaultCenter;
    mapboxgl.accessToken = mapboxToken;
    const instance = new mapboxgl.Map({
      container: container.current,
      center: initial,
      zoom: value ? 15 : 11,
      style: "mapbox://styles/mapbox/streets-v12",
    });
    const setMarker = (lng: number, lat: number) => {
      if (!marker.current) {
        marker.current = new mapboxgl.Marker({ draggable: true });
        marker.current.on("dragend", () => {
          const position = marker.current!.getLngLat();
          onChange({ latitude: position.lat, longitude: position.lng });
        });
      }
      marker.current.setLngLat([lng, lat]).addTo(instance);
    };
    if (value) setMarker(value.longitude, value.latitude);
    instance.on("click", (event) => {
      setMarker(event.lngLat.lng, event.lngLat.lat);
      onChange({ latitude: event.lngLat.lat, longitude: event.lngLat.lng });
    });
    map.current = instance;
    return () => {
      instance.remove();
      map.current = null;
      marker.current = null;
    };
  }, [onChange, value]);

  if (!mapboxToken) return <div className="mt-2 grid h-56 w-full place-items-center rounded-xl border border-[#DDE5E2] bg-slate-50 px-4 text-center text-sm text-slate-500">Map is temporarily unavailable. Add NEXT_PUBLIC_MAPBOX_TOKEN to enable delivery pin selection.</div>;

  return (
    <div
      ref={container}
      className="mt-2 h-56 w-full overflow-hidden rounded-xl border border-[#DDE5E2]"
      aria-label="Delivery location map"
    />
  );
}
