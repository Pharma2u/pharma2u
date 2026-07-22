"use client";

import { useEffect, useState } from "react";
import { AdminLoginForm } from "@/components/auth/AdminLoginForm";
import { PasswordChangeForm } from "@/components/auth/PasswordChangeForm";
import { AdminWorkspace } from "@/components/admin/workspace/AdminWorkspace";
import { changePassword, loginAdmin } from "@/lib/authApi";
import { adminSessionExpiredEvent } from "@/lib/sessionEvents";
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

  useEffect(() => {
    const forceLogout = () => dispatch(clearSession());
    window.addEventListener(adminSessionExpiredEvent, forceLogout);
    return () =>
      window.removeEventListener(adminSessionExpiredEvent, forceLogout);
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
      setError(
        caught instanceof Error ? caught.message : "Unable to change password.",
      );
      throw caught;
    }
  }

  if (!hydrated)
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 text-sm text-slate-500">
        Restoring secure session...
      </main>
    );
  if (!session) return <AdminLoginForm onSubmit={signIn} error={error} />;
  if (session.mustChangePassword)
    return <PasswordChangeForm onSubmit={replacePassword} error={error} />;
  return (
    <AdminWorkspace
      session={session}
      onSignOut={() => dispatch(clearSession())}
    />
  );
}
