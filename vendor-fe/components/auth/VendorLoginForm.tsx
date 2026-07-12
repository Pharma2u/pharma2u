"use client";
import { FormEvent, useState } from "react";
type Props = {
  onSubmit: (phone: string, password: string) => Promise<void>;
  error: string;
};
export function VendorLoginForm({ onSubmit, error }: Props) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    await onSubmit(phone, password).finally(() => setLoading(false));
  }
  return (
    <main className="grid min-h-screen place-items-center bg-[#062d2a] p-5">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl"
      >
        <p className="text-sm font-bold tracking-[0.2em] text-teal-600">
          PHARMA2U
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">
          Vendor portal
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Vendor accounts are created by an administrator.
        </p>
        <label className="mt-7 block text-sm font-medium">
          Email or mobile number
          <input
            required
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="mt-2 w-full rounded-xl border p-3"
          />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Password
          <input
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-xl border p-3"
          />
        </label>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        <button
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-teal-500 p-3 font-semibold text-slate-950 disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
