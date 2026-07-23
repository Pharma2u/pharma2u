import { Banknote, PackageCheck, Radio, Route } from "lucide-react";
import { formatMoney } from "./taskHelpers";

export function DashboardSummary({
  activeCount,
  availableCount,
  codTotal,
}: {
  activeCount: number;
  availableCount: number;
  codTotal: number;
}) {
  const items = [
    [Route, "Active deliveries", String(activeCount), "In progress", "bg-emerald-50 text-emerald-700"],
    [PackageCheck, "Available jobs", String(availableCount), "Ready nearby", "bg-blue-50 text-blue-700"],
    [Banknote, "COD to collect", formatMoney(codTotal), "Active orders", "bg-amber-50 text-amber-700"],
  ] as const;
  const headline = activeCount
    ? `${activeCount} delivery${activeCount === 1 ? " is" : "ies are"} in motion`
    : availableCount
      ? `${availableCount} delivery${availableCount === 1 ? " is" : "ies are"} ready nearby`
      : "You are ready for your next delivery";

  return (
    <section aria-label="Delivery summary">
      <div className="relative overflow-hidden rounded-2xl bg-slate-950 px-5 py-6 text-white shadow-[0_12px_30px_rgba(15,23,42,.13)] sm:px-6">
        <div className="absolute -right-10 -top-16 h-44 w-44 rounded-full bg-emerald-400/15 blur-2xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold text-emerald-200">
              <Radio size={13} /> LIVE RIDER WORKSPACE
            </span>
            <h2 className="mt-4 text-xl font-extrabold tracking-tight sm:text-2xl">{headline}</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">Keep your location on while on duty to receive nearby pharmacy jobs and stay visible to dispatch.</p>
          </div>
          <div className="border-t border-white/10 pt-4 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
            <p className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-400">Cash responsibility</p>
            <p className="mt-1 text-xl font-extrabold">{formatMoney(codTotal)}</p>
            <p className="mt-1 text-xs text-slate-400">from active COD orders</p>
          </div>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {items.map(([Icon, label, value, detail, tone]) => (
          <article key={label} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_6px_22px_rgba(15,23,42,.035)]">
            <div className="flex items-start justify-between gap-3">
              <span className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}><Icon size={20} /></span>
              <span className="text-[10px] font-semibold text-slate-400">{detail}</span>
            </div>
            <strong className="mt-4 block text-2xl font-extrabold tracking-tight text-slate-950">{value}</strong>
            <span className="mt-1 block text-xs font-medium text-slate-500">{label}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
