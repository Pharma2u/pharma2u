"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";

type Coordinates = { latitude: number; longitude: number };

const defaultCenter: [number, number] = [78.4867, 17.385];

export function MapLocationPicker({
  value,
  onChange,
}: {
  value: Coordinates | null;
  onChange: (coordinates: Coordinates) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (!container.current || map.current) return;
    const initial: [number, number] = value
      ? [value.longitude, value.latitude]
      : defaultCenter;
    const instance = new maplibregl.Map({
      container: container.current,
      center: initial,
      zoom: value ? 15 : 11,
      style: {
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
      },
    });
    const setMarker = (lng: number, lat: number) => {
      if (!marker.current) {
        marker.current = new maplibregl.Marker({ draggable: true });
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

  return (
    <div
      ref={container}
      className="mt-2 h-56 w-full overflow-hidden rounded-xl border border-[#DDE5E2]"
      aria-label="Delivery location map"
    />
  );
}
