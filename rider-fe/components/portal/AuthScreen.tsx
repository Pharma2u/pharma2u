"use client";
import Image from "next/image";
import { useState } from "react";
import { Bike, CheckCircle2, ShieldCheck, WalletCards } from "lucide-react";
import type { RiderSession } from "@/store/authSlice";
import { ApplicationForm } from "@/components/auth/ApplicationForm";
import { RiderLoginForm } from "@/components/auth/RiderLoginForm";

export function AuthScreen({ onAuthenticated }: { onAuthenticated: (session: RiderSession) => void }) {
  const [mode, setMode] = useState<"login" | "apply">("login");
  return <main className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[0.9fr_1.1fr]">
    <section className="relative overflow-hidden bg-slate-950 px-6 py-8 text-white sm:px-10 lg:flex lg:min-h-screen lg:flex-col lg:justify-between lg:p-14">
      <div className="absolute -right-24 top-20 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
      <Image src="/images/logo/logo.png" alt="Pharma2U" width={150} height={50} className="relative h-auto w-32 brightness-0 invert sm:w-36" priority />
      <div className="relative mt-12 max-w-xl lg:my-auto"><span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-emerald-300"><Bike size={15} />RIDER PARTNER</span><h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">Deliver healthcare.<br /><span className="text-emerald-400">Earn with clarity.</span></h1><p className="mt-5 max-w-lg text-sm leading-7 text-slate-300 sm:text-base">A secure rider workspace for verified deliveries, live navigation, and transparent settlement accounting.</p><div className="mt-8 grid gap-3 sm:grid-cols-3">{[[ShieldCheck, "Verified onboarding"], [WalletCards, "Clear earnings"], [CheckCircle2, "Protected data"]].map(([Icon, label]) => { const C = Icon as typeof ShieldCheck; return <div key={String(label)} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-xs font-semibold"><C size={17} className="text-emerald-400" />{String(label)}</div>; })}</div></div>
      <p className="relative mt-10 text-xs text-slate-500">Sensitive customer details remain protected at every step.</p>
    </section>
    <section className="flex items-center justify-center p-4 py-10 sm:p-10"><div className="w-full max-w-2xl"><div className="mb-6 flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm"><button onClick={() => setMode("login")} className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold ${mode === "login" ? "bg-slate-950 text-white" : "text-slate-500"}`}>Sign in</button><button onClick={() => setMode("apply")} className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold ${mode === "apply" ? "bg-slate-950 text-white" : "text-slate-500"}`}>Join as rider</button></div>{mode === "login" ? <section className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5 sm:p-8"><p className="text-xs font-bold tracking-[0.16em] text-emerald-600">WELCOME BACK</p><h2 className="mt-2 text-2xl font-bold text-slate-950">Rider sign in</h2><p className="mt-2 mb-6 text-sm text-slate-500">Use your password or a secure one-time code.</p><RiderLoginForm onAuthenticated={onAuthenticated} /></section> : <ApplicationForm />}</div></section>
  </main>;
}
