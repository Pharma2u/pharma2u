"use client";

import { FormEvent, useState } from "react";

type Props = {
  onSubmit: (currentPassword: string, newPassword: string) => Promise<void>;
  error: string;
};

export function ChangePasswordForm({ onSubmit, error }: Props) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      await onSubmit(currentPassword, newPassword);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-teal-50 p-5">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl"
      >
        <p className="text-sm font-bold tracking-[0.2em] text-teal-600">
          PASSWORD REQUIRED
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">
          Set a new password
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Replace the temporary password issued by your administrator.
        </p>
        <label className="mt-7 block text-sm font-medium">
          Temporary password
          <input
            required
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className="mt-2 w-full rounded-xl border p-3"
          />
        </label>
        <label className="mt-4 block text-sm font-medium">
          New password
          <input
            required
            minLength={8}
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="mt-2 w-full rounded-xl border p-3"
          />
        </label>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        <button
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-teal-500 p-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Updating..." : "Update password"}
        </button>
      </form>
    </main>
  );
}
