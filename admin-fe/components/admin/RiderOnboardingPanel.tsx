"use client";

import { FormEvent, useState } from "react";
import { provisionStaff } from "@/lib/authApi";
import { PasswordInput } from "@/components/auth/PasswordInput";

export function RiderOnboardingPanel({ token }: { token: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsSubmitting(true);
    try {
      const rider = await provisionStaff(token, name, phone, email, "rider", currentPassword);
      setNotice(`Rider created. Phone: ${rider.phone}. Temporary password: ${rider.temporaryPassword}`);
      setName(""); setPhone(""); setEmail(""); setCurrentPassword("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create rider.");
    } finally { setIsSubmitting(false); }
  }

  return <section className="mx-auto mt-8 max-w-2xl rounded-3xl bg-white p-7 shadow-sm">
    <p className="text-sm font-bold text-emerald-600">RIDER ONBOARDING</p>
    <h2 className="mt-2 text-2xl font-bold">Create a rider account</h2>
    <p className="mt-2 text-sm text-slate-500">Create an approved rider directly. The rider must change their temporary password at first sign-in.</p>
    <form onSubmit={submit} className="mt-6 space-y-4">
      <label className="block text-sm font-medium">Name
        <input required value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-xl border p-3" />
      </label>
      <label className="block text-sm font-medium">Mobile number
        <input required inputMode="numeric" value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-2 w-full rounded-xl border p-3" />
      </label>
      <label className="block text-sm font-medium">Email address
        <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border p-3" placeholder="rider@example.com" />
      </label>
      <label className="block text-sm font-medium">Your current password
        <PasswordInput required autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="w-full rounded-xl border p-3" />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {notice && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
      <button disabled={isSubmitting} className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60">
        {isSubmitting ? "Creating rider..." : "Create rider"}
      </button>
    </form>
  </section>;
}
