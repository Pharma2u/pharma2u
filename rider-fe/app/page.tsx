"use client";
import { useState } from "react";
import { ApplicationForm } from "@/components/auth/ApplicationForm";
import { RiderLoginForm } from "@/components/auth/RiderLoginForm";
import { changePassword, loginRider } from "@/lib/api";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { clearSession, passwordChanged, setSession } from "@/store/authSlice";
import { useAppDispatch } from "@/store/hooks";
import { usePersistedRiderSession } from "@/store/usePersistedSession";
export default function RiderPortal() {
  const dispatch = useAppDispatch();
  const { session, hydrated } = usePersistedRiderSession();
  const [mode, setMode] = useState<"login" | "apply">("login");
  const [error, setError] = useState("");
  const [current, setCurrent] = useState(""),
    [next, setNext] = useState("");
  async function signIn(phone: string, password: string) {
    setError("");
    try {
      dispatch(setSession(await loginRider(phone, password)));
    } catch (c) {
      setError(c instanceof Error ? c.message : "Unable to sign in.");
    }
  }
  async function replacePassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await changePassword(session!.token, current, next);
      dispatch(passwordChanged());
    } catch (c) {
      setError(c instanceof Error ? c.message : "Unable to update password.");
    }
  }
  if (!hydrated)
    return (
      <main className="shell">
        <p className="muted">Restoring session…</p>
      </main>
    );
  if (!hydrated)
    return (
      <main className="shell">
        <p className="muted">Restoring session…</p>
      </main>
    );
  if (session?.mustChangePassword)
    return (
      <main className="shell">
        <section className="card narrow">
          <p className="eyebrow">SECURITY REQUIRED</p>
          <h1>Create your password</h1>
          <p className="muted">Set a password before accessing rider tools.</p>
          <form onSubmit={replacePassword} className="space-y">
            <label>
              Temporary password
              <input
                required
                type="password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
              />
            </label>
            <label>
              New password
              <input
                required
                minLength={8}
                type="password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
              />
            </label>
            {error && <p className="alert error">{error}</p>}
            <button className="primary">Save password</button>
          </form>
        </section>
      </main>
    );
  if (session)
    return (
      <main className="shell">
        <section className="card narrow">
          <p className="eyebrow">PHARMA2U RIDER</p>
          <h1>Welcome, {session.name}</h1>
          <p className="muted">
            Your rider account is active. Delivery assignment tools will appear
            here as they are enabled.
          </p>
          <button
            onClick={() => dispatch(clearSession())}
            className="secondary"
          >
            Sign out
          </button>
        </section>
      </main>
    );
  return (
    <main className="shell">
      <header>
        <div>
          <p className="brand">PHARMA2U</p>
          <h1>Deliver care, faster.</h1>
          <p className="muted">
            Apply to join our rider network or sign in to your approved account.
          </p>
        </div>
        <div className="tabs">
          <button
            className={mode === "login" ? "active" : ""}
            onClick={() => setMode("login")}
          >
            Sign in
          </button>
          <button
            className={mode === "apply" ? "active" : ""}
            onClick={() => setMode("apply")}
          >
            Apply
          </button>
        </div>
      </header>
      <section className={mode === "login" ? "card narrow" : ""}>
        {mode === "login" ? (
          <>
            <p className="eyebrow">RIDER PORTAL</p>
            <h2>Sign in</h2>
            <RiderLoginForm onSubmit={signIn} error={error} />
          </>
        ) : (
          <ApplicationForm />
        )}
      </section>
    </main>
  );
}
