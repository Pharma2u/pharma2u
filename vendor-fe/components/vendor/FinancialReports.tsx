"use client";

import { useState } from "react";
import {
  ArrowDownToLine,
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  FileBarChart,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  Truck,
  WalletCards,
} from "lucide-react";
import type { FinancialSummary } from "./types";
import { rupees } from "./vendorUtils";

type ReportView = "overview" | "revenue" | "settlements" | "orders";
type OrderPeriod = "today" | "allTime";

const views: { id: ReportView; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "revenue", label: "Revenue" },
  { id: "settlements", label: "Settlements" },
  { id: "orders", label: "Orders" },
];

export function FinancialReports({
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
  const [view, setView] = useState<ReportView>("overview");
  const [period, setPeriod] = useState<OrderPeriod>("allTime");
  const orders = financials[period] ?? {
    received: 0,
    pending: 0,
    packed: 0,
    outForDelivery: 0,
    delivered: 0,
    failed: 0,
  };
  const netRecordedPosition = Math.max(
    0,
    financials.totalRevenue - financials.pharmacyDiscounts,
  );
  const settlementTotal = financials.availableBalance + financials.heldBalance + financials.upcomingPayout;
  const completionRate = orders.received > 0
    ? Math.round((orders.delivered / orders.received) * 100)
    : 0;
  const onlineShare = financials.totalRevenue > 0
    ? Math.round((financials.onlineRevenue / financials.totalRevenue) * 100)
    : 0;
  const counterShare = financials.totalRevenue > 0
    ? Math.round((financials.offlineRevenue / financials.totalRevenue) * 100)
    : 0;

  function exportReport() {
    const rows = [
      ["Financial report", "Value"],
      ["Total recorded revenue", financials.totalRevenue],
      ["Online revenue", financials.onlineRevenue],
      ["Counter sales", financials.offlineRevenue],
      ["Cash and COD collections", financials.cashRevenue],
      ["Available settlement", financials.availableBalance],
      ["Held settlement", financials.heldBalance],
      ["Pending customer payment", financials.receivable],
      ["Payout requested", financials.upcomingPayout],
      ["Pharmacy discounts", financials.pharmacyDiscounts],
      ["Inventory purchase value", financials.inventoryPurchaseValue],
      [`${period === "today" ? "Today" : "All-time"} orders received`, orders.received],
      ["Orders delivered", orders.delivered],
    ];
    const csv = rows.map((row) => row.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `pharma2u-financial-report-${period}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (loading && !loaded) {
    return <section className="space-y-4" aria-busy="true"><div className="h-24 animate-pulse rounded-2xl bg-slate-200/70" /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((item) => <div key={item} className="h-40 animate-pulse rounded-2xl border bg-white" />)}</div><div className="grid gap-4 xl:grid-cols-2">{[0, 1].map((item) => <div key={item} className="h-80 animate-pulse rounded-2xl border bg-white" />)}</div></section>;
  }

  if (error && !loaded) {
    return <section className="rounded-2xl border border-red-200 bg-white p-7 text-center"><p className="text-sm font-bold text-red-700">Financial reports could not be loaded</p><p className="mt-1 text-xs text-slate-500">{error}</p><button type="button" onClick={() => void onRefresh()} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-bold text-white"><RefreshCw size={15} /> Try again</button></section>;
  }

  const showRevenue = view === "overview" || view === "revenue";
  const showSettlements = view === "overview" || view === "settlements";
  const showOrders = view === "overview" || view === "orders";

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-teal-700">Finance</p><h1 className="mt-1 text-3xl font-extrabold tracking-[-.035em] text-slate-950">Financial reports</h1><p className="mt-1.5 text-sm text-slate-500">Review recorded revenue, settlements and order performance.</p></div>
        <div className="flex gap-2"><button type="button" onClick={() => void onRefresh()} disabled={loading} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm disabled:opacity-50" aria-label="Refresh reports"><RefreshCw size={16} className={loading ? "animate-spin" : ""} /></button><button type="button" onClick={exportReport} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm"><ArrowDownToLine size={16} /> Export report</button></div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 overflow-x-auto">{views.map((item) => <button key={item.id} type="button" onClick={() => setView(item.id)} className={`whitespace-nowrap rounded-lg px-4 py-2 text-xs font-bold ${view === item.id ? "bg-teal-700 text-white" : "text-slate-500 hover:bg-slate-50"}`}>{item.label}</button>)}</div>
        <div className="flex rounded-lg bg-slate-100 p-1"><button type="button" onClick={() => setPeriod("today")} className={`rounded-md px-3 py-1.5 text-[11px] font-bold ${period === "today" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>Today</button><button type="button" onClick={() => setPeriod("allTime")} className={`rounded-md px-3 py-1.5 text-[11px] font-bold ${period === "allTime" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>All time</button></div>
      </div>

      {error && loaded && <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"><span>Showing the last successfully loaded report. Refresh failed: {error}</span><button type="button" onClick={() => void onRefresh()} className="font-bold underline">Retry</button></div>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total revenue", financials.totalRevenue, "Recorded across all sales", CircleDollarSign, "bg-emerald-50 text-emerald-700"],
          ["Online revenue", financials.onlineRevenue, "Paid Pharma2U orders", CreditCard, "bg-teal-50 text-teal-700"],
          ["Available settlement", financials.availableBalance, "Available for payout", WalletCards, "bg-blue-50 text-blue-700"],
          ["Orders received", orders.received, period === "today" ? "Received today" : "All recorded orders", FileBarChart, "bg-violet-50 text-violet-700"],
        ].map(([label, value, detail, Icon, tone]) => { const CardIcon = Icon as typeof CircleDollarSign; return <article key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><span className={`grid h-9 w-9 place-items-center rounded-xl ${tone}`}><CardIcon size={17} /></span><p className="text-xs font-bold text-slate-600">{String(label)}</p></div><strong className="mt-5 block text-2xl font-extrabold tracking-[-.04em] text-slate-950">{label === "Orders received" ? Number(value) : rupees.format(Number(value))}</strong><p className="mt-2 text-[11px] text-slate-500">{String(detail)}</p></article>; })}
      </div>

      {showRevenue && <div className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-emerald-700">Revenue report</p><h2 className="mt-1 text-lg font-bold">Revenue by source</h2></div><CircleDollarSign size={20} className="text-emerald-700" /></div><div className="mt-6 space-y-5">{[["Online orders", financials.onlineRevenue, onlineShare, "bg-emerald-600"], ["Counter sales", financials.offlineRevenue, counterShare, "bg-blue-600"]].map(([label, value, share, color]) => <div key={String(label)}><div className="flex justify-between gap-3 text-xs"><span className="font-semibold text-slate-600">{String(label)}</span><b>{rupees.format(Number(value))} <span className="font-medium text-slate-400">({Number(share)}%)</span></b></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, Number(share))}%` }} /></div></div>)}</div><div className="mt-6 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-xs"><div><span className="text-slate-500">Cash and COD collected</span><b className="mt-1 block">{rupees.format(financials.cashRevenue)}</b></div><div><span className="text-slate-500">Discounts applied</span><b className="mt-1 block">{rupees.format(financials.pharmacyDiscounts)}</b></div></div></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-blue-700">Recorded position</p><h2 className="mt-1 text-lg font-bold">Revenue less recorded deductions</h2></div><FileBarChart size={20} className="text-blue-700" /></div><div className="mt-6 space-y-4 text-sm"><div className="flex justify-between border-b border-slate-100 pb-3"><span className="text-slate-500">Gross recorded revenue</span><b>{rupees.format(financials.totalRevenue)}</b></div><div className="flex justify-between border-b border-slate-100 pb-3"><span className="text-slate-500">Pharmacy discounts</span><b className="text-rose-700">− {rupees.format(financials.pharmacyDiscounts)}</b></div><div className="flex justify-between border-b border-slate-100 pb-3"><span className="text-slate-500">Inventory purchase value</span><b className="text-slate-900">{rupees.format(financials.inventoryPurchaseValue)}</b></div><div className="flex justify-between rounded-xl bg-emerald-50 p-3 text-emerald-900"><span className="font-bold">Net recorded position</span><b>{rupees.format(netRecordedPosition)}</b></div></div><p className="mt-4 text-[10px] leading-relaxed text-slate-400">The net recorded position subtracts recorded pharmacy discounts only. Inventory purchase value is shown separately and is not treated as a supplier liability or an expense.</p></article>
      </div>}

      {showSettlements && <div className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-teal-700">Settlement report</p><h2 className="mt-1 text-lg font-bold">Pharma2U settlement position</h2></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{[["Available for payout", financials.availableBalance, WalletCards, "text-emerald-700 bg-emerald-50"], ["Held in fulfilment", financials.heldBalance, ShieldCheck, "text-amber-700 bg-amber-50"], ["Payout requested", financials.upcomingPayout, Banknote, "text-blue-700 bg-blue-50"], ["Pending customer payment", financials.receivable, Clock3, "text-violet-700 bg-violet-50"]].map(([label, value, Icon, tone]) => { const ItemIcon = Icon as typeof WalletCards; return <div key={String(label)} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"><span className={`grid h-9 w-9 place-items-center rounded-lg ${tone}`}><ItemIcon size={16} /></span><div><p className="text-[11px] text-slate-500">{String(label)}</p><b className="mt-1 block text-sm">{rupees.format(Number(value))}</b></div></div>; })}</div></article>
        <article className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 p-5 text-white shadow-lg"><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-teal-300">Settlement total</p><strong className="mt-4 block text-3xl font-extrabold">{rupees.format(settlementTotal)}</strong><p className="mt-2 text-xs text-slate-400">Available, held and requested settlement amounts</p><div className="mt-6 space-y-3 border-t border-white/10 pt-4 text-xs"><div className="flex justify-between text-slate-300"><span>Available</span><b className="text-white">{rupees.format(financials.availableBalance)}</b></div><div className="flex justify-between text-slate-300"><span>Held</span><b className="text-white">{rupees.format(financials.heldBalance)}</b></div><div className="flex justify-between text-slate-300"><span>Requested</span><b className="text-white">{rupees.format(financials.upcomingPayout)}</b></div></div></article>
      </div>}

      {showOrders && <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-violet-700">Order report</p><h2 className="mt-1 text-lg font-bold">{period === "today" ? "Today’s" : "All-time"} fulfilment performance</h2></div><span className="w-fit rounded-full bg-violet-50 px-3 py-1 text-[11px] font-bold text-violet-700">{completionRate}% delivered</span></div><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">{[["Received", orders.received, FileBarChart], ["Pending", orders.pending, Clock3], ["Packed", orders.packed, PackageCheck], ["In delivery", orders.outForDelivery, Truck], ["Delivered", orders.delivered, CheckCircle2], ["Failed", orders.failed, ShieldCheck]].map(([label, value, Icon]) => { const StatusIcon = Icon as typeof FileBarChart; return <div key={String(label)} className="rounded-xl bg-slate-50 p-3"><StatusIcon size={15} className="text-teal-700" /><b className="mt-3 block text-xl">{Number(value)}</b><span className="text-[10px] text-slate-500">{String(label)}</span></div>; })}</div></article>}

      <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 p-3 text-[11px] leading-relaxed text-blue-900"><ShieldCheck size={16} className="mt-0.5 shrink-0" /><p>Reports use live order, counter-billing and payout records. Revenue filters are not date-based because the current financial API provides cumulative monetary totals; the Today filter applies only to order performance.</p></div>
    </section>
  );
}