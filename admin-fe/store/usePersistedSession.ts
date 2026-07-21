"use client";

import { useEffect, useState } from "react";
import { clearSession, setSession, type AuthSession } from "./authSlice";
import { useAppDispatch, useAppSelector } from "./hooks";

const storageKey = "pharma2u_admin_auth";

function tokenIsExpired(token: string): boolean {
  try {
    const payload = token.split(".")[1];
    if (!payload) return true;
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: unknown };
    return typeof decoded.exp !== "number" || decoded.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export function usePersistedAdminSession() {
  const dispatch = useAppDispatch();
  const session = useAppSelector((state) => state.auth.session);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const saved = JSON.parse(stored);
        if (saved.role === "admin" && typeof saved.token === "string") {
          if (tokenIsExpired(saved.token)) localStorage.removeItem(storageKey);
          else dispatch(setSession(saved as AuthSession));
        }
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

  useEffect(() => {
    const checkExpiry = () => {
      if (session && tokenIsExpired(session.token)) dispatch(clearSession());
    };
    checkExpiry();
    const intervalId = window.setInterval(checkExpiry, 60_000);
    return () => window.clearInterval(intervalId);
  }, [dispatch, session]);

  return { session, hydrated };
}
