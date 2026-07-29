"use client";

import { useEffect, useRef, useState } from "react";
import { updateMyLocation } from "@/lib/api";
import { getRiderDashboard } from "@/lib/dashboardApi";

type LocationPoint = { lat: number; lng: number; sentAt: number };
type Coordinates = Pick<LocationPoint, "lat" | "lng">;
const availabilityStorageKey = "pharma2u_rider_wants_online";

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
  const [isRestoring, setIsRestoring] = useState(true);
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [message, setMessage] = useState(
    "Go online to receive jobs and share your live location.",
  );
  const lastLocation = useRef<LocationPoint | null>(null);
  const confirmedOnline = useRef(false);
  const wantsOnline = useRef(false);

  function rememberAvailability(online: boolean) {
    wantsOnline.current = online;
    localStorage.setItem(availabilityStorageKey, String(online));
  }

  useEffect(() => {
    let cancelled = false;

    async function restoreAvailability() {
      const saved = localStorage.getItem(availabilityStorageKey);
      let shouldRestore = saved === "true";

      // Preserve a shift that started before availability persistence existed.
      if (saved === null) {
        try {
          const dashboard = await getRiderDashboard(token);
          shouldRestore = dashboard.availability.isOnline;
          if (dashboard.availability.location) {
            const point = dashboard.availability.location;
            lastLocation.current = {
              lat: point.lat,
              lng: point.lng,
              sentAt: new Date(point.updatedAt).getTime(),
            };
            setLocation({ lat: point.lat, lng: point.lng });
          }
        } catch {
          shouldRestore = false;
        }
      }

      if (cancelled) return;
      wantsOnline.current = shouldRestore;
      if (shouldRestore) {
        localStorage.setItem(availabilityStorageKey, "true");
        setMessage("Restoring your online shift...");
        setIsSharingLocation(true);
      }
      setIsRestoring(false);
    }

    void restoreAvailability();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    function syncAvailability(event: StorageEvent) {
      if (event.key !== availabilityStorageKey) return;
      const shouldBeOnline = event.newValue === "true";
      wantsOnline.current = shouldBeOnline;
      if (shouldBeOnline) {
        setMessage("Restoring your online shift...");
        setIsSharingLocation(true);
        return;
      }
      confirmedOnline.current = false;
      setIsSharingLocation(false);
      setIsOnline(false);
      setMessage("You are offline. Live location sharing is paused.");
    }

    window.addEventListener("storage", syncAvailability);
    return () => window.removeEventListener("storage", syncAvailability);
  }, []);

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
        setLocation({ lat, lng });
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
            confirmedOnline.current = true;
            setIsOnline(true);
          })
          .catch((error) => {
            if (!confirmedOnline.current) setIsOnline(false);
            setMessage(
              error instanceof Error
                ? `${error.message} Retrying while your shift stays active.`
                : "Connection interrupted. Retrying your live location.",
            );
          });
      },
      (error) => {
        setMessage(
          error.code === error.PERMISSION_DENIED
            ? "Location permission denied. Allow it in browser settings."
            : "Unable to get your current location.",
        );
        rememberAvailability(false);
        confirmedOnline.current = false;
        setIsOnline(false);
        setIsSharingLocation(false);
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isSharingLocation, token]);

  useEffect(() => {
    if (!isSharingLocation) return;

    function refreshLiveStatus() {
      const point = lastLocation.current;
      if (!point || !wantsOnline.current) return;
      const sentAt = Date.now();
      void updateMyLocation(token, point.lat, point.lng, sentAt, true)
        .then((result) => {
          if (!result.accepted) return;
          lastLocation.current = { ...point, sentAt };
          confirmedOnline.current = true;
          setIsOnline(true);
          setMessage("Live location active.");
        })
        .catch(() => {
          setMessage(
            "Connection interrupted. Your shift remains active and will reconnect automatically.",
          );
        });
    }

    const heartbeat = window.setInterval(refreshLiveStatus, 60_000);
    function resumeWhenVisible() {
      if (document.visibilityState === "visible") refreshLiveStatus();
    }
    document.addEventListener("visibilitychange", resumeWhenVisible);
    window.addEventListener("online", refreshLiveStatus);
    return () => {
      window.clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", resumeWhenVisible);
      window.removeEventListener("online", refreshLiveStatus);
    };
  }, [isSharingLocation, token]);

  function goOnline() {
    if (!("geolocation" in navigator)) {
      setMessage("Location is not supported by this device.");
      return;
    }
    rememberAvailability(true);
    setMessage("Requesting precise location...");
    lastLocation.current = null;
    setIsSharingLocation(true);
  }

  function goOffline() {
    rememberAvailability(false);
    setIsSharingLocation(false);
    setIsOnline(false);
    confirmedOnline.current = false;
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
    isStarting: isRestoring || (isSharingLocation && !isOnline),
    location,
    message,
    toggleAvailability: isSharingLocation ? goOffline : goOnline,
    goOffline,
  };
}

export type RiderAvailability = ReturnType<typeof useRiderAvailability>;
