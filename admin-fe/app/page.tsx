"use client";

import { AdminLoginForm } from "@/components/auth/AdminLoginForm";
import { PasswordChangeForm } from "@/components/auth/PasswordChangeForm";
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
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useState } from "react";

export default function AdminPortal() {
  const dispatch = useAppDispatch();
  const session = useAppSelector((state) => state.auth.session);
  const [error, setError] = useState("");

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
      setError(
        caught instanceof Error ? caught.message : "Unable to change password.",
      );
      throw caught;
    }
  }
  if (!session) return <AdminLoginForm onSubmit={signIn} error={error} />;
  return (
    <main className="min-h-screen bg-slate-100 p-5 sm:p-10">
      <header className="mx-auto flex max-w-6xl items-center justify-between">
        <div>
          <p className="text-sm font-bold tracking-[0.2em] text-emerald-600">
            PHARMA2U
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Admin control center
          </h1>
          <p className="mt-1 text-slate-600">Signed in as {session.name}</p>
        </div>
        <button
          onClick={() => dispatch(clearSession())}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold"
        >
          Sign out
        </button>
      </header>
      {session.mustChangePassword ? (
        <PasswordChangeForm onSubmit={replacePassword} error={error} />
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
    </main>
  );
}
