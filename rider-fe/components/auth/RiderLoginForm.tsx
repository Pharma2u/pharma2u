"use client";
import { FormEvent, useState } from "react";
export function RiderLoginForm({
  onSubmit,
  error,
}: {
  onSubmit: (phone: string, password: string) => Promise<void>;
  error: string;
}) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await onSubmit(phone, password);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <label>
        Mobile number
        <input
          required
          inputMode="numeric"
          pattern="[6-9][0-9]{9}"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="10-digit mobile number"
        />
      </label>
      <label>
        Password
        <input
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Your password"
        />
      </label>
      {error && <p className="alert error">{error}</p>}
      <button disabled={busy} className="primary">
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
