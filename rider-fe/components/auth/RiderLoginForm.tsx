"use client";

import { FormEvent, useState } from "react";
import { KeyRound, LoaderCircle, MessageSquareText, Smartphone } from "lucide-react";
import { loginRider, requestRiderOtp, verifyRiderOtp } from "@/lib/api";
import type { RiderSession } from "@/store/authSlice";
import { PasswordInput } from "./PasswordInput";

export function RiderLoginForm({ onAuthenticated }: { onAuthenticated: (session: RiderSession) => void }) {
  const [method, setMethod] = useState<"password" | "otp">("password");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [developmentOtp, setDevelopmentOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const session = method === "password"
        ? await loginRider(phone, password)
        : await verifyRiderOtp(phone, otp);
      onAuthenticated(session);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  async function sendOtp() {
    setBusy(true);
    setError("");
    try {
      const result = await requestRiderOtp(phone);
      setOtpSent(true);
      setDevelopmentOtp(result.developmentOtp ?? "");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to send OTP.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
        {(["password", "otp"] as const).map((value) => (
          <button key={value} type="button" onClick={() => { setMethod(value); setError(""); }} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${method === value ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}>
            {value === "password" ? <KeyRound size={17} /> : <MessageSquareText size={17} />}
            {value === "password" ? "Password" : "Mobile OTP"}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-semibold text-slate-700">
          Mobile number
          <div className="relative mt-2">
            <Smartphone className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
            <input required inputMode="numeric" pattern="[6-9][0-9]{9}" value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))} className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" placeholder="10-digit mobile number" />
          </div>
        </label>
        {method === "password" ? (
          <label className="block text-sm font-semibold text-slate-700">
            Password
            <PasswordInput required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500" />
          </label>
        ) : otpSent ? (
          <label className="block text-sm font-semibold text-slate-700">
            6-digit OTP
            <input required inputMode="numeric" pattern="[0-9]{6}" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-xl tracking-[0.45em] outline-none focus:border-emerald-500" placeholder="000000" />
            {developmentOtp && <span className="mt-2 block text-xs font-medium text-amber-700">Development OTP: {developmentOtp}</span>}
          </label>
        ) : (
          <button type="button" disabled={busy || phone.length !== 10} onClick={() => void sendOtp()} className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 font-semibold text-emerald-800 disabled:opacity-50">Send secure OTP</button>
        )}
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {(method === "password" || otpSent) && (
          <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3.5 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60">
            {busy && <LoaderCircle className="animate-spin" size={18} />}
            {busy ? "Verifying..." : "Sign in securely"}
          </button>
        )}
      </form>
    </div>
  );
}
