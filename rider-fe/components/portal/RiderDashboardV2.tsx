"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  Bike,
  ChevronDown,
  CircleHelp,
  Gift,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageCheck,
  Settings,
  WalletCards,
  X,
} from "lucide-react";
import type { RiderSession } from "@/store/authSlice";
import { getRiderFinance } from "@/lib/api";
import { formatMoney } from "@/components/tasks/taskHelpers";
import { FinancePanel } from "@/components/finance/FinancePanel";
import { NotificationsMenu } from "./NotificationsMenu";
import { DashboardHome } from "./DashboardHome";
import {
  IncentivesPanel,
  SettingsPanel,
  SupportPanel,
} from "./UtilityPanels";

type View =
  | "dashboard"
  | "earnings"
  | "deliveries"
  | "history"
  | "incentives"
  | "support"
  | "settings";

const navigation = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "earnings", label: "Earnings", icon: WalletCards },
  { id: "deliveries", label: "My Deliveries", icon: PackageCheck },
  { id: "history", label: "History", icon: History },
  { id: "incentives", label: "Incentives", icon: Gift },
  { id: "support", label: "Help & Support", icon: CircleHelp },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

const copy: Record<View, { title: string; detail: string }> = {
  dashboard: {
    title: "Dashboard",
    detail: "Ready to deliver smiles today?",
  },
  earnings: {
    title: "Earnings",
    detail: "Track delivery income, COD cash, and settlement.",
  },
  deliveries: {
    title: "My deliveries",
    detail: "Manage active jobs and find deliveries nearby.",
  },
  history: {
    title: "Delivery history",
    detail: "Review completed deliveries and earnings.",
  },
  incentives: {
    title: "Incentives",
    detail: "See your current rider rewards and targets.",
  },
  support: {
    title: "Help & support",
    detail: "Get help with a delivery or your rider account.",
  },
  settings: {
    title: "Settings",
    detail: "Manage your rider workspace and account session.",
  },
};

export function RiderDashboardV2({
  session,
  onSignOut,
}: {
  session: RiderSession;
  onSignOut: () => void;
}) {
  const [view, setView] = useState<View>("dashboard");
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const firstName = session.name.trim().split(/\s+/)[0] || "Partner";
  const initials = session.name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    void getRiderFinance(session.token)
      .then((data) => setWalletBalance(data.summary.balance))
      .catch(() => setWalletBalance(null));
  }, [session.token, view]);

  function navigate(next: View) {
    setView(next);
    setProfileOpen(false);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const heading =
    view === "dashboard" ? `Good morning, ${firstName} 👋` : copy[view].title;

  return (
    <main className="min-h-screen bg-[#f7f9fb] pb-24 text-slate-800 lg:pb-0 lg:pl-[258px]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[258px] flex-col border-r border-slate-200 bg-white lg:flex">
        <button
          type="button"
          onClick={() => navigate("dashboard")}
          className="flex h-[88px] items-center px-6"
        >
          <Image
            src="/images/logo/logo.png"
            alt="Pharma2U"
            width={155}
            height={50}
            className="h-11 w-auto object-contain"
            priority
          />
        </button>

        <section className="mx-5 rounded-[1.35rem] bg-gradient-to-br from-[#06152f] to-[#001029] p-4 text-white shadow-lg shadow-slate-950/10">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-400 text-slate-950">
              <Bike size={20} />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[.13em] text-emerald-200">
              Delivery partner
            </span>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <strong className="truncate text-sm">{firstName}</strong>
            <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-300">
              VERIFIED
            </span>
          </div>
          <p className="mt-1 text-[10px] text-slate-400">Pharma2U Rider</p>
        </section>

        <nav className="mt-4 flex-1 space-y-1 px-5" aria-label="Rider navigation">
          {navigation.map((item) => {
            const Icon = item.icon;
            const selected = view === item.id;
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`relative flex h-12 w-full items-center gap-3 rounded-xl px-4 text-sm font-semibold transition ${
                  selected
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {selected && (
                  <i className="absolute -left-5 h-8 w-0.5 rounded-r bg-emerald-600" />
                )}
                <Icon size={18} strokeWidth={selected ? 2.5 : 2} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="m-5 rounded-2xl border border-slate-200 p-4">
          <p className="text-[11px] text-slate-500">Wallet balance</p>
          <strong className="mt-1 block text-lg text-slate-950">
            {walletBalance == null ? "—" : formatMoney(walletBalance)}
          </strong>
          <button
            type="button"
            onClick={() => navigate("earnings")}
            className="mt-4 w-full rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white"
          >
            View wallet
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[88px] max-w-[1500px] items-center justify-between px-4 sm:px-7">
          <button
            type="button"
            onClick={() => navigate("dashboard")}
            className="lg:hidden"
          >
            <Image
              src="/images/logo/logo.png"
              alt="Pharma2U"
              width={120}
              height={40}
              className="h-9 w-auto object-contain"
              priority
            />
          </button>
          <div className="hidden lg:block">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#08152d]">
              {heading}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{copy[view].detail}</p>
          </div>
          <div className="flex items-center gap-2.5">
            <NotificationsMenu token={session.token} />
            <button
              type="button"
              onClick={() => navigate("support")}
              aria-label="Help and support"
              className="hidden rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 sm:block"
            >
              <CircleHelp size={19} />
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((open) => !open)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 pr-2.5 text-left"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#13234a] text-[11px] font-extrabold text-white">
                  {initials}
                </span>
                <span className="hidden sm:block">
                  <strong className="block max-w-28 truncate text-xs text-slate-900">
                    {firstName}
                  </strong>
                  <small className="block text-[10px] text-slate-400">
                    Rider account
                  </small>
                </span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-14 z-50 w-60 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl">
                  <div className="flex items-start justify-between gap-3 p-2">
                    <div className="min-w-0">
                      <strong className="block truncate text-sm text-slate-900">
                        {session.name}
                      </strong>
                      <small className="text-xs text-emerald-700">
                        Verified rider
                      </small>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProfileOpen(false)}
                      aria-label="Close profile menu"
                      className="text-slate-400"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="mt-2 flex w-full items-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm font-bold text-red-700"
                  >
                    <LogOut size={16} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1500px] px-4 py-5 sm:px-7 lg:py-6">
        <div className="mb-5 lg:hidden">
          <h1 className="text-xl font-extrabold tracking-tight text-[#08152d]">
            {heading}
          </h1>
          <p className="mt-1 text-xs text-slate-500">{copy[view].detail}</p>
        </div>
        {view === "dashboard" && <DashboardHome token={session.token} />}
        {view === "deliveries" && (
          <DashboardHome token={session.token} tasksOnly />
        )}
        {view === "earnings" && <FinancePanel token={session.token} />}
        {view === "history" && (
          <FinancePanel token={session.token} historyOnly />
        )}
        {view === "incentives" && <IncentivesPanel />}
        {view === "support" && <SupportPanel />}
        {view === "settings" && (
          <SettingsPanel name={session.name} onSignOut={onSignOut} />
        )}
      </section>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-slate-200 bg-white/95 px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden"
        aria-label="Mobile rider navigation"
      >
        {navigation.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const selected = view === item.id;
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[9px] font-bold ${
                selected ? "bg-emerald-50 text-emerald-700" : "text-slate-400"
              }`}
            >
              <Icon size={18} strokeWidth={selected ? 2.5 : 2} />
              {item.label.replace("My ", "")}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[9px] font-bold text-slate-400"
        >
          <Menu size={18} /> More
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-950/35 p-3 backdrop-blur-sm lg:hidden">
          <section className="w-full rounded-3xl bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between px-2">
              <strong className="text-sm text-slate-900">More options</strong>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
                className="rounded-xl bg-slate-100 p-2 text-slate-500"
              >
                <X size={17} />
              </button>
            </div>
            {navigation.slice(4).map((item) => {
              const Icon = item.icon;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => navigate(item.id)}
                  className="flex h-13 w-full items-center gap-3 rounded-2xl px-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  <Icon size={18} className="text-emerald-600" />
                  {item.label}
                </button>
              );
            })}
          </section>
        </div>
      )}
    </main>
  );
}
