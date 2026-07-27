"use client";

import {
  BellRing,
  ChevronRight,
  CircleHelp,
  Gift,
  Headphones,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export function IncentivesPanel() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-3xl bg-gradient-to-br from-emerald-700 to-emerald-500 p-6 text-white shadow-lg shadow-emerald-900/10">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15">
          <Gift size={23} />
        </span>
        <p className="mt-8 text-xs font-bold uppercase tracking-[.14em] text-emerald-100">
          Rider rewards
        </p>
        <h2 className="mt-2 text-2xl font-extrabold">
          Your next incentive is on the way
        </h2>
        <p className="mt-3 max-w-md text-sm leading-6 text-emerald-50">
          New targets are published by operations. You will see the goal,
          validity period, and payout terms here before opting in.
        </p>
      </section>
      <section className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-50 text-amber-500">
            <Sparkles size={21} />
          </span>
          <div>
            <h2 className="font-extrabold text-slate-950">How rewards work</h2>
            <p className="text-xs text-slate-500">Clear and trackable</p>
          </div>
        </div>
        <ol className="mt-6 space-y-4 text-sm text-slate-600">
          {[
            "Accept a published target.",
            "Complete eligible deliveries within the stated period.",
            "The reward is credited to your rider ledger.",
          ].map((item, index) => (
            <li key={item} className="flex items-start gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-50 text-[11px] font-bold text-emerald-700">
                {index + 1}
              </span>
              {item}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

export function SupportPanel() {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
      <section className="rounded-3xl border border-slate-200 bg-white p-6">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
          <Headphones size={23} />
        </span>
        <h2 className="mt-5 text-xl font-extrabold text-slate-950">
          Rider support
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          For an active-order emergency, call support. For account or payment
          questions, email the team with the order code only—never send an OTP
          or customer medical information.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <a
            href="tel:+914040000000"
            className="flex items-center justify-between rounded-2xl bg-slate-950 p-4 text-sm font-bold text-white"
          >
            <span className="flex items-center gap-2">
              <Phone size={17} /> Call support
            </span>
            <ChevronRight size={16} />
          </a>
          <a
            href="mailto:support@pharma2u.in"
            className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 text-sm font-bold text-slate-800"
          >
            <span className="flex items-center gap-2">
              <Mail size={17} /> Email support
            </span>
            <ChevronRight size={16} />
          </a>
        </div>
      </section>
      <section className="rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="font-extrabold text-slate-950">Quick answers</h2>
        <div className="mt-4 space-y-3">
          {[
            ["I cannot go online", "Enable precise location and retry."],
            ["A delivery code fails", "Confirm all six digits and try once."],
            ["A job disappeared", "Another rider may have accepted it first."],
          ].map(([title, detail]) => (
            <div key={title} className="rounded-2xl bg-slate-50 p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <CircleHelp size={15} className="text-emerald-600" />
                {title}
              </p>
              <p className="mt-1 pl-6 text-xs text-slate-500">{detail}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function SettingsPanel({
  name,
  onSignOut,
}: {
  name: string;
  onSignOut: () => void;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-3xl border border-slate-200 bg-white p-6">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
          <ShieldCheck size={23} />
        </span>
        <h2 className="mt-5 text-xl font-extrabold text-slate-950">{name}</h2>
        <p className="mt-1 text-sm text-emerald-700">Verified delivery partner</p>
        <div className="mt-6 rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <LockKeyhole className="text-slate-500" size={18} />
            <div>
              <strong className="text-sm text-slate-800">Protected account</strong>
              <p className="text-xs text-slate-500">
                Your private credentials are never shown in this workspace.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <BellRing className="text-emerald-600" size={20} />
          <div>
            <h2 className="font-extrabold text-slate-950">Notifications</h2>
            <p className="text-xs text-slate-500">
              Operational notices appear in the header.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="mt-8 w-full rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700"
        >
          Sign out of this device
        </button>
      </section>
    </div>
  );
}
