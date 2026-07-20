"use client";

import { FormEvent, useState } from "react";
import { PasswordInput } from "./PasswordInput";
import Image from "next/image";

type Props = {
  onSubmit: (phone: string, password: string) => Promise<void>;
  error: string;
};

export function AdminLoginForm({ onSubmit, error }: Props) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    await onSubmit(phone, password).finally(() => setSubmitting(false));
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top_right,#176c60_0,#062d2a_42%,#041f1d_100%)] p-5">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl sm:p-10"
      >
        <Image src="/images/logo/logo.png" alt="Pharma2U" width={150} height={52} className="h-12 w-auto object-contain" priority />
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Admin portal</h1>
        <p className="mt-2 text-sm text-slate-600">
          Use your administrator credentials.
        </p>
        <label className="mt-7 block text-sm font-semibold text-slate-800">
          Mobile number
          <input
            required
            inputMode="numeric"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 placeholder:text-slate-500"
            placeholder="e.g. 9876543210"
          />
        </label>
        <label className="mt-5 block text-sm font-semibold text-slate-800">
          Password
          <PasswordInput
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 placeholder:text-slate-500"
            placeholder="Enter your password"
          />
        </label>
        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700"
          >
            {error}
          </p>
        )}
        <button
          disabled={submitting}
          className="mt-7 w-full rounded-xl bg-emerald-500 p-3 font-semibold text-slate-950 transition hover:bg-emerald-600 hover:text-white disabled:opacity-60"
        >
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
