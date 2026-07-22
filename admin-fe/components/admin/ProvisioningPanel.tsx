"use client";

import { FormEvent, useState } from "react";
import type { ProvisionedAccount } from "@/lib/authApi";
import { PasswordInput } from "@/components/auth/PasswordInput";

type Props = {
  onProvisionAdmin: (
    name: string,
    phone: string,
    currentPassword: string,
  ) => Promise<ProvisionedAccount>;
};

export function ProvisioningPanel({ onProvisionAdmin }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult("");
    try {
      const created = await onProvisionAdmin(name, phone, currentPassword);
      setResult(
        `Administrator created for ${created.phone}. Temporary password: ${created.temporaryPassword}`,
      );
      setName("");
      setPhone("");
      setCurrentPassword("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to create the administrator account.",
      );
    }
  }

  return (
    <section className="mx-auto mt-8 max-w-2xl rounded-3xl bg-white p-7 shadow-sm">
      <p className="text-sm font-bold text-emerald-600">ACCOUNT PROVISIONING</p>
      <h2 className="mt-2 text-2xl font-bold">
        Create an administrator account
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        Create a new administrator with a server-generated temporary password.
        Your current password is required for this privileged action.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium">
          Administrator name
          <input
            required
            minLength={2}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 w-full rounded-xl border p-3"
          />
        </label>
        <label className="block text-sm font-medium">
          Mobile number
          <input
            required
            inputMode="numeric"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="mt-2 w-full rounded-xl border p-3"
          />
        </label>
        <label className="block text-sm font-medium">
          Your current password
          <PasswordInput
            required
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className="w-full rounded-xl border p-3"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {result && (
          <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
            {result}
          </p>
        )}
        <button className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950">
          Create administrator
        </button>
      </form>
    </section>
  );
}
