import { LocateFixed, Radio } from "lucide-react";

export function AvailabilityPanel({
  isOnline,
  message,
  onToggle,
}: {
  isOnline: boolean;
  message: string;
  onToggle: () => void;
}) {
  return (
    <section className={`flex flex-col gap-4 rounded-2xl border p-4 shadow-[0_6px_22px_rgba(15,23,42,.025)] sm:flex-row sm:items-center sm:justify-between sm:p-5 ${isOnline ? "border-emerald-200 bg-emerald-50/70" : "border-slate-200 bg-white"}`}>
      <div className="flex items-start gap-3">
        <span className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-xl ${isOnline ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"}`}>
          {isOnline ? <Radio size={20} /> : <LocateFixed size={20} />}
          {isOnline && <i className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-emerald-400 ring-2 ring-white" />}
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-bold text-slate-900">{isOnline ? "Online and discoverable" : "Currently offline"}</h2>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide ${isOnline ? "bg-emerald-200 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>{isOnline ? "LIVE" : "OFFLINE"}</span>
          </div>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">{message}</p>
        </div>
      </div>
      <button type="button" onClick={onToggle} className={`min-h-10 shrink-0 rounded-xl px-4 text-sm font-bold transition ${isOnline ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}>
        {isOnline ? "Go offline" : "Start duty"}
      </button>
    </section>
  );
}
