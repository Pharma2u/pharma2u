"use client";

import Image from "next/image";
import { useState } from "react";
import {
  Bike,
  ChevronDown,
  History,
  LayoutDashboard,
  LogOut,
  WalletCards,
  X,
} from "lucide-react";
import type { RiderSession } from "@/store/authSlice";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { FinancePanel } from "@/components/finance/FinancePanel";
import { NotificationsMenu } from "./NotificationsMenu";

type View = "deliveries" | "earnings" | "history";
const nav = [
  { id: "deliveries", label: "Home", icon: LayoutDashboard },
  { id: "earnings", label: "Earnings", icon: WalletCards },
  { id: "history", label: "History", icon: History },
] as const;

const headings: Record<
  View,
  { eyebrow: string; title: string; detail: string }
> = {
  deliveries: {
    eyebrow: "Rider workspace",
    title: "Today’s deliveries",
    detail: "Go online, accept a job, and follow each step.",
  },
  earnings: {
    eyebrow: "Rider wallet",
    title: "Earnings & settlement",
    detail: "A clear view of earnings, cash, and payouts.",
  },
  history: {
    eyebrow: "Completed work",
    title: "Delivery history",
    detail: "Your completed jobs and delivery earnings.",
  },
};

export function RiderDashboard({
  session,
  onSignOut,
}: {
  session: RiderSession;
  onSignOut: () => void;
}) {
  const [view, setView] = useState<View>("deliveries");
  const [profileOpen, setProfileOpen] = useState(false);
  const firstName = session.name.split(" ")[0];
  const initials = session.name
    .split(" ")
    .map((value) => value[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const copy = headings[view];

  const navigate = (next: View) => {
    setView(next);
    setProfileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-[#f5f7f6] pb-24 text-slate-800 lg:pb-0 lg:pl-[238px]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[238px] flex-col border-r border-slate-200 bg-white lg:flex">
        <button
          onClick={() => navigate("deliveries")}
          className="flex h-[76px] items-center gap-3 border-b border-slate-100 px-5 text-left"
        >
          <Image
            src="/images/logo/logo.png"
            alt="Pharma2U"
            width={132}
            height={44}
            className="h-10 w-auto object-contain"
            priority
          />
        </button>
        <div className="mx-4 mt-5 rounded-2xl bg-slate-950 p-4 text-white">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-400 text-slate-950">
            <Bike size={19} />
          </span>
          <p className="mt-3 text-[10px] font-bold uppercase tracking-[.15em] text-emerald-300">
            Delivery partner
          </p>
          <strong className="mt-0.5 block truncate text-sm">{firstName}</strong>
        </div>
        <nav className="flex-1 px-3 py-6" aria-label="Rider navigation">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">
            Workspace
          </p>
          <div className="space-y-1">
            {nav.map((item) => {
              const Icon = item.icon;
              const selected = item.id === view;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.id)}
                  className={`flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-bold transition ${selected ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
                >
                  <Icon size={18} strokeWidth={selected ? 2.5 : 2} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>
        <div className="border-t border-slate-100 p-3">
          <div className="mb-2 flex items-center gap-3 rounded-xl px-3 py-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-xs font-extrabold text-slate-700">
              {initials}
            </span>
            <div className="min-w-0">
              <strong className="block truncate text-xs text-slate-900">
                {session.name}
              </strong>
              <small className="text-[10px] text-slate-400">
                Verified rider
              </small>
            </div>
          </div>
          <button
            onClick={onSignOut}
            className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <button onClick={() => navigate("deliveries")} className="lg:hidden">
            <Image
              src="/images/logo/logo.png"
              alt="Pharma2U"
              width={116}
              height={38}
              className="h-9 w-auto object-contain"
              priority
            />
          </button>
          <div className="hidden lg:block">
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-emerald-700">
              Pharma2U Rider
            </p>
            <p className="text-xs font-semibold text-slate-500">
              Safe delivery. Clear earnings.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationsMenu token={session.token} />
            <div className="relative">
              <button
                onClick={() => setProfileOpen((value) => !value)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 pr-2 text-left"
              >
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-950 text-[11px] font-extrabold text-white">
                  {initials}
                </span>
                <span className="hidden max-w-28 truncate text-xs font-bold text-slate-800 sm:block">
                  {firstName}
                </span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                  <div className="flex items-start justify-between gap-3 px-2 pb-3">
                    <div className="min-w-0">
                      <strong className="block truncate text-sm text-slate-900">
                        {session.name}
                      </strong>
                      <small className="text-xs text-emerald-700">
                        Verified rider
                      </small>
                    </div>
                    <button
                      onClick={() => setProfileOpen(false)}
                      className="text-slate-400"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <button
                    onClick={onSignOut}
                    className="flex w-full items-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm font-bold text-red-700"
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-[.17em] text-emerald-700">
            {copy.eyebrow}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
            {view === "deliveries" ? `Good day, ${firstName}` : copy.title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{copy.detail}</p>
        </div>
        {view === "deliveries" && <TaskBoard token={session.token} />}
        {view === "earnings" && <FinancePanel token={session.token} />}
        {view === "history" && (
          <FinancePanel token={session.token} historyOnly />
        )}
      </section>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-slate-200 bg-white/95 px-3 pb-[max(.6rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden"
        aria-label="Mobile rider navigation"
      >
        {nav.map((item) => {
          const Icon = item.icon;
          const selected = item.id === view;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold ${selected ? "bg-emerald-50 text-emerald-700" : "text-slate-400"}`}
            >
              <Icon size={19} strokeWidth={selected ? 2.5 : 2} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </main>
  );
}
