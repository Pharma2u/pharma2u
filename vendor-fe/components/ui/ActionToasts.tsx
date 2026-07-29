"use client";

import { CheckCircle2, CircleAlert, LoaderCircle, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type ToastKind = "loading" | "success" | "error";
type Toast = { id: number; kind: ToastKind; message: string };
type ToastApi = {
  success: (message: string) => void;
  error: (message: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function actionCopy(url: string, method: string) {
  const path = url.toLowerCase();
  if (path.includes("/login")) return ["Signing you in…", "Signed in successfully."];
  if (path.includes("change-password"))
    return ["Updating password…", "Password updated successfully."];
  if (path.includes("/verify"))
    return ["Updating order…", "Order updated successfully."];
  if (path.includes("/ready"))
    return ["Marking order ready…", "Order marked ready for pickup."];
  if (path.includes("/counter-bills"))
    return ["Creating bill…", "Bill created successfully."];
  if (path.includes("/payout-requests"))
    return ["Submitting payout request…", "Payout request submitted."];
  if (path.includes("/promotions"))
    return ["Saving promotion…", "Promotion saved successfully."];
  if (path.includes("/products") && method === "POST")
    return ["Adding product…", "Product added successfully."];
  if (method === "DELETE") return ["Deleting…", "Deleted successfully."];
  if (method === "PATCH" || method === "PUT")
    return ["Saving changes…", "Changes saved successfully."];
  return ["Processing…", "Action completed successfully."];
}

async function responseError(response: Response) {
  const data = (await response.clone().json().catch(() => null)) as {
    error?: string;
    message?: string;
  } | null;
  return data?.error ?? data?.message ?? `Request failed (${response.status}).`;
}

export function ActionToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setToasts((items) => items.filter((item) => item.id !== id));
  }, []);

  const show = useCallback(
    (kind: ToastKind, message: string, existingId?: number) => {
      const id = existingId ?? ++nextId.current;
      setToasts((items) => {
        const toast = { id, kind, message };
        return items.some((item) => item.id === id)
          ? items.map((item) => (item.id === id ? toast : item))
          : [...items.slice(-3), toast];
      });
      const oldTimer = timers.current.get(id);
      if (oldTimer) clearTimeout(oldTimer);
      if (kind !== "loading") {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), kind === "error" ? 6500 : 4000),
        );
      }
      return id;
    },
    [dismiss],
  );

  useEffect(() => {
    const originalFetch = window.fetch;
    const notifyingFetch: typeof window.fetch = async (input, init) => {
      const method = (
        init?.method ?? (input instanceof Request ? input.method : "GET")
      ).toUpperCase();
      if (!MUTATING_METHODS.has(method)) return originalFetch(input, init);

      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;
      const [pendingMessage, successMessage] = actionCopy(url, method);
      const toastId = show("loading", pendingMessage);
      try {
        const response = await originalFetch(input, init);
        show(
          response.ok ? "success" : "error",
          response.ok ? successMessage : await responseError(response),
          toastId,
        );
        return response;
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === "AbortError") {
          dismiss(toastId);
        } else {
          show(
            "error",
            cause instanceof Error
              ? cause.message
              : "Something went wrong. Please try again.",
            toastId,
          );
        }
        throw cause;
      }
    };
    window.fetch = notifyingFetch;
    return () => {
      if (window.fetch === notifyingFetch) window.fetch = originalFetch;
    };
  }, [dismiss, show]);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      timers.current.clear();
    },
    [],
  );

  const value = useMemo<ToastApi>(
    () => ({
      success: (message) => show("success", message),
      error: (message) => show("error", message),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-3 top-3 z-[100] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-5 sm:top-5 sm:w-[380px]"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.kind === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex w-full items-center gap-3 rounded-2xl border bg-white px-4 py-3.5 shadow-[0_16px_45px_rgba(15,23,42,0.18)] ${
              toast.kind === "error"
                ? "border-red-200"
                : toast.kind === "success"
                  ? "border-emerald-200"
                  : "border-slate-200"
            }`}
          >
            {toast.kind === "loading" ? (
              <LoaderCircle className="shrink-0 animate-spin text-teal-600" size={21} />
            ) : toast.kind === "success" ? (
              <CheckCircle2 className="shrink-0 text-emerald-600" size={21} />
            ) : (
              <CircleAlert className="shrink-0 text-red-600" size={21} />
            )}
            <p className="min-w-0 flex-1 text-sm font-semibold text-slate-800">
              {toast.message}
            </p>
            {toast.kind !== "loading" && (
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Dismiss notification"
              >
                <X size={17} />
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useActionToast() {
  const value = useContext(ToastContext);
  if (!value)
    throw new Error("useActionToast must be used inside ActionToastProvider.");
  return value;
}
