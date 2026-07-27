import { useState } from "react";

import {
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  IndianRupee,
  PackageCheck,
  Truck,
  Wallet,
  XCircle,
} from "lucide-react";
import type { VendorOrder } from "@/lib/authApi";
import type { FinancialSummary } from "./types";
import { protectedCustomerLabel, readableStatus, rupees } from "./vendorUtils";
import { FinanceRow, MetricCard } from "./Shared";
import { vendorStyles as styles } from "./vendorStyles";

const todayCards = [
  { key: "received", label: "Orders received", detail: "New orders today", icon: ClipboardList, tone: "text-teal-700 bg-teal-50" },
  { key: "pending", label: "Needs action", detail: "Verify or prepare", icon: Clock3, tone: "text-amber-700 bg-amber-50" },
  { key: "packed", label: "Packed", detail: "Waiting for rider", icon: PackageCheck, tone: "text-violet-700 bg-violet-50" },
  { key: "outForDelivery", label: "In delivery", detail: "With the rider", icon: Truck, tone: "text-blue-700 bg-blue-50" },
  { key: "delivered", label: "Delivered", detail: "Completed today", icon: CheckCircle2, tone: "text-emerald-700 bg-emerald-50" },
  { key: "failed", label: "Failed / cancelled", detail: "Needs review", icon: XCircle, tone: "text-rose-700 bg-rose-50" },
] as const;

export function VendorDashboard({
  orders,
  financials,
  loading,
  onViewOrders,
}: {
  orders: VendorOrder[];
  financials: FinancialSummary;
  loading: boolean;
  onViewOrders: () => void;
}) {
  const [period, setPeriod] = useState<"today" | "allTime">("allTime");
  const queueMetrics = {
    received: orders.length,
    pending: orders.filter((order) => ["pending_verification", "verified"].includes(order.status)).length,
    packed: orders.filter((order) => ["awaiting_rider", "rider_assigned"].includes(order.status)).length,
    outForDelivery: orders.filter((order) => ["picked_up", "relay_pending", "on_the_way"].includes(order.status)).length,
    delivered: orders.filter((order) => order.status === "delivered").length,
    failed: orders.filter((order) => ["rejected", "cancelled", "relay_failed", "disputed"].includes(order.status)).length,
  };
  const today = financials.today ?? {
    received: 0,
    pending: 0,
    packed: 0,
    outForDelivery: 0,
    delivered: 0,
    failed: 0,
  };
  const allTime = financials.allTime ?? queueMetrics;
  const metrics = period === "today" ? today : allTime;
  const periodLabel = period === "today" ? "Today" : "All orders";
  const fulfilled = metrics.delivered + metrics.outForDelivery;
  const completionRate = metrics.received
    ? Math.round((metrics.delivered / metrics.received) * 100)
    : 0;

  const highlights = [
    { label: "Online sales revenue", value: rupees.format(financials.onlineRevenue), detail: "Paid online orders", icon: IndianRupee },
    { label: "Orders received", value: String(metrics.received), detail: periodLabel, icon: ClipboardList },
    { label: "Orders delivered", value: String(metrics.delivered), detail: "Completed fulfilments", icon: CheckCircle2 },
    { label: "Available balance", value: rupees.format(financials.availableBalance), detail: "Ready for payout", icon: Wallet },
  ];

  return (
    <div className={styles.section}>
      <section className={`${styles.card} border-teal-100`}>
        <div className={styles.cardHeader}>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {highlights.map(({ label, value, detail, icon: Icon }) => (
          <article key={label} className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,38,50,.035)]">
            <div className="flex items-start justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Icon size={20} /></span>
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-600"><ArrowUpRight size={14} />Live</span>
            </div>
            <strong className="mt-5 block truncate text-2xl font-extrabold tracking-tight text-slate-950">{loading ? "-" : value}</strong>
            <p className="mt-1 text-xs font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-[11px] text-slate-400">{detail}</p>
          </article>
        ))}
      </div>

          <div>
            <p className={styles.eyebrow}>{periodLabel} operations</p>
            <h2 className={styles.cardTitle}>Your pharmacy at a glance</h2>
            <p className={styles.muted}>
              Track every order from receipt to completed delivery.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className={styles.segmented} aria-label="Order reporting period">
              {(["today", "allTime"] as const).map((value) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setPeriod(value)}
                  className={`${styles.segment} ${period === value ? styles.segmentActive : ""}`}
                >
                  {value === "today" ? "Today" : "All orders"}
                </button>
              ))}
            </div>
            <button type="button" className={styles.secondaryButton} onClick={onViewOrders}>
              Open order queue
            </button>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {todayCards.map(({ key, label, detail, icon: Icon, tone }) => (
            <div key={key} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone}`}><Icon size={19} /></span>
              <div className="min-w-0">
                <strong className="block text-2xl leading-none tracking-tight">
                  {loading ? "-" : metrics[key]}
                </strong>
                <span className="mt-1 block text-xs font-bold text-slate-700">{label}</span>
                <span className="block text-[11px] text-slate-500">{period === "today" ? detail : key === "received" ? "All recorded orders" : key === "delivered" ? "Completed deliveries" : detail}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.75fr)]">
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.eyebrow}>Fulfilment pipeline</p>
              <h2 className={styles.cardTitle}>{periodLabel} delivery progress</h2>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
              {completionRate}% delivered
            </span>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              ["Received", metrics.received, "bg-teal-600"],
              ["Prepared", metrics.packed, "bg-violet-600"],
              ["On the way", metrics.outForDelivery, "bg-blue-600"],
            ].map(([label, value, color]) => (
              <div key={String(label)} className="rounded-xl bg-slate-50 p-3.5">
                <span className={`mb-3 block h-1.5 rounded-full ${color}`} />
                <strong className="text-xl">{loading ? "-" : value}</strong>
                <span className="ml-2 text-xs text-slate-600">{label}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
            <strong className="text-slate-900">{loading ? "-" : fulfilled}</strong> orders are already in delivery or completed for this view.
            {metrics.pending > 0 && <span className="ml-1">{metrics.pending} still need pharmacy action.</span>}
          </div>
        </section>

        <aside className={styles.darkCard}>
          <p className={styles.eyebrow}>Settlement snapshot</p>
          <strong className={styles.darkValue}>{rupees.format(financials.onlineRevenue)}</strong>
          <p className={styles.darkMuted}>Online sales revenue</p>
          <div className={styles.rows}>
            <FinanceRow label="Cash collected" value={rupees.format(financials.cashRevenue)} dark />
            <FinanceRow label="Receivable from Pharma2U" value={rupees.format(financials.receivable)} dark />
            <FinanceRow label="Available balance" value={rupees.format(financials.availableBalance)} dark />
          </div>
        </aside>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.75fr)]">
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.eyebrow}>Recent activity</p>
              <h2 className={styles.cardTitle}>Latest Pharma2U orders</h2>
            </div>
            <button type="button" className={styles.secondaryButton} onClick={onViewOrders}>View all</button>
          </div>
          <div className={styles.orderList}>
            {orders.slice(0, 5).map((order) => (
              <div className={styles.orderRow} key={order.id}>
                <div className="min-w-0">
                  <p className={styles.orderCode}>{order.orderCode}</p>
              <p className={styles.orderMeta}>{protectedCustomerLabel()} · {order.items.length} item{order.items.length === 1 ? "" : "s"}</p>
                </div>
                <div className={styles.orderAmount}>{rupees.format(order.total)}<span className={styles.status}>{readableStatus(order.status)}</span></div>
              </div>
            ))}
            {!loading && orders.length === 0 && <p className={styles.empty}>No orders have been received yet.</p>}
          </div>
        </section>
        <section className={styles.card}>
          <p className={styles.eyebrow}>Finance overview</p>
          <h2 className={styles.cardTitle}>Current balances</h2>
          <div className={`${styles.metrics} mt-5 !grid-cols-1`}>
            <MetricCard label="Platform earnings" value={rupees.format(financials.platformEarnings)} detail="After pharmacy-funded discounts" />
            <MetricCard label="Held balance" value={rupees.format(financials.heldBalance)} detail="Orders still in fulfilment" />
          </div>
        </section>
      </div>
    </div>
  );
}
