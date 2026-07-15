"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  clearSession,
  type AuthRootState,
  type AuthSession,
  setSession,
} from "@/src/store/authStore";

const storageKey = "pharma2u_auth";
const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api").replace(/\/$/, "");

function restoreSession(): AuthSession | null {
  const stored = localStorage.getItem(storageKey);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as AuthSession;
  } catch {
    localStorage.removeItem(storageKey);
    return null;
  }
}

function isCurrentStoredSession(token: string) {
  return restoreSession()?.token === token;
}

export function SessionHydrator() {
  const dispatch = useDispatch();

  useEffect(() => {
    const session = restoreSession();
    if (!session) return;

    let active = true;
    fetch(`${apiBase}/auth/me`, {
      headers: { Authorization: `Bearer ${session.token}` },
    })
      .then(async (response) => {
        if (!response.ok) {
          if ([401, 403].includes(response.status)) {
            if (active && isCurrentStoredSession(session.token)) {
              localStorage.removeItem(storageKey);
              dispatch(clearSession());
            }
          }
          return;
        }
        const user = (await response.json()) as {
          role: string;
          name: string;
          mustChangePassword: boolean;
        };
        if (user.role !== "customer") {
          if (active && isCurrentStoredSession(session.token)) {
            localStorage.removeItem(storageKey);
            dispatch(clearSession());
          }
          return;
        }
        if (!active || !isCurrentStoredSession(session.token)) return;
        const refreshedSession: AuthSession = {
          ...session,
          role: user.role,
          name: user.name,
          mustChangePassword: user.mustChangePassword,
        };
        localStorage.setItem(storageKey, JSON.stringify(refreshedSession));
        dispatch(setSession(refreshedSession));
      })
      .catch(() => {
        // Keep the saved session while the API is temporarily unreachable.
        if (
          active &&
          session.role === "customer" &&
          isCurrentStoredSession(session.token)
        ) {
          dispatch(setSession(session));
        }
      });

    return () => {
      active = false;
    };
  }, [dispatch]);

  return null;
}

export function AccountMenu({ compact = false }: { compact?: boolean }) {
  const dispatch = useDispatch();
  const session = useSelector((state: AuthRootState) => state.auth.session);
  const [open, setOpen] = useState(false);

  function signOut() {
    localStorage.removeItem(storageKey);
    dispatch(clearSession());
    setOpen(false);
  }

  if (!session) {
    return (
      <Link
        href="/login"
        aria-label="Login"
        className={
          compact
            ? "flex h-10 w-10 items-center justify-center rounded-full bg-[#45C9A5] text-[#17212B]"
            : "ml-1 flex h-11 items-center gap-2 rounded-xl bg-[#45C9A5] px-5 text-sm font-semibold text-[#17212B] transition hover:bg-[#2EB68F] hover:text-white"
        }
      >
        <UserRound size={compact ? 20 : 19} />
        <span className={compact ? "sr-only" : ""}>Login</span>
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={
          compact
            ? "flex h-10 w-10 items-center justify-center rounded-full bg-[#EAFaf5] text-[#2EB68F]"
            : "ml-1 flex h-11 items-center gap-2 rounded-xl bg-[#EAFaf5] px-4 text-sm font-semibold text-[#17212B]"
        }
      >
        <UserRound size={compact ? 20 : 19} />
        <span className={compact ? "sr-only" : "max-w-28 truncate"}>
          {session.name}
        </span>
      </button>
      {open && (
        <div
          className={
            compact
              ? "absolute right-0 top-12 z-50 w-48 rounded-xl border border-[#E5E7EB] bg-white p-2 shadow-xl"
              : "absolute right-0 top-13 z-50 w-52 rounded-xl border border-[#E5E7EB] bg-white p-2 shadow-xl"
          }
        >
          <p className="px-3 py-2 text-xs text-[#6B7280]">
            Signed in as {session.name}
          </p>
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-[#F6F8F9]"
          >
            My profile
          </Link>
          <Link
            href="/orders"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-[#F6F8F9]"
          >
            My orders
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
