"use client";

import { FormEvent, useState } from "react";
import { PasswordInput } from "./PasswordInput";

type Props = {
  onSubmit: (currentPassword: string, newPassword: string) => Promise<void>;
  error: string;
};

export function PasswordChangeForm({ onSubmit, error }: Props) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    await onSubmit(currentPassword, newPassword).finally(() =>
      setSubmitting(false),
    );
  }
  return (
    <form
      onSubmit={submit}
      className="mx-auto mt-8 max-w-lg rounded-3xl bg-white p-7 shadow-sm"
    >
      <p className="text-sm font-bold text-amber-700">PASSWORD REQUIRED</p>
      <h2 className="mt-2 text-2xl font-bold">
        Replace your temporary password
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        This is required before you can provision accounts.
      </p>
      <label className="mt-6 block text-sm font-medium">
        Temporary password
        <PasswordInput
          required
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          className="w-full rounded-xl border p-3"
        />
      </label>
      <label className="mt-4 block text-sm font-medium">
        New password
        <PasswordInput
          required
          minLength={8}
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          className="w-full rounded-xl border p-3"
        />
      </label>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      <button
        disabled={submitting}
        className="mt-6 rounded-xl bg-amber-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60"
      >
        Update password
      </button>
    </form>
  );
}
