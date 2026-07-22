"use client";

import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  BookOpen,
  Building2,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  CreditCard,
  Headphones,
  HeartHandshake,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Megaphone,
  Menu,
  PackageSearch,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldCheck,
  Truck,
  UserRoundCheck,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import type { AdminSection, CompanyProfile } from "./types";

type NavItem = { id: AdminSection; label: string; icon: LucideIcon };
const navigation: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "operations", label: "Live operations", icon: ListChecks },
    ],
  },
  {
    label: "Network",
    items: [
      {
        id: "pharmacy-applications",
        label: "Joining requests",
        icon: ClipboardCheck,
      },
      { id: "pharmacy-onboarding", label: "Pharmacy network", icon: Building2 },
      {
        id: "rider-applications",
        label: "Rider applications",
        icon: UserRoundCheck,
      },
      { id: "rider-onboarding", label: "Rider onboarding", icon: Truck },
      { id: "fleet", label: "Live fleet", icon: PackageSearch },
    ],
  },
  {
    label: "Finance",
    items: [
      { id: "accounting", label: "Unified accounting", icon: CircleDollarSign },
      { id: "ledger", label: "General ledger", icon: BookOpen },
      { id: "subscriptions", label: "Subscriptions", icon: CreditCard },
      { id: "hrm", label: "HR & payroll", icon: WalletCards },
    ],
  },
  {
    label: "Engagement",
    items: [
      { id: "customers", label: "Customers & loyalty", icon: HeartHandshake },
      { id: "announcements", label: "Announcements", icon: Megaphone },
      { id: "banners", label: "Homepage banners", icon: Bell },
      { id: "support", label: "Support desk", icon: Headphones },
    ],
  },
  {
    label: "Administration",
    items: [
      { id: "accounts", label: "Account provisioning", icon: UsersRound },
      { id: "access", label: "Roles & access", icon: ShieldCheck },
      { id: "company", label: "Company setup", icon: Settings },
    ],
  },
];

export function AdminShell({
  active,
  onNavigate,
  company,
  userName,
  onSignOut,
  children,
}: {
  active: AdminSection;
  onNavigate: (section: AdminSection) => void;
  company: CompanyProfile;
  userName: string;
  onSignOut: () => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const activeItem = navigation
    .flatMap((group) => group.items)
    .find((item) => item.id === active);
  const go = (section: AdminSection) => {
    onNavigate(section);
    setOpen(false);
  };
  const asideClass = [
    "fixed inset-y-0 left-0 z-50 flex w-[278px] flex-col border-r border-slate-200 bg-white transition-all duration-200 lg:translate-x-0",
    open ? "translate-x-0" : "-translate-x-full",
    collapsed ? "lg:w-[76px]" : "lg:w-[258px]",
  ].join(" ");
  const contentClass = [
    "transition-all duration-200",
    collapsed ? "lg:pl-[76px]" : "lg:pl-[258px]",
  ].join(" ");

  return (
    <main className="min-h-screen bg-[#f4f7f7] text-slate-800">
      {open && (
        <button
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] lg:hidden"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={asideClass}>
        <div className="flex h-[70px] items-center justify-between border-b border-slate-100 px-4">
          <button
            onClick={() => go("dashboard")}
            className="flex min-w-0 items-center gap-2.5"
            aria-label="Open dashboard"
          >
            {company.logoDataUrl ? (
              <Image
                unoptimized
                width={40}
                height={40}
                src={company.logoDataUrl}
                alt="Company logo"
                className="h-10 w-10 rounded-xl object-contain"
              />
            ) : (
              <Image
                src="/images/logo/logo.png"
                alt="Pharma2U"
                width={122}
                height={40}
                className={
                  collapsed
                    ? "h-9 w-9 object-cover object-left"
                    : "h-10 w-auto object-contain"
                }
                priority
              />
            )}
            {!collapsed && company.logoDataUrl && (
              <span className="truncate text-sm font-extrabold text-slate-900">
                {company.name}
              </span>
            )}
          </button>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-2 text-slate-500 lg:hidden"
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>
        <nav
          className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4"
          aria-label="Admin navigation"
        >
          {navigation.map((group) => (
            <div className="mb-5" key={group.label}>
              {!collapsed && (
                <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.17em] text-slate-400">
                  {group.label}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const selected = active === item.id;
                  const navClass = [
                    "group flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold transition",
                    selected
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                  ].join(" ");
                  return (
                    <button
                      key={item.id}
                      onClick={() => go(item.id)}
                      title={collapsed ? item.label : undefined}
                      className={navClass}
                      aria-current={selected ? "page" : undefined}
                    >
                      <Icon
                        size={18}
                        strokeWidth={selected ? 2.4 : 1.9}
                        className="shrink-0"
                      />
                      {!collapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                      {selected && !collapsed && (
                        <ChevronRight size={15} className="ml-auto" />
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
            onClick={onSignOut}
            className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut size={18} />
            {!collapsed && "Sign out"}
          </button>
          <button
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
      <div className={contentClass}>
        <header className="sticky top-0 z-30 h-[70px] border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
          <div className="flex h-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setOpen(true)}
                className="rounded-xl border border-slate-200 p-2 text-slate-600 lg:hidden"
                aria-label="Open navigation"
              >
                <Menu size={20} />
              </button>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-emerald-700">
                  Admin panel
                </p>
                <h2 className="truncate text-sm font-bold text-slate-900">
                  {activeItem?.label}
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                className="relative rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-50"
                aria-label="Notifications"
              >
                <Bell size={18} />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500" />
              </button>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold text-slate-900">{userName}</p>
                <p className="text-[11px] text-slate-500">Core administrator</p>
              </div>
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-900 text-xs font-bold text-white">
                {userName.slice(0, 2).toUpperCase()}
              </div>
            </div>
          </div>
        </header>
        <div className="px-4 py-5 sm:px-6 lg:px-8 lg:py-7">{children}</div>
      </div>
    </main>
  );
}
