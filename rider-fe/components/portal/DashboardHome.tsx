"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Banknote,
  CheckCircle2,
  Gift,
  LoaderCircle,
  RefreshCw,
  Route,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { getRiderDashboard, type RiderDashboardData } from "@/lib/dashboardApi";
import { getRiderFinance, type RiderFinance } from "@/lib/api";
import { formatMoney } from "@/components/tasks/taskHelpers";
import { AvailabilityPanel } from "@/components/tasks/AvailabilityPanel";
import { TaskCard } from "@/components/tasks/TaskCard";
import type { RiderAvailability } from "@/components/tasks/useRiderAvailability";
import { useRiderTasks } from "@/components/tasks/useRiderTasks";
import { LiveLocationCard } from "./LiveLocationCard";

export function DashboardHome({
  token,
  availability,
  tasksOnly = false,
}: {
  token: string;
  availability: RiderAvailability;
  tasksOnly?: boolean;
}) {
  const tasks = useRiderTasks(token, availability.isOnline);
  const [dashboard, setDashboard] = useState<RiderDashboardData | null>(null);
  const [finance, setFinance] = useState<RiderFinance | null>(null);
  const [summaryError, setSummaryError] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(true);

  const loadSummary = useCallback(async () => {
    setSummaryError("");
    try {
      const [dashboardData, financeData] = await Promise.all([
        getRiderDashboard(token),
        getRiderFinance(token),
      ]);
      setDashboard(dashboardData);
      setFinance(financeData);
    } catch (error) {
      setSummaryError(
        error instanceof Error ? error.message : "Unable to load summary.",
      );
    } finally {
      setSummaryLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadSummary(), 0);
    return () => window.clearTimeout(initialLoad);
  }, [loadSummary]);

  const codTotal = useMemo(
    () =>
      tasks.activeTasks
        .filter((task) => task.paymentMethod === "cod")
        .reduce((total, task) => total + task.collectionAmount, 0),
    [tasks.activeTasks],
  );
  const location = dashboard?.availability.location ?? null;
  const today = dashboard?.today;

  return (
    <div className="space-y-5">
      <AvailabilityPanel
        isOnline={availability.isOnline}
        isStarting={availability.isStarting}
        message={availability.message}
        onToggle={availability.toggleAvailability}
      />

      {!tasksOnly && (
        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <Metric
            icon={WalletCards}
            label="Today's earnings"
            value={summaryLoading ? "..." : formatMoney(today?.earnings ?? 0)}
            tone="emerald"
          />
          <Metric
            icon={Route}
            label="Today's trips"
            value={summaryLoading ? "..." : String(today?.trips ?? 0)}
            tone="amber"
          />
          <Metric
            icon={TrendingUp}
            label="Acceptance rate"
            value="—"
            tone="blue"
          />
          <Metric
            icon={CheckCircle2}
            label="Completion rate"
            value={
              summaryLoading
                ? "..."
                : today?.completionRate == null
                  ? "—"
                  : `${today.completionRate}%`
            }
            tone="orange"
          />
        </section>
      )}

      {(tasks.error || summaryError) && (
        <div
          role="alert"
          className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
        >
          {tasks.error || summaryError}
        </div>
      )}

      <div className={tasksOnly ? "" : "grid gap-5 xl:grid-cols-[minmax(0,1fr)_350px]"}>
        <div className="min-w-0 space-y-5">
          <section className="rounded-[1.35rem] border border-slate-200 bg-white p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-slate-950">
                  Current delivery
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Follow the highlighted steps to complete each delivery.
                </p>
              </div>
              <div className="flex gap-2">
                <span className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-700">
                  <Route className="mr-1.5 inline" size={14} />
                  {tasks.activeTasks.length} active
                </span>
                {codTotal > 0 && (
                  <span className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-800">
                    <Banknote className="mr-1.5 inline" size={14} />
                    {formatMoney(codTotal)} COD
                  </span>
                )}
              </div>
            </div>

            {tasks.activeTasks.length ? (
              <div className="grid gap-4 2xl:grid-cols-2">
                {tasks.activeTasks.map((task) => (
                  <TaskCard
                    key={`${task.id}-${task.leg}`}
                    task={task}
                    isActive
                    isBusy={tasks.busyTaskId === task.id}
                    onAccept={tasks.acceptTask}
                    onAdvance={tasks.advanceTask}
                  />
                ))}
              </div>
            ) : (
              <EmptyTasks
                loading={tasks.isLoading}
                online={availability.isOnline}
              />
            )}
          </section>

          <section className="rounded-[1.35rem] border border-slate-200 bg-white p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-950">
                  Jobs nearby
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Customer details unlock only after you accept.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void tasks.refreshTasks()}
                disabled={tasks.isLoading}
                aria-label="Refresh jobs"
                className="rounded-xl border border-slate-200 p-2.5 text-slate-500 disabled:opacity-50"
              >
                <RefreshCw
                  className={tasks.isLoading ? "animate-spin" : ""}
                  size={16}
                />
              </button>
            </div>
            {tasks.availableTasks.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {tasks.availableTasks.map((task) => (
                  <TaskCard
                    key={`${task.id}-${task.leg ?? "primary"}`}
                    task={task}
                    isBusy={tasks.busyTaskId === task.id}
                    onAccept={tasks.acceptTask}
                    onAdvance={tasks.advanceTask}
                  />
                ))}
              </div>
            ) : (
              <p className="rounded-2xl bg-slate-50 px-4 py-7 text-center text-xs text-slate-500">
                {availability.isOnline
                  ? "No additional deliveries are available right now."
                  : "Go online to discover nearby deliveries."}
              </p>
            )}
          </section>
        </div>

        {!tasksOnly && (
          <aside className="space-y-5">
            <LiveLocationCard
              isOnline={availability.isOnline}
              fallback={
                availability.location ??
                (location ? { lat: location.lat, lng: location.lng } : null)
              }
            />
            <section className="rounded-[1.35rem] border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-slate-950">
                  {"Today's earnings"}
                </h2>
                <WalletCards className="text-emerald-600" size={19} />
              </div>
              <strong className="mt-4 block text-2xl text-slate-950">
                {formatMoney(today?.earnings ?? 0)}
              </strong>
              <p className="text-[11px] text-slate-400">Total delivery earnings</p>
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-xs">
                <div>
                  <span className="text-slate-400">Wallet balance</span>
                  <strong className="mt-1 block text-slate-800">
                    {formatMoney(finance?.summary.balance ?? 0)}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400">COD responsibility</span>
                  <strong className="mt-1 block text-slate-800">
                    {formatMoney(codTotal)}
                  </strong>
                </div>
              </div>
            </section>
            <section className="rounded-[1.35rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-cyan-50 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm font-extrabold text-emerald-800">
                    Incentives for you
                  </h2>
                  <p className="mt-3 text-xs leading-5 text-slate-600">
                    Complete more deliveries to unlock upcoming rider rewards.
                  </p>
                </div>
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-amber-500 shadow-sm">
                  <Gift size={22} />
                </span>
              </div>
            </section>
          </aside>
        )}
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof WalletCards;
  label: string;
  value: string;
  tone: "emerald" | "amber" | "blue" | "orange";
}) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
    orange: "bg-orange-50 text-orange-600",
  };
  return (
    <article className="rounded-[1.2rem] border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium text-slate-500">{label}</p>
          <strong className="mt-2 block text-xl text-slate-950">{value}</strong>
        </div>
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${tones[tone]}`}>
          <Icon size={17} />
        </span>
      </div>
    </article>
  );
}

function EmptyTasks({
  loading,
  online,
}: {
  loading: boolean;
  online: boolean;
}) {
  return (
    <div className="grid min-h-44 place-items-center rounded-2xl bg-slate-50 px-5 text-center">
      <div>
        {loading ? (
          <LoaderCircle
            className="mx-auto animate-spin text-emerald-600"
            size={24}
          />
        ) : (
          <CheckCircle2 className="mx-auto text-slate-300" size={28} />
        )}
        <strong className="mt-3 block text-sm text-slate-700">
          {loading
            ? "Loading deliveries..."
            : online
              ? "No active delivery"
              : "Your shift has not started"}
        </strong>
        <p className="mt-1 text-xs text-slate-400">
          {online
            ? "New jobs will appear automatically."
            : "Go online when you are ready to deliver."}
        </p>
      </div>
    </div>
  );
}
