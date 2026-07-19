"use client";

import { useState } from "react";
import { AdminLoginForm } from "@/components/auth/AdminLoginForm";
import { PasswordChangeForm } from "@/components/auth/PasswordChangeForm";
import { OperationsPanel } from "@/components/admin/OperationsPanel";
import { FleetPanel } from "@/components/admin/FleetPanel";
import { PharmacyOnboardingPanel } from "@/components/admin/PharmacyOnboardingPanel";
import { PharmacyApplicationsPanel } from "@/components/admin/PharmacyApplicationsPanel";
import { ProvisioningPanel } from "@/components/admin/ProvisioningPanel";
import {
  changePassword,
  loginAdmin,
  provisionAdmin,
  provisionStaff,
} from "@/lib/authApi";
import {
  clearSession,
  markPasswordChanged,
  setSession,
} from "@/store/authSlice";
import { useAppDispatch } from "@/store/hooks";
import { usePersistedAdminSession } from "@/store/usePersistedSession";

export default function AdminPortal() {
  const dispatch = useAppDispatch();
  const { session, hydrated } = usePersistedAdminSession();
  const [error, setError] = useState("");
  const [section, setSection] = useState<
    "overview" | "pharmacy" | "applications" | "riders" | "fleet" | "accounts"
  >("overview");

  async function signIn(phone: string, password: string) {
    setError("");
    try {
      dispatch(setSession(await loginAdmin(phone, password)));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sign-in failed.");
    }
  }
  async function replacePassword(currentPassword: string, newPassword: string) {
    setError("");
    try {
      await changePassword(session!.token, currentPassword, newPassword);
      dispatch(markPasswordChanged());
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Unable to change password.";
      setError(message);
      throw caught;
    }
  }

  if (!hydrated)
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 text-sm text-slate-500">
        Restoring session…
      </main>
    );
  if (!hydrated)
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 text-sm text-slate-500">
        Restoring session…
      </main>
    );
  if (!session) return <AdminLoginForm onSubmit={signIn} error={error} />;
  if (session.mustChangePassword)
    return <PasswordChangeForm onSubmit={replacePassword} error={error} />;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <div>
            <p className="text-xs font-bold tracking-[0.22em] text-emerald-600">
              PHARMA2U · ADMIN
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950">
              Operations dashboard
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <p className="hidden text-right text-sm text-slate-500 sm:block">
              Signed in as
              <br />
              <span className="font-semibold text-slate-900">
                {session.name}
              </span>
            </p>
            <button
              onClick={() => dispatch(clearSession())}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[210px_1fr]">
        <aside className="rounded-3xl border border-slate-200 bg-white p-3">
          <p className="px-3 py-2 text-xs font-bold tracking-[0.16em] text-slate-400">
            WORKSPACE
          </p>
          <button
            onClick={() => setSection("overview")}
            className={`w-full rounded-xl px-3 py-3 text-left text-sm font-semibold ${section === "overview" ? "bg-emerald-50 text-emerald-800" : "text-slate-600 hover:bg-slate-50"}`}
          >
            Overview
          </button>
          <button
            onClick={() => setSection("accounts")}
            className={`mt-1 w-full rounded-xl px-3 py-3 text-left text-sm font-semibold ${section === "accounts" ? "bg-emerald-50 text-emerald-800" : "text-slate-600 hover:bg-slate-50"}`}
          >
            Account provisioning
          </button>
          <button
            onClick={() => setSection("applications")}
            className={`mt-1 w-full rounded-xl px-3 py-3 text-left text-sm font-semibold ${section === "applications" ? "bg-emerald-50 text-emerald-800" : "text-slate-600 hover:bg-slate-50"}`}
          >
            Pharmacy applications
          </button>
          <button
            onClick={() => setSection("fleet")}
            className={`mt-1 w-full rounded-xl px-3 py-3 text-left text-sm font-semibold ${section === "fleet" ? "bg-emerald-50 text-emerald-800" : "text-slate-600 hover:bg-slate-50"}`}
          >
            Live rider fleet
          </button>
          <button
            onClick={() => setSection("riders")}
            className={`mt-1 w-full rounded-xl px-3 py-3 text-left text-sm font-semibold ${section === "riders" ? "bg-emerald-50 text-emerald-800" : "text-slate-600 hover:bg-slate-50"}`}
          >
            Rider applications
          </button>{" "}
          <button
            onClick={() => setSection("pharmacy")}
            className={`mt-1 w-full rounded-xl px-3 py-3 text-left text-sm font-semibold ${section === "pharmacy" ? "bg-emerald-50 text-emerald-800" : "text-slate-600 hover:bg-slate-50"}`}
          >
            Pharmacy onboarding
          </button>
        </aside>
        <section>
          {section === "fleet" ? (
            <FleetPanel token={session.token} />
          ) : section === "riders" ? (
            <OperationsPanel token={session.token} />
          ) : section === "applications" ? (
            <PharmacyApplicationsPanel token={session.token} />
          ) : section === "pharmacy" ? (
            <PharmacyOnboardingPanel token={session.token} />
          ) : section === "overview" ? (
            <OperationsPanel token={session.token} />
          ) : (
            <ProvisioningPanel
              onProvisionStaff={(name, phone, email, role) =>
                provisionStaff(session.token, name, phone, email, role)
              }
              onProvisionAdmin={(name, phone, currentPassword) =>
                provisionAdmin(session.token, name, phone, currentPassword)
              }
            />
          )}
        </section>
      </div>
    </main>
  );
}
