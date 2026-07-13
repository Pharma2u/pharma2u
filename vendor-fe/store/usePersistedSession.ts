"use client";

import { useEffect, useState } from "react";
import { setSession } from "./authSlice";
import { useAppDispatch, useAppSelector } from "./hooks";

const storageKey = "pharma2u_vendor_auth";

export function usePersistedVendorSession() {
  const dispatch = useAppDispatch();
  const session = useAppSelector((state) => state.auth.session);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const saved = JSON.parse(stored);
        if (saved.role === "vendor" && typeof saved.token === "string")
          dispatch(setSession(saved));
      }
    } catch {
      localStorage.removeItem(storageKey);
    } finally {
      setHydrated(true);
    }
  }, [dispatch]);

  useEffect(() => {
    if (!hydrated) return;
    if (session) localStorage.setItem(storageKey, JSON.stringify(session));
    else localStorage.removeItem(storageKey);
  }, [hydrated, session]);

  return { session, hydrated };
}
