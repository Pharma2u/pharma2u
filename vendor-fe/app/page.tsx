"use client";

import { useState } from "react";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { VendorLoginForm } from "@/components/auth/VendorLoginForm";
import { InventoryPanel } from "@/components/inventory/InventoryPanel";
import { changePassword, loginVendor } from "@/lib/authApi";
import { clearSession, passwordChanged, setSession } from "@/store/authSlice";
import { useAppDispatch } from "@/store/hooks";
import { usePersistedVendorSession } from "@/store/usePersistedSession";

export default function VendorPortal() {
  const dispatch = useAppDispatch();
  const { session, hydrated } = usePersistedVendorSession();
  const [error, setError] = useState("");

  async function login(phone: string, password: string) {
    setError("");

    try {
      dispatch(setSession(await loginVendor(phone, password)));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sign-in failed.");
    }
  }

  async function replacePassword(currentPassword: string, newPassword: string) {
    setError("");

    try {
      await changePassword(session!.token, currentPassword, newPassword);
      dispatch(passwordChanged());
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
  if (!session) return <VendorLoginForm onSubmit={login} error={error} />;
  if (session.mustChangePassword)
    return <ChangePasswordForm onSubmit={replacePassword} error={error} />;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <div>
            <p className="text-xs font-bold tracking-[0.22em] text-teal-600">
              PHARMA2U · VENDOR
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950">
              Pharmacy workspace
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
        <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-3">
          <p className="px-3 py-2 text-xs font-bold tracking-[0.16em] text-slate-400">
            WORKSPACE
          </p>
          <div className="rounded-xl bg-teal-50 px-3 py-3 text-sm font-semibold text-teal-800">
            Inventory dashboard
          </div>
          <p className="px-3 py-4 text-xs leading-5 text-slate-500">
            Manage products and stock only for your assigned pharmacy.
          </p>
        </aside>
        <section>
          <div className="rounded-3xl bg-slate-900 px-6 py-7 text-white shadow-sm">
            <p className="text-xs font-bold tracking-[0.18em] text-teal-300">
              DAILY OPERATIONS
            </p>
            <h2 className="mt-2 text-2xl font-bold">
              Keep your catalogue accurate and ready to sell.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Review stock levels, add products, and maintain the inventory
              shown for your pharmacy.
            </p>
          </div>
          <InventoryPanel token={session.token} />
        </section>
      </div>
    </main>
  );
}
