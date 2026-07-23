"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";

type Coordinates = { lat: number; lng: number };
type RouteData = { distance: number; duration: number; steps: string[] };

const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const routeSourceId = "delivery-route";
const routeLayerId = "delivery-route-line";

function formatDistance(metres: number) {
  return metres >= 1000
    ? `${(metres / 1000).toFixed(1)} km`
    : `${Math.round(metres)} m`;
}

function formatDuration(seconds: number) {
  const minutes = Math.max(1, Math.round(seconds / 60));
  return minutes >= 60
    ? `${Math.floor(minutes / 60)}h ${minutes % 60}m`
    : `${minutes} min`;
}

export function MapboxNavigationPanel({
  destination,
}: {
  destination: Coordinates;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const riderMarker = useRef<mapboxgl.Marker | null>(null);
  const lastRoute = useRef<{
    lat: number;
    lng: number;
    requestedAt: number;
  } | null>(null);
  const [route, setRoute] = useState<RouteData | null>(null);
  const [message, setMessage] = useState("Getting your live locationâ€¦");

  useEffect(() => {
    if (!container.current || !mapboxToken) return;
    mapboxgl.accessToken = mapboxToken;
    const instance = new mapboxgl.Map({
      container: container.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [destination.lng, destination.lat],
      zoom: 13,
    });
    new mapboxgl.Marker({ color: "#17212B" })
      .setLngLat([destination.lng, destination.lat])
      .setPopup(new mapboxgl.Popup({ offset: 20 }).setText("Delivery address"))
      .addTo(instance);
    map.current = instance;
    return () => {
      instance.remove();
      map.current = null;
    };
  }, [destination.lat, destination.lng]);

  useEffect(() => {
    if (!mapboxToken || !navigator.geolocation) {
      setMessage("Location permission is required to show the route.");
      return;
    }
    let cancelled = false;
    const updateRoute = async (lat: number, lng: number) => {
      const previous = lastRoute.current;
      const moved = previous
        ? Math.hypot(lat - previous.lat, lng - previous.lng) * 111_000
        : Infinity;
      if (previous && moved < 35 && Date.now() - previous.requestedAt < 30_000)
        return;
      lastRoute.current = { lat, lng, requestedAt: Date.now() };
      if (map.current) {
        const point: [number, number] = [lng, lat];
        if (!riderMarker.current)
          riderMarker.current = new mapboxgl.Marker({ color: "#2EB68F" })
            .setLngLat(point)
            .setPopup(
              new mapboxgl.Popup({ offset: 20 }).setText("Your location"),
            )
            .addTo(map.current);
        else riderMarker.current.setLngLat(point);
      }
      try {
        const params = new URLSearchParams({
          geometries: "geojson",
          overview: "full",
          steps: "true",
          access_token: mapboxToken,
        });
        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${lng},${lat};${destination.lng},${destination.lat}?${params}`,
        );
        if (!response.ok) throw new Error("Directions unavailable");
        const data = (await response.json()) as {
          routes?: Array<{
            geometry: { type: "LineString"; coordinates: number[][] };
            distance: number;
            duration: number;
            legs: Array<{
              steps: Array<{ maneuver: { instruction?: string } }>;
            }>;
          }>;
        };
        const next = data.routes?.[0];
        if (!next || cancelled || !map.current) return;
        const source = map.current.getSource(routeSourceId) as
          | mapboxgl.GeoJSONSource
          | undefined;
        if (source)
          source.setData({
            type: "Feature",
            properties: {},
            geometry: next.geometry,
          });
        else {
          map.current.addSource(routeSourceId, {
            type: "geojson",
            data: { type: "Feature", properties: {}, geometry: next.geometry },
          });
          map.current.addLayer({
            id: routeLayerId,
            type: "line",
            source: routeSourceId,
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-color": "#16A34A",
              "line-width": 6,
              "line-opacity": 0.85,
            },
          });
        }
        const steps = next.legs
          .flatMap((leg) =>
            leg.steps
              .map((step) => step.maneuver.instruction)
              .filter((instruction): instruction is string =>
                Boolean(instruction),
              ),
          )
          .slice(0, 4);
        setRoute({ distance: next.distance, duration: next.duration, steps });
        setMessage("Live route updates as you move.");
        const bounds = new mapboxgl.LngLatBounds(
          [lng, lat],
          [destination.lng, destination.lat],
        );
        for (const coordinate of next.geometry.coordinates)
          bounds.extend(coordinate as [number, number]);
        map.current.fitBounds(bounds, {
          padding: 48,
          maxZoom: 15,
          duration: 500,
        });
      } catch {
        if (!cancelled)
          setMessage(
            "Unable to refresh the route. Your location is still being shared.",
          );
      }
    };
    const watchId = navigator.geolocation.watchPosition(
      (position) =>
        void updateRoute(position.coords.latitude, position.coords.longitude),
      () => setMessage("Allow location access to display the live route."),
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 },
    );
    return () => {
      cancelled = true;
      navigator.geolocation.clearWatch(watchId);
    };
  }, [destination.lat, destination.lng]);

  if (!mapboxToken)
    return (
      <div className="grid h-48 place-items-center rounded-lg bg-slate-100 px-4 text-center text-xs text-slate-500">
        Add NEXT_PUBLIC_MAPBOX_TOKEN to enable live navigation.
      </div>
    );
  return (
    <div className="border-t border-slate-100 bg-slate-50 p-3">
      <div
        ref={container}
        className="h-52 w-full rounded-lg"
        aria-label="Live delivery route map"
      />
      <p className="mt-3 text-xs text-slate-500">{message}</p>
      {route && (
        <>
          <div className="mt-2 flex gap-2 text-xs font-semibold text-emerald-800">
            <span className="rounded-lg bg-emerald-100 px-2 py-1">
              {formatDistance(route.distance)} remaining
            </span>
            <span className="rounded-lg bg-emerald-100 px-2 py-1">
              ETA {formatDuration(route.duration)}
            </span>
          </div>
          {route.steps.length > 0 && (
            <ol className="mt-3 space-y-1 text-xs text-slate-600">
              {route.steps.map((step, index) => (
                <li key={`${index}-${step}`} className="flex gap-2">
                  <span className="font-bold text-emerald-700">
                    {index + 1}.
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </div>
  );
}
