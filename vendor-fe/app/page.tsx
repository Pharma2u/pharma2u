"use client";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { VendorLoginForm } from "@/components/auth/VendorLoginForm";
import { changePassword, loginVendor } from "@/lib/authApi";
import { clearSession, passwordChanged, setSession } from "@/store/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useState } from "react";
export default function VendorPortal() {
  const dispatch = useAppDispatch();
  const session = useAppSelector((state) => state.auth.session);
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
      setError(
        caught instanceof Error ? caught.message : "Unable to change password.",
      );
      throw caught;
    }
  }
  if (!session) return <VendorLoginForm onSubmit={login} error={error} />;
  if (session.mustChangePassword)
    return <ChangePasswordForm onSubmit={replacePassword} error={error} />;
  return (
    <main className="min-h-screen bg-slate-50 p-10">
      <section className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-bold tracking-[0.2em] text-teal-600">
          PHARMA2U VENDOR
        </p>
        <h1 className="mt-2 text-3xl font-bold">Welcome, {session.name}</h1>
        <p className="mt-3 text-slate-600">
          Your account is ready for pharmacy and catalog management.
        </p>
        <button
          onClick={() => dispatch(clearSession())}
          className="mt-8 rounded-xl border px-4 py-2 text-sm font-semibold"
        >
          Sign out
        </button>
      </section>
    </main>
  );
}
