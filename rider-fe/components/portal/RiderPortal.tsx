"use client";

import { FormEvent, useState } from "react";
import { LoaderCircle, LockKeyhole } from "lucide-react";
import { changePassword } from "@/lib/api";
import { clearSession, passwordChanged, setSession } from "@/store/authSlice";
import { useAppDispatch } from "@/store/hooks";
import { usePersistedRiderSession } from "@/store/usePersistedSession";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { AuthScreen } from "./AuthScreen";
import { RiderDashboard } from "./RiderDashboard";

export function RiderPortal() {
  const dispatch = useAppDispatch();
  const { session, hydrated } = usePersistedRiderSession();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function replacePassword(event: FormEvent) {
    event.preventDefault();
    if (!session) return;
    setBusy(true);
    setError("");
    try {
      await changePassword(session.token, current, next);
      dispatch(passwordChanged());
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to update password.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!hydrated)
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50">
        <LoaderCircle className="animate-spin text-emerald-600" size={28} />
        <span className="sr-only">Restoring session</span>
      </main>
    );
  if (!session)
    return (
      <AuthScreen onAuthenticated={(value) => dispatch(setSession(value))} />
    );
  if (session.mustChangePassword)
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 p-4">
        <section className="w-full max-w-md rounded-3xl bg-white p-7 shadow-xl shadow-slate-950/5">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <LockKeyhole />
          </span>
          <h1 className="mt-5 text-2xl font-bold text-slate-950">
            Create your private password
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Replace the temporary password before accessing delivery operations.
          </p>
          <form onSubmit={replacePassword} className="mt-6 space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Temporary password
              <PasswordInput
                required
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              New password
              <PasswordInput
                required
                minLength={8}
                value={next}
                onChange={(e) => setNext(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
              />
            </label>
            {error && (
              <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}
            <button
              disabled={busy}
              className="w-full rounded-xl bg-slate-950 px-4 py-3 font-semibold text-white"
            >
              {busy ? "Saving..." : "Save and continue"}
            </button>
          </form>
        </section>
      </main>
    );
  return (
    <RiderDashboard
      session={session}
      onSignOut={() => dispatch(clearSession())}
    />
  );
}
