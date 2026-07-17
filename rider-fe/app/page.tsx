"use client";

import { useState } from "react";
import { ApplicationForm } from "@/components/auth/ApplicationForm";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { RiderLoginForm } from "@/components/auth/RiderLoginForm";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { changePassword, loginRider } from "@/lib/api";
import { clearSession, passwordChanged, setSession } from "@/store/authSlice";
import { useAppDispatch } from "@/store/hooks";
import { usePersistedRiderSession } from "@/store/usePersistedSession";

export default function RiderPortal() {
  const dispatch = useAppDispatch();
  const { session, hydrated } = usePersistedRiderSession();
  const [mode, setMode] = useState<"login" | "apply">("login");
  const [error, setError] = useState("");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");

  async function signIn(phone: string, password: string) {
    setError("");
    try {
      dispatch(setSession(await loginRider(phone, password)));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to sign in.");
    }
  }

  async function replacePassword(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await changePassword(session!.token, current, next);
      dispatch(passwordChanged());
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to update password.",
      );
    }
  }

  if (!hydrated)
    return (
      <main className="shell">
        <p className="muted">Restoring session...</p>
      </main>
    );

  if (session?.mustChangePassword) {
    return (
      <main className="shell auth-shell">
        <section className="card narrow">
          <p className="eyebrow">SECURITY REQUIRED</p>
          <h1>Create your password</h1>
          <p className="muted">
            Set a private password before accessing rider tools.
          </p>
          <form onSubmit={replacePassword} className="space-y">
            <label>
              Temporary password
              <PasswordInput
                required
                autoComplete="current-password"
                value={current}
                onChange={(event) => setCurrent(event.target.value)}
              />
            </label>
            <label>
              New password
              <PasswordInput
                required
                minLength={8}
                autoComplete="new-password"
                value={next}
                onChange={(event) => setNext(event.target.value)}
              />
            </label>
            {error && <p className="alert error">{error}</p>}
            <button className="primary">Save password</button>
          </form>
        </section>
      </main>
    );
  }

  if (session) {
    const initials = session.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return (
      <main className="shell dashboard-shell">
        <nav className="dashboard-topbar" aria-label="Rider account">
          <div className="dashboard-brandmark">
            <span>P2U</span>
            <div>
              <strong>Pharma2u</strong>
              <small>Rider operations</small>
            </div>
          </div>
          <div className="rider-account">
            <span className="rider-avatar">{initials}</span>
            <div>
              <strong>{session.name}</strong>
              <small>Delivery partner</small>
            </div>
            <button onClick={() => dispatch(clearSession())}>Sign out</button>
          </div>
        </nav>

        <section className="dashboard-intro">
          <div>
            <p className="eyebrow">TODAY&apos;S OPERATIONS</p>
            <h1>Welcome back, {session.name.split(" ")[0]}</h1>
            <p>
              Stay online, accept nearby deliveries, and keep every customer
              updated.
            </p>
          </div>
          <span className="dashboard-date">
            <small>RIDER PORTAL</small>
            <strong>Ready for duty</strong>
          </span>
        </section>
        <TaskBoard token={session.token} />
      </main>
    );
  }

  return (
    <main className="shell auth-shell">
      <header>
        <div>
          <p className="brand">PHARMA2U</p>
          <h1>Deliver care, faster.</h1>
          <p className="muted">
            Apply to join our rider network or sign in to your approved account.
          </p>
        </div>
        <div className="tabs" aria-label="Rider account options">
          <button
            className={mode === "login" ? "active" : ""}
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            Sign in
          </button>
          <button
            className={mode === "apply" ? "active" : ""}
            onClick={() => {
              setMode("apply");
              setError("");
            }}
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
