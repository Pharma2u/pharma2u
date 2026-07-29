"use client";

import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Calculator,
  ChevronRight,
  CirclePlus,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  Settings,
  Store,
  Tags,
  Wallet,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { CompanyLogo } from "../branding/CompanyLogo";
import type { Workspace } from "./types";

type Item = { id: Workspace; label: string; icon: LucideIcon };
const navigation: { label: string; items: Item[] }[] = [
  {
    label: "Overview",
    items: [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Billing & orders",
    items: [
      { id: "billing", label: "Counter billing", icon: Receipt },
      { id: "orders", label: "Pharma2U orders", icon: Receipt },
    ],
  },
  {
    label: "Inventory",
    items: [
      { id: "products", label: "Products", icon: Package },
      { id: "add-product", label: "Add product", icon: CirclePlus },
      { id: "pharmacy", label: "My pharmacy", icon: Store },
    ],
  },
  {
    label: "Finance",
    items: [
      { id: "finance", label: "Financial accounting", icon: Calculator },
      { id: "reports", label: "Financial reports", icon: BarChart3 },
      { id: "promotions", label: "Promotions & coupons", icon: Tags },
      { id: "payouts", label: "Payout management", icon: Wallet },
    ],
  },
  {
    label: "Preferences",
    items: [{ id: "settings", label: "Settings", icon: Settings }],
  },
];

export function VendorShell({
  active,
  onNavigate,
  onSignOut,
  children,
}: {
  active: Workspace;
  onNavigate: (workspace: Workspace) => void;
  userName: string;
  token: string;
  onSignOut: () => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const go = (id: Workspace) => {
    onNavigate(id);
    setOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const aside = `fixed inset-y-0 left-0 z-50 flex w-[278px] flex-col border-r border-slate-200 bg-white transition-all duration-200 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"} ${collapsed ? "lg:w-[76px]" : "lg:w-[258px]"}`;
  return (
    <main className="min-h-screen bg-[#f4f7f7] text-slate-800">
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] lg:hidden"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={aside}>
        <div className="flex h-[106px] items-center justify-between border-b border-slate-100 px-3">
          <button
            type="button"
            onClick={() => go("dashboard")}
            aria-label="Open vendor dashboard"
          >
            <CompanyLogo
              width={250}
              height={100}
              className={
                collapsed
                  ? "h-14 w-14 object-contain"
                  : "h-[100px] w-[230px] object-contain"
              }
              priority
            />
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="p-2 text-slate-500 lg:hidden"
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>
        <nav
          className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4"
          aria-label="Vendor navigation"
        >
          {navigation.map((group) => (
            <div className="mb-5" key={group.label}>
              {!collapsed && (
                <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.17em] text-slate-400">
                  {group.label}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const selected = active === item.id;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => go(item.id)}
                      title={collapsed ? item.label : undefined}
                      className={`flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${selected ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}
                      aria-current={selected ? "page" : undefined}
                    >
                      <Icon
                        size={18}
                        strokeWidth={selected ? 2.4 : 1.9}
                        className="shrink-0"
                      />
                      {!collapsed && (
                        <>
                          <span className="truncate">{item.label}</span>
                          {selected && (
                            <ChevronRight size={15} className="ml-auto" />
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-slate-100 p-3">
          <button
            type="button"
            onClick={onSignOut}
            className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut size={18} />
            {!collapsed && "Sign out"}
          </button>
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="mt-1 hidden h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-500 hover:bg-slate-50 lg:flex"
          >
            {collapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
            {!collapsed && "Collapse menu"}
          </button>
        </div>
      </aside>
      <div
        className={`transition-all duration-200 ${collapsed ? "lg:pl-[76px]" : "lg:pl-[258px]"}`}
      >
        <button type="button" onClick={() => setOpen(true)} className="fixed right-4 top-4 z-30 grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm lg:hidden" aria-label="Open navigation"><Menu size={20} /></button>
        <div className="px-4 py-5 sm:px-6 lg:px-8 lg:py-7">{children}</div>
      </div>
    </main>
  );
}
