"use client";

import { useCallback, useEffect, useRef } from "react";
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
  const onChangeRef = useRef(onChange);
  const valueLatitude = value?.latitude;
  const valueLongitude = value?.longitude;

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const ensureMarker = useCallback(() => {
    if (!map.current) return null;
    if (!marker.current) {
      marker.current = new mapboxgl.Marker({ draggable: true });
      marker.current.on("dragend", () => {
        const position = marker.current?.getLngLat();
        if (position) {
          onChangeRef.current({
            latitude: position.lat,
            longitude: position.lng,
          });
        }
      });
      marker.current.addTo(map.current);
    }
    return marker.current;
  }, []);

  useEffect(() => {
    if (!container.current || map.current || !mapboxToken) return;
    mapboxgl.accessToken = mapboxToken;
    const instance = new mapboxgl.Map({
      container: container.current,
      center: defaultCenter,
      zoom: 11,
      style: "mapbox://styles/mapbox/streets-v12",
    });
    map.current = instance;
    instance.on("click", (event) => {
      ensureMarker()?.setLngLat(event.lngLat);
      onChangeRef.current({
        latitude: event.lngLat.lat,
        longitude: event.lngLat.lng,
      });
    });
    return () => {
      instance.remove();
      map.current = null;
      marker.current = null;
    };
  }, [ensureMarker]);

  useEffect(() => {
    if (valueLatitude == null || valueLongitude == null || !map.current) return;
    const isFirstPin = !marker.current;
    ensureMarker()?.setLngLat([valueLongitude, valueLatitude]);
    if (isFirstPin) {
      map.current.jumpTo({
        center: [valueLongitude, valueLatitude],
        zoom: 15,
      });
    }
  }, [ensureMarker, valueLatitude, valueLongitude]);

  if (!mapboxToken)
    return (
      <div className="mt-2 grid h-56 w-full place-items-center rounded-xl border border-[#DDE5E2] bg-slate-50 px-4 text-center text-sm text-slate-500">
        Map is temporarily unavailable. Add NEXT_PUBLIC_MAPBOX_TOKEN to enable
        delivery pin selection.
      </div>
    );

  return (
    <div
      ref={container}
      className="mt-2 h-56 w-full overflow-hidden rounded-xl border border-[#DDE5E2]"
      aria-label="Delivery location map"
    />
  );
}
