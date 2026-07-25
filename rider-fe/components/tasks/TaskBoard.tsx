"use client";

import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  LoaderCircle,
  RefreshCw,
  Route,
} from "lucide-react";
import { AvailabilityPanel } from "./AvailabilityPanel";
import { TaskCard } from "./TaskCard";
import { formatMoney } from "./taskHelpers";
import { useRiderAvailability } from "./useRiderAvailability";
import { useRiderTasks } from "./useRiderTasks";

export function TaskBoard({ token }: { token: string }) {
  const availability = useRiderAvailability(token);
  const tasks = useRiderTasks(token, availability.isOnline);
  const codTotal = tasks.activeTasks
    .filter((task) => task.paymentMethod === "cod")
    .reduce((total, task) => total + task.collectionAmount, 0);

  return (
    <div className="space-y-6">
      <AvailabilityPanel
        isOnline={availability.isOnline}
        isStarting={availability.isStarting}
        message={availability.message}
        onToggle={availability.toggleAvailability}
      />

      {tasks.error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 shrink-0" size={18} />
          <div>
            <strong className="block">Delivery update failed</strong>
            <p className="mt-0.5 text-xs leading-5">{tasks.error}</p>
          </div>
        </div>
      )}

      {tasks.activeTasks.length > 0 && (
        <section>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-emerald-700">
                Do this next
              </p>
              <h2 className="mt-1 text-xl font-extrabold tracking-tight text-slate-950">
                Current delivery
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Follow the highlighted step to complete the job.
              </p>
            </div>
            <div className="flex gap-2">
              <span className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600">
                <Route className="mr-1.5 inline text-emerald-600" size={15} />
                {tasks.activeTasks.length} active
              </span>
              {codTotal > 0 && (
                <span className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
                  <Banknote className="mr-1.5 inline" size={15} />
                  {formatMoney(codTotal)} COD
                </span>
              )}
            </div>
          </div>
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
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-slate-950">
                {tasks.activeTasks.length
                  ? "More jobs nearby"
                  : "Available deliveries"}
              </h2>
              {tasks.availableTasks.length > 0 && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                  {tasks.availableTasks.length}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {availability.isOnline
                ? "Packed orders near your current location"
                : "Go online to see nearby jobs"}
            </p>
          </div>
          <button
            type="button"
            disabled={tasks.isLoading}
            onClick={() => void tasks.refreshTasks()}
            aria-label="Refresh available deliveries"
            className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 disabled:opacity-50"
          >
            <RefreshCw
              className={tasks.isLoading ? "animate-spin" : ""}
              size={17}
            />
          </button>
        </div>
        {tasks.availableTasks.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
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
          <div className="grid min-h-48 place-items-center rounded-[1.5rem] border border-dashed border-slate-300 bg-white px-5 text-center">
            <div>
              {tasks.isLoading ? (
                <LoaderCircle
                  className="mx-auto animate-spin text-emerald-600"
                  size={24}
                />
              ) : (
                <CheckCircle2 className="mx-auto text-slate-300" size={30} />
              )}
              <strong className="mt-3 block text-sm text-slate-700">
                {tasks.isLoading
                  ? "Checking nearby pharmacies..."
                  : availability.isOnline
                    ? "You are all caught up"
                    : "Your shift has not started"}
              </strong>
              <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-400">
                {tasks.isLoading
                  ? "This should only take a moment."
                  : availability.isOnline
                    ? "New packed orders will appear here automatically."
                    : "Turn on location and go online when you are ready to deliver."}
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
