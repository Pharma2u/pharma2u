"use client";

import { AvailabilityPanel } from "./AvailabilityPanel";
import { DashboardSummary } from "./DashboardSummary";
import { TaskCard } from "./TaskCard";
import { TaskList } from "./TaskList";
import { formatMoney } from "./taskHelpers";
import { useRiderAvailability } from "./useRiderAvailability";
import { useRiderTasks } from "./useRiderTasks";

export function TaskBoard({ token }: { token: string }) {
  const availability = useRiderAvailability(token);
  const tasks = useRiderTasks(token);
  const codTotal = tasks.activeTasks
    .filter((task) => task.paymentMethod === "cod")
    .reduce((total, task) => total + task.total, 0);

  return (
    <div className="rider-dashboard">
      <DashboardSummary
        activeCount={tasks.activeTasks.length}
        availableCount={tasks.availableTasks.length}
        codTotal={codTotal}
      />

      <AvailabilityPanel
        isOnline={availability.isOnline}
        message={availability.message}
        onToggle={availability.toggleAvailability}
      />

      {tasks.error && (
        <p role="alert" className="dashboard-alert">
          {tasks.error}
        </p>
      )}

      <section className="delivery-columns">
        <TaskList
          title="Active deliveries"
          description={
            codTotal > 0
              ? `${formatMoney(codTotal)} cash currently due`
              : "Accepted jobs and delivery progress"
          }
          count={tasks.activeTasks.length}
          emptyIcon="check"
          emptyText={
            tasks.isLoading
              ? "Loading your accepted deliveries..."
              : "Accept an available job when you are ready to start."
          }
        >
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
        </TaskList>

        <TaskList
          title="Available nearby"
          description="Packed orders waiting for a rider"
          count={tasks.availableTasks.length}
          emptyIcon="clock"
          emptyText={
            tasks.isLoading
              ? "Finding available delivery jobs..."
              : "New jobs will appear here automatically when pharmacies are ready."
          }
          onRefresh={() => void tasks.refreshTasks()}
        >
          {tasks.availableTasks.map((task) => (
            <TaskCard
              key={`${task.id}-${task.leg ?? "primary"}`}
              task={task}
              isBusy={tasks.busyTaskId === task.id}
              onAccept={tasks.acceptTask}
              onAdvance={tasks.advanceTask}
            />
          ))}
        </TaskList>
      </section>
    </div>
  );
}
