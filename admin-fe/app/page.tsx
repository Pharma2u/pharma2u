"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AdminLoginForm } from "@/components/auth/AdminLoginForm";
import { PasswordChangeForm } from "@/components/auth/PasswordChangeForm";
import { OperationsPanel } from "@/components/admin/OperationsPanel";
import { FleetPanel } from "@/components/admin/FleetPanel";
import { PharmacyOnboardingPanel } from "@/components/admin/PharmacyOnboardingPanel";
import { RiderApplicationsPanel } from "@/components/admin/RiderApplicationsPanel";
import { RiderKycOnboardingPanel } from "@/components/admin/RiderKycOnboardingPanel";
import { PharmacyApplicationsPanel } from "@/components/admin/PharmacyApplicationsPanel";
import { ProvisioningPanel } from "@/components/admin/ProvisioningPanel";
import { HomepageBannersPanel } from "@/components/admin/HomepageBannersPanel";
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
import { adminSessionExpiredEvent } from "@/lib/sessionEvents";

export default function AdminPortal() {
  const dispatch = useAppDispatch();
  const { session, hydrated } = usePersistedAdminSession();
  const [error, setError] = useState("");
  const [section, setSection] = useState<
    "overview" | "pharmacy" | "applications" | "riders" | "rider-onboarding" | "fleet" | "accounts" | "banners"
  >("overview");

  useEffect(() => {
    const forceLogout = () => dispatch(clearSession());
    window.addEventListener(adminSessionExpiredEvent, forceLogout);
    return () => window.removeEventListener(adminSessionExpiredEvent, forceLogout);
  }, [dispatch]);

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
        Restoring session...
      </main>
    );
  if (!session) return <AdminLoginForm onSubmit={signIn} error={error} />;
  if (session.mustChangePassword)
    return <PasswordChangeForm onSubmit={replacePassword} error={error} />;

  return (
    <main className="min-h-screen bg-[#f4f7f6]">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <Image src="/images/logo/logo.png" alt="Pharma2U" width={130} height={42} className="h-10 w-auto object-contain" priority />
            <span className="hidden h-7 w-px bg-slate-200 sm:block" />
            <div><p className="text-[10px] font-extrabold tracking-[0.18em] text-emerald-700">ADMIN CONTROL</p><h1 className="text-sm font-bold text-slate-950 sm:text-base">Operations dashboard</h1></div>
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
      <div className="mx-auto grid max-w-[1440px] gap-5 px-4 py-5 sm:px-8 lg:grid-cols-[248px_minmax(0,1fr)]">
        <aside className="h-fit overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_8px_30px_rgba(15,23,42,.04)] lg:sticky lg:top-24 lg:rounded-3xl lg:p-3">
          <p className="hidden px-3 py-2 text-xs font-bold tracking-[0.16em] text-slate-400 lg:block">
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
          </button>

          <button
            onClick={() => setSection("rider-onboarding")}
            className={`mt-1 w-full rounded-xl px-3 py-3 text-left text-sm font-semibold ${section === "rider-onboarding" ? "bg-emerald-50 text-emerald-800" : "text-slate-600 hover:bg-slate-50"}`}
          >
            Rider onboarding
          </button>

          <button
            onClick={() => setSection("banners")}
            className={`mt-1 w-full rounded-xl px-3 py-3 text-left text-sm font-semibold ${section === "banners" ? "bg-emerald-50 text-emerald-800" : "text-slate-600 hover:bg-slate-50"}`}
          >
            Homepage ads & banners
          </button>
          <button
            onClick={() => setSection("pharmacy")}
            className={`mt-1 w-full rounded-xl px-3 py-3 text-left text-sm font-semibold ${section === "pharmacy" ? "bg-emerald-50 text-emerald-800" : "text-slate-600 hover:bg-slate-50"}`}
          >
            Pharmacy onboarding
          </button>
        </aside>
        <section className="min-w-0">
          {section === "rider-onboarding" ? (
            <RiderKycOnboardingPanel token={session.token} />
          ) : section === "fleet" ? (
            <FleetPanel token={session.token} />
          ) : section === "riders" ? (
            <RiderApplicationsPanel token={session.token} />

          ) : section === "applications" ? (
            <PharmacyApplicationsPanel token={session.token} />
          ) : section === "pharmacy" ? (
            <PharmacyOnboardingPanel token={session.token} />
          ) : section === "banners" ? (
            <HomepageBannersPanel token={session.token} />
          ) : section === "overview" ? (
            <OperationsPanel token={session.token} />
          ) : (
            <ProvisioningPanel
              onProvisionStaff={(name, phone, email, currentPassword, role) =>
                provisionStaff(session.token, name, phone, email, role, currentPassword)
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
