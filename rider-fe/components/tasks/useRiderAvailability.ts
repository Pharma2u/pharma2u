"use client";

import { useEffect, useRef, useState } from "react";
import { updateMyLocation } from "@/lib/api";

type LocationPoint = { lat: number; lng: number; sentAt: number };

function distanceMetres(from: LocationPoint, lat: number, lng: number) {
  const radians = Math.PI / 180;
  const latitudeDelta = (lat - from.lat) * radians;
  const longitudeDelta = (lng - from.lng) * radians;
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(from.lat * radians) *
      Math.cos(lat * radians) *
      Math.sin(longitudeDelta / 2) ** 2;

  return (
    12_742_000 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
}

export function useRiderAvailability(token: string) {
  const [isOnline, setIsOnline] = useState(false);
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [message, setMessage] = useState(
    "Go online to receive jobs and share your live location.",
  );
  const lastLocation = useRef<LocationPoint | null>(null);

  useEffect(() => {
    if (!isSharingLocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const sentAt = Date.now();
        const previous = lastLocation.current;

        if (previous) {
          const elapsed = sentAt - previous.sentAt;
          const moved = distanceMetres(previous, lat, lng);
          if (elapsed < 5_000 || (moved < 25 && elapsed < 15_000)) return;
        }

        lastLocation.current = { lat, lng, sentAt };
        setMessage(
          `Live location active - accuracy ${Math.round(position.coords.accuracy)} m`,
        );
        void updateMyLocation(token, lat, lng, sentAt, true)
          .then((result) => {
            if (!result.accepted) {
              setIsOnline(false);
              setMessage("Unable to confirm your live location. Please retry.");
              return;
            }
            // Start looking for work only after the API has recorded the
            // location. This prevents the first task request from being
            // rejected as offline when a rider starts duty.
            setIsOnline(true);
          })
          .catch((error) => {
            setIsOnline(false);
            setMessage(
              error instanceof Error
                ? error.message
                : "Unable to share live location.",
            );
          });
      },
      (error) => {
        setMessage(
          error.code === error.PERMISSION_DENIED
            ? "Location permission denied. Allow it in browser settings."
            : "Unable to get your current location.",
        );
        setIsOnline(false);
        setIsSharingLocation(false);
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isSharingLocation, token]);

  function goOnline() {
    if (!("geolocation" in navigator)) {
      setMessage("Location is not supported by this device.");
      return;
    }
    setMessage("Requesting precise location...");
    lastLocation.current = null;
    setIsSharingLocation(true);
  }

  function goOffline() {
    setIsSharingLocation(false);
    setIsOnline(false);
    setMessage("You are offline. Live location sharing is paused.");
    const point = lastLocation.current;
    if (point) {
      void updateMyLocation(
        token,
        point.lat,
        point.lng,
        Date.now(),
        false,
      ).catch(() => undefined);
    }
  }

  return {
    isOnline,
    message,
    toggleAvailability: isSharingLocation ? goOffline : goOnline,
  };
}
