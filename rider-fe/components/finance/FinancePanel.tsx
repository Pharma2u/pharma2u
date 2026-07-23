"use client";
import { useEffect, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CircleDollarSign,
  Clock3,
  LoaderCircle,
  RefreshCw,
  WalletCards,
} from "lucide-react";
import { getRiderFinance, type RiderFinance } from "@/lib/api";
import { formatMoney } from "@/components/tasks/taskHelpers";

export function FinancePanel({
  token,
  historyOnly = false,
}: {
  token: string;
  historyOnly?: boolean;
}) {
  const [data, setData] = useState<RiderFinance | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  async function load() {
    setLoading(true);
    setError("");
    try {
      setData(await getRiderFinance(token));
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to load accounting.",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    const initialLoad = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(initialLoad);
    // `load` intentionally uses the current token for this mounted panel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);
  if (loading && !data)
    return (
      <div className="grid min-h-64 place-items-center">
        <LoaderCircle className="animate-spin text-emerald-600" />
      </div>
    );
  if (error && !data)
    return (
      <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p>
    );
  if (!data) return null;
  if (historyOnly) return <DeliveryHistory items={data.deliveries} />;
  const { summary } = data;
  const directionCopy =
    summary.settlementDirection === "platform_owes_rider"
      ? "Pharma2U owes you"
      : summary.settlementDirection === "rider_owes_platform"
        ? "Cash to remit"
        : "Fully settled";
  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-bold tracking-[0.14em] text-emerald-600">
            RIDER ACCOUNTING
          </p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">
            Earnings & settlement
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Medicine prices are excluded. Only delivery and collection
            accounting is shown.
          </p>
        </div>
        <button
          onClick={() => void load()}
          className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500"
          aria-label="Refresh accounting"
        >
          <RefreshCw size={18} />
        </button>
      </div>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [
            CircleDollarSign,
            "Total delivery earnings",
            summary.totalEarnings,
            "text-emerald-700 bg-emerald-50",
          ],
          [
            Banknote,
            "COD cash collected",
            summary.codCollected,
            "text-amber-700 bg-amber-50",
          ],
          [
            WalletCards,
            "Online earnings held",
            summary.onlineEarnings,
            "text-blue-700 bg-blue-50",
          ],
          [
            summary.balance >= 0 ? ArrowDownLeft : ArrowUpRight,
            directionCopy,
            summary.settlementAmount,
            summary.balance >= 0
              ? "text-violet-700 bg-violet-50"
              : "text-red-700 bg-red-50",
          ],
        ].map(([Icon, label, amount, tone]) => {
          const C = Icon as typeof CircleDollarSign;
          return (
            <article
              key={String(label)}
              className="rounded-2xl border border-slate-200 bg-white p-4"
            >
              <span className={`inline-flex rounded-xl p-2 ${String(tone)}`}>
                <C size={19} />
              </span>
              <p className="mt-3 text-xs font-medium text-slate-500">
                {String(label)}
              </p>
              <strong className="mt-1 block text-xl text-slate-950">
                {formatMoney(Number(amount))}
              </strong>
            </article>
          );
        })}
      </section>
      <section
        className={`rounded-2xl border p-5 ${summary.balance < 0 ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"}`}
      >
        <div className="flex gap-3">
          <WalletCards
            className={
              summary.balance < 0 ? "text-red-700" : "text-emerald-700"
            }
          />
          <div>
            <strong className="text-sm text-slate-900">
              {directionCopy}: {formatMoney(summary.settlementAmount)}
            </strong>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              Wallet balance = delivery earnings + credits − COD cash held −
              completed payouts. Negative balances must be remitted through the
              operations settlement process.
            </p>
          </div>
        </div>
      </section>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <header className="border-b border-slate-100 p-4">
          <h3 className="font-bold text-slate-900">Operational ledger</h3>
          <p className="mt-1 text-xs text-slate-500">
            Every earning and cash movement, newest first
          </p>
        </header>
        <div className="divide-y divide-slate-100">
          {data.entries.length ? (
            data.entries.map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 p-4">
                <span
                  className={`rounded-xl p-2 ${entry.amount >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                >
                  {entry.amount >= 0 ? (
                    <ArrowDownLeft size={18} />
                  ) : (
                    <ArrowUpRight size={18} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <strong className="block truncate text-sm text-slate-800">
                    {entry.description}
                  </strong>
                  <small className="text-xs text-slate-400">
                    {new Date(entry.createdAt).toLocaleString("en-IN")} ·{" "}
                    {entry.paymentMethod?.toUpperCase() ?? "ADJUSTMENT"}
                  </small>
                </div>
                <strong
                  className={`text-sm ${entry.amount >= 0 ? "text-emerald-700" : "text-amber-700"}`}
                >
                  {entry.amount >= 0 ? "+" : "−"}
                  {formatMoney(Math.abs(entry.amount))}
                </strong>
              </div>
            ))
          ) : (
            <p className="p-10 text-center text-sm text-slate-400">
              No ledger activity yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function DeliveryHistory({ items }: { items: RiderFinance["deliveries"] }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <header className="border-b border-slate-100 p-5">
        <h2 className="text-xl font-bold text-slate-950">Delivery history</h2>
        <p className="mt-1 text-sm text-slate-500">
          Completed jobs and the delivery revenue earned
        </p>
      </header>
      <div className="divide-y divide-slate-100">
        {items.length ? (
          items.map((item) => (
            <article
              key={item.id}
              className="flex items-center gap-3 p-4 sm:p-5"
            >
              <span className="rounded-xl bg-slate-100 p-2.5 text-slate-600">
                <Clock3 size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <strong className="block text-sm text-slate-900">
                  {item.orderCode}
                </strong>
                <p className="truncate text-xs text-slate-500">
                  {item.pharmacyName} · {item.paymentMethod.toUpperCase()}
                </p>
                <small className="text-[11px] text-slate-400">
                  {item.deliveredAt
                    ? new Date(item.deliveredAt).toLocaleString("en-IN")
                    : "Completed"}
                </small>
              </div>
              <div className="text-right">
                <strong className="text-emerald-700">
                  +{formatMoney(item.earning)}
                </strong>
                <small className="block text-[10px] text-slate-400">
                  DELIVERY EARNING
                </small>
              </div>
            </article>
          ))
        ) : (
          <p className="p-12 text-center text-sm text-slate-400">
            Your completed deliveries will appear here.
          </p>
        )}
      </div>
    </section>
  );
}
