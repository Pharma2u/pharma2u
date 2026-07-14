"use client";

import { FormEvent, useState } from "react";
import type { ProvisionedAccount } from "@/lib/authApi";

type Props = {
  onProvisionStaff: (
    name: string,
    phone: string,
    email: string,
    role: "rider",
  ) => Promise<ProvisionedAccount>;
  onProvisionAdmin: (
    name: string,
    phone: string,
    currentPassword: string,
  ) => Promise<ProvisionedAccount>;
};

export function ProvisioningPanel({
  onProvisionStaff,
  onProvisionAdmin,
}: Props) {
  const [accountType, setAccountType] = useState<"rider" | "admin">("rider");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult("");
    try {
      const created =
        accountType === "admin"
          ? await onProvisionAdmin(name, phone, currentPassword)
          : await onProvisionStaff(name, phone, email, accountType);
      setResult(
        `${created.role} created for ${created.phone}. Temporary password: ${created.temporaryPassword}`,
      );
      setName("");
      setPhone("");
      setCurrentPassword("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to provision this account.",
      );
    }
  }

  return (
    <section className="mx-auto mt-8 max-w-2xl rounded-3xl bg-white p-7 shadow-sm">
      <p className="text-sm font-bold text-emerald-600">ACCOUNT PROVISIONING</p>
      <h2 className="mt-2 text-2xl font-bold">Create a staff account</h2>
      <p className="mt-2 text-sm text-slate-500">
        Staff receive a server-generated temporary password. Admin creation
        requires your current password.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium">
          Account type
          <select
            value={accountType}
            onChange={(event) =>
              setAccountType(event.target.value as "rider" | "admin")
            }
            className="mt-2 w-full rounded-xl border p-3"
          >
            <option value="rider">Rider</option>
            <option value="admin">Administrator</option>
          </select>
        </label>
        <label className="block text-sm font-medium">
          Name
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 w-full rounded-xl border p-3"
          />
        </label>
        <label className="block text-sm font-medium">
          Mobile number
          <input
            required
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="mt-2 w-full rounded-xl border p-3"
          />
        </label>
        {accountType !== "admin" && (
          <label className="block text-sm font-medium">
            Email address
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-xl border p-3"
              placeholder="staff@example.com"
            />
          </label>
        )}{" "}
        {accountType === "admin" && (
          <label className="block text-sm font-medium">
            Your current password
            <input
              required
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border p-3"
            />
          </label>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {result && (
          <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
            {result}
          </p>
        )}
        <button className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950">
          Create account
        </button>
      </form>
    </section>
  );
}
