"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownToLine,
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  PackageCheck,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  Truck,
  WalletCards,
} from "lucide-react";
import type { FinanceMode, FinancialSummary } from "./types";
import { rupees } from "./vendorUtils";

type Metric = {
  label: string;
  value: number;
  detail: string;
  icon: typeof CircleDollarSign;
  tone: string;
};

const modeLabels: Record<FinanceMode, string> = {
  merged: "All finances",
  online: "Online",
  offline: "Counter sales",
};

export function FinancialAccounting({
  financials,
  loading,
  loaded,
  error,
  onRefresh,
}: {
  financials: FinancialSummary;
  loading: boolean;
  loaded: boolean;
  error: string;
  onRefresh: () => Promise<void>;
}) {
  const [mode, setMode] = useState<FinanceMode>("merged");
  const allTime = financials.allTime ?? {
    received: 0,
    pending: 0,
    packed: 0,
    outForDelivery: 0,
    delivered: 0,
    failed: 0,
  };
  const today = financials.today ?? {
    received: 0,
    pending: 0,
    packed: 0,
    outForDelivery: 0,
    delivered: 0,
    failed: 0,
  };

  const metrics = useMemo<Metric[]>(() => {
    if (mode === "online") {
      return [
        { label: "Online revenue", value: financials.onlineRevenue, detail: "Paid Pharma2U orders", icon: CreditCard, tone: "bg-emerald-50 text-emerald-700" },
        { label: "Available balance", value: financials.availableBalance, detail: "Available for payout", icon: WalletCards, tone: "bg-teal-50 text-teal-700" },
        { label: "Held balance", value: financials.heldBalance, detail: "Orders still in fulfilment", icon: ShieldCheck, tone: "bg-amber-50 text-amber-700" },
        { label: "Pending payment", value: financials.receivable, detail: "Awaiting payment confirmation", icon: Clock3, tone: "bg-blue-50 text-blue-700" },
      ];
    }
    if (mode === "offline") {
      return [
        { label: "Counter sales", value: financials.offlineRevenue, detail: "All completed counter bills", icon: ReceiptText, tone: "bg-emerald-50 text-emerald-700" },
        { label: "Cash and COD", value: financials.cashRevenue, detail: "Recorded cash collections", icon: Banknote, tone: "bg-teal-50 text-teal-700" },
        { label: "Discounts", value: financials.pharmacyDiscounts, detail: "Discounts applied at the counter", icon: CircleDollarSign, tone: "bg-violet-50 text-violet-700" },
        { label: "Inventory purchase value", value: financials.inventoryPurchaseValue, detail: "Current stock at recorded purchase prices", icon: PackageCheck, tone: "bg-blue-50 text-blue-700" },
      ];
    }
    return [
      { label: "Total revenue", value: financials.totalRevenue, detail: "Online, COD and counter sales", icon: CircleDollarSign, tone: "bg-emerald-50 text-emerald-700" },
      { label: "Online revenue", value: financials.onlineRevenue, detail: "Paid Pharma2U orders", icon: CreditCard, tone: "bg-teal-50 text-teal-700" },
      { label: "Counter sales", value: financials.offlineRevenue, detail: "Completed counter bills", icon: ReceiptText, tone: "bg-blue-50 text-blue-700" },
      { label: "Available balance", value: financials.availableBalance, detail: "Available for payout", icon: WalletCards, tone: "bg-violet-50 text-violet-700" },
    ];
  }, [financials, mode]);

  const deliveredRate = allTime.received > 0
    ? Math.round((allTime.delivered / allTime.received) * 100)
    : 0;
  const onlineShare = financials.totalRevenue > 0
    ? Math.round((financials.onlineRevenue / financials.totalRevenue) * 100)
    : 0;
  const counterShare = financials.totalRevenue > 0
    ? Math.round((financials.offlineRevenue / financials.totalRevenue) * 100)
    : 0;

  function exportSummary() {
    const rows = [
      ["Metric", "Amount"],
      ["Total revenue", financials.totalRevenue],
      ["Online revenue", financials.onlineRevenue],
      ["Counter sales", financials.offlineRevenue],
      ["Cash and COD", financials.cashRevenue],
      ["Available balance", financials.availableBalance],
      ["Held balance", financials.heldBalance],
      ["Pending payment", financials.receivable],
      ["Upcoming payout", financials.upcomingPayout],
      ["Pharmacy discounts", financials.pharmacyDiscounts],
    ];
    const csv = rows.map((row) => row.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "pharma2u-financial-summary.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  if (loading && !loaded) {
    return (
      <section className="space-y-5" aria-busy="true">
        <div className="h-20 animate-pulse rounded-2xl bg-slate-200/70" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((item) => <div key={item} className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white" />)}</div>
        <div className="grid gap-4 xl:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white" />)}</div>
      </section>
    );
  }

  if (error && !loaded) {
    return (
      <section className="rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-bold text-red-700">Financial data could not be loaded</p>
        <p className="mt-1 text-xs text-slate-500">{error}</p>
        <button type="button" onClick={() => void onRefresh()} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-bold text-white"><RefreshCw size={15} /> Try again</button>
      </section>
    );
  }
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-teal-700">Finance</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-[-.035em] text-slate-950">Financial accounting</h1>
          <p className="mt-1.5 text-sm text-slate-500">Revenue, balances and order performance from your recorded pharmacy activity.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => void onRefresh()} disabled={loading} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm disabled:opacity-50" aria-label="Refresh financial data"><RefreshCw size={16} className={loading ? "animate-spin" : ""} /></button>
          <button type="button" onClick={exportSummary} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"><ArrowDownToLine size={16} /> Export summary</button>
        </div>
      </div>

      <div className="flex w-full gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 sm:w-fit">
        {(["merged", "online", "offline"] as FinanceMode[]).map((item) => (
          <button key={item} type="button" onClick={() => setMode(item)} className={`whitespace-nowrap rounded-lg px-4 py-2 text-xs font-bold transition ${mode === item ? "bg-teal-700 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}>
            {modeLabels[item]}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, detail, icon: Icon, tone }) => (
          <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,38,50,.035)]">
            <div className="flex items-center gap-3"><span className={`grid h-9 w-9 place-items-center rounded-xl ${tone}`}><Icon size={17} /></span><p className="text-xs font-bold text-slate-600">{label}</p></div>
            <strong className="mt-5 block text-[clamp(1.55rem,2.5vw,2rem)] font-extrabold tracking-[-.04em] text-slate-950">{rupees.format(value)}</strong>
            <p className="mt-2 text-[11px] text-slate-500">{detail}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-emerald-700">Online settlement</p><h2 className="mt-2 text-lg font-bold text-slate-950">Pharma2U earnings</h2></div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">{onlineShare}% of revenue</span></div>
          <p className="mt-5 text-2xl font-extrabold text-slate-950">{rupees.format(financials.platformEarnings)}</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${Math.min(100, onlineShare)}%` }} /></div>
          <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-xs"><div><span className="text-slate-500">Available</span><b className="mt-1 block text-slate-950">{rupees.format(financials.availableBalance)}</b></div><div><span className="text-slate-500">Held</span><b className="mt-1 block text-slate-950">{rupees.format(financials.heldBalance)}</b></div><div><span className="text-slate-500">Pending payment</span><b className="mt-1 block text-slate-950">{rupees.format(financials.receivable)}</b></div><div><span className="text-slate-500">Payout requested</span><b className="mt-1 block text-slate-950">{rupees.format(financials.upcomingPayout)}</b></div></div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-blue-700">Counter billing</p><h2 className="mt-2 text-lg font-bold text-slate-950">Store sales</h2></div><span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">{counterShare}% of revenue</span></div>
          <p className="mt-5 text-2xl font-extrabold text-slate-950">{rupees.format(financials.offlineRevenue)}</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.min(100, counterShare)}%` }} /></div>
          <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-xs"><div><span className="text-slate-500">Cash and COD</span><b className="mt-1 block text-slate-950">{rupees.format(financials.cashRevenue)}</b></div><div><span className="text-slate-500">Discounts given</span><b className="mt-1 block text-slate-950">{rupees.format(financials.pharmacyDiscounts)}</b></div><div><span className="text-slate-500">Inventory purchase value</span><b className="mt-1 block text-slate-950">{rupees.format(financials.inventoryPurchaseValue)}</b></div><div><span className="text-slate-500">Today’s orders</span><b className="mt-1 block text-slate-950">{today.received}</b></div></div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-violet-700">Order performance</p><h2 className="mt-2 text-lg font-bold text-slate-950">Fulfilment overview</h2></div><span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-700">{deliveredRate}% delivered</span></div>
          <p className="mt-5 text-2xl font-extrabold text-slate-950">{allTime.received} <span className="text-sm font-medium text-slate-400">total orders</span></p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-600" style={{ width: `${Math.min(100, deliveredRate)}%` }} /></div>
          <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-xs"><div><span className="flex items-center gap-1 text-slate-500"><Clock3 size={12} /> Pending</span><b className="mt-1 block text-slate-950">{allTime.pending}</b></div><div><span className="flex items-center gap-1 text-slate-500"><PackageCheck size={12} /> Packed</span><b className="mt-1 block text-slate-950">{allTime.packed}</b></div><div><span className="flex items-center gap-1 text-slate-500"><Truck size={12} /> In delivery</span><b className="mt-1 block text-slate-950">{allTime.outForDelivery}</b></div><div><span className="flex items-center gap-1 text-slate-500"><CheckCircle2 size={12} /> Delivered</span><b className="mt-1 block text-slate-950">{allTime.delivered}</b></div></div>
        </article>
      </div>

      {error && loaded && <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"><span>Showing the last successfully loaded data. Refresh failed: {error}</span><button type="button" onClick={() => void onRefresh()} className="shrink-0 font-bold underline">Retry</button></div>}
      <div className="flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50 p-3 text-[11px] leading-relaxed text-blue-900">
        <ShieldCheck size={16} className="mt-0.5 shrink-0" />
        <p>All figures on this page come from recorded Pharma2U orders, counter bills and payout requests. Values update when the vendor data refreshes.</p>
      </div>
    </section>
  );
}