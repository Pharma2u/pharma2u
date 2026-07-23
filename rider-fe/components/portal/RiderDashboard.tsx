"use client";

import Image from "next/image";
import { useState } from "react";
import {
  Bike,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  WalletCards,
  X,
} from "lucide-react";
import type { RiderSession } from "@/store/authSlice";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { FinancePanel } from "@/components/finance/FinancePanel";
import { NotificationsMenu } from "./NotificationsMenu";

type View = "deliveries" | "earnings" | "history";
const nav = [
  { id: "deliveries", label: "Delivery dashboard", icon: LayoutDashboard },
  { id: "earnings", label: "Earnings", icon: WalletCards },
  { id: "history", label: "History", icon: History },
] as const;

export function RiderDashboard({
  session,
  onSignOut,
}: {
  session: RiderSession;
  onSignOut: () => void;
}) {
  const [view, setView] = useState<View>("deliveries");
  const [menu, setMenu] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const firstName = session.name.split(" ")[0];
  const activeNav = nav.find((item) => item.id === view);
  const initials = session.name
    .split(" ")
    .map((value) => value[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const navigate = (next: View) => {
    setView(next);
    setMenu(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-[#f4f7f7] pb-20 text-slate-800 lg:pb-0">
      {menu && (
        <button
          aria-label="Close navigation"
          onClick={() => setMenu(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] lg:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col border-r border-slate-200 bg-white transition-all duration-200 lg:translate-x-0 ${menu ? "translate-x-0" : "-translate-x-full"} ${collapsed ? "lg:w-[76px]" : "lg:w-[258px]"}`}
      >
        <div className="flex h-[70px] items-center justify-between border-b border-slate-100 px-4">
          <button
            onClick={() => navigate("deliveries")}
            className="flex min-w-0 items-center gap-2.5"
            aria-label="Open delivery dashboard"
          >
            <Image
              src="/images/logo/logo.png"
              alt="Pharma2U"
              width={120}
              height={40}
              className={collapsed ? "h-9 w-9 object-cover object-left" : "h-10 w-auto object-contain"}
              priority
            />
            {!collapsed && <span className="text-xs font-extrabold tracking-[.12em] text-slate-500">RIDER PORTAL</span>}
          </button>
          <button onClick={() => setMenu(false)} className="rounded-lg p-2 text-slate-500 lg:hidden" aria-label="Close navigation">
            <X size={20} />
          </button>
        </div>
        <div className={`mx-3 mt-4 rounded-2xl bg-emerald-50 p-4 ${collapsed ? "px-3" : ""}`}>
          <Bike className="text-emerald-700" size={21} />
          {!collapsed && <>
            <p className="mt-2 text-xs font-medium text-emerald-800">Rider workspace</p>
            <strong className="text-sm text-slate-900">{firstName}</strong>
          </>}
        </div>
        <nav className="flex-1 px-3 py-5" aria-label="Rider navigation">
          {!collapsed && <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.17em] text-slate-400">Workspace</p>}
          <div className="space-y-1">
            {nav.map((item) => {
              const Icon = item.icon;
              const selected = view === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${selected ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}
                >
                  <Icon size={18} strokeWidth={selected ? 2.4 : 1.9} className="shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </div>
        </nav>
        <div className="border-t border-slate-100 p-3">
          <button onClick={onSignOut} className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-700">
            <LogOut size={18} />
            {!collapsed && "Sign out"}
          </button>
          <button onClick={() => setCollapsed((value) => !value)} className="mt-1 hidden h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-500 hover:bg-slate-50 lg:flex">
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            {!collapsed && "Collapse menu"}
          </button>
        </div>
      </aside>
      <div className={`transition-all duration-200 ${collapsed ? "lg:pl-[76px]" : "lg:pl-[258px]"}`}>
        <header className="sticky top-0 z-30 h-[70px] border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
          <div className="flex h-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button onClick={() => setMenu(true)} className="rounded-xl border border-slate-200 p-2 text-slate-600 lg:hidden" aria-label="Open navigation">
                <Menu size={20} />
              </button>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-emerald-700">Rider partner</p>
                <h2 className="truncate text-sm font-bold text-slate-900">{activeNav?.label}</h2>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <NotificationsMenu token={session.token} />
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold text-slate-900">{session.name}</p>
                <p className="text-[11px] text-slate-500">Verified rider</p>
              </div>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-900 text-xs font-bold text-white">{initials}</span>
            </div>
          </div>
        </header>
        <section className="min-w-0 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <div className="mb-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">{view === "deliveries" ? "Today’s operations" : "Rider workspace"}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {view === "deliveries" ? `Ready to deliver, ${firstName}` : view === "earnings" ? "Your rider wallet" : "Your completed work"}
            </h1>
          </div>
          {view === "deliveries" && <TaskBoard token={session.token} />}
          {view === "earnings" && <FinancePanel token={session.token} />}
          {view === "history" && <FinancePanel token={session.token} historyOnly />}
        </section>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-slate-200 bg-white px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 lg:hidden">
        {nav.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(item.id)}
            className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-semibold ${view === item.id ? "text-emerald-700" : "text-slate-400"}`}
          >
            <item.icon size={20} />
            {item.label === "Delivery dashboard" ? "Dashboard" : item.label}
          </button>
        ))}
      </nav>
    </main>
  );
}
