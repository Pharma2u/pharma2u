"use client";

import { useEffect, useState } from "react";
import {
  acceptRiderTask,
  completeRelayHandoff,
  listMyRiderTasks,
  listRiderTasks,
  updateDeliveryStatus,
  updateMyLocation,
  type RiderTask,
} from "@/lib/api";

type TaskLeg = "primary" | "relay";

function taskItems(task: RiderTask) {
  return task.items.map((item) => `${item.name} x ${item.qty}`).join(", ");
}

export function TaskBoard({ token }: { token: string }) {
  const [availableTasks, setAvailableTasks] = useState<RiderTask[]>([]);
  const [activeTasks, setActiveTasks] = useState<RiderTask[]>([]);
  const [error, setError] = useState("");
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);

  async function loadTasks() {
    setError("");
    try {
      const [available, active] = await Promise.all([
        listRiderTasks(token),
        listMyRiderTasks(token),
      ]);
      setAvailableTasks(available.items);
      setActiveTasks(active.items);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load delivery tasks.",
      );
    }
  }

  useEffect(() => {
    void loadTasks();
  }, [token]);

  useEffect(() => {
    if (!activeTasks.length || !navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        void updateMyLocation(token, position.coords.latitude, position.coords.longitude);
      },
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 15_000, timeout: 20_000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [activeTasks.length, token]);
  async function runTaskAction(taskId: string, action: () => Promise<unknown>) {
    setBusyTaskId(taskId);
    setError("");
    try {
      await action();
      await loadTasks();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to update task.",
      );
    } finally {
      setBusyTaskId(null);
    }
  }

  function nextPrimaryAction(task: RiderTask) {
    if (task.status === "rider_assigned")
      return { label: "Confirm pickup", status: "picked_up" as const };
    if (task.status === "picked_up" || task.status === "relay_pending")
      return { label: "Start delivery", status: "on_the_way" as const };
    if (task.status === "on_the_way")
      return { label: "Mark delivered", status: "delivered" as const };
    return null;
  }

  return (
    <section className="card">
      <div className="task-board-header">
        <div>
          <p className="eyebrow">DELIVERY TASKS</p>
          <h2>Pickup and delivery board</h2>
        </div>
        <button
          type="button"
          className="secondary"
          onClick={() => void loadTasks()}
        >
          Refresh
        </button>
      </div>

      {error && <p className="alert error">{error}</p>}

      <TaskList
        title="Available tasks"
        emptyText="No delivery tasks are waiting right now."
      >
        {availableTasks.map((task) => (
          <TaskCard key={`${task.id}-${task.leg ?? "primary"}`} task={task}>
            <button
              type="button"
              className="primary"
              disabled={busyTaskId === task.id}
              onClick={() =>
                void runTaskAction(task.id, () =>
                  acceptRiderTask(
                    token,
                    task.id,
                    (task.leg ?? "primary") as TaskLeg,
                  ),
                )
              }
            >
              {busyTaskId === task.id ? "Accepting..." : "Accept task"}
            </button>
          </TaskCard>
        ))}
      </TaskList>

      <TaskList
        title="Your active tasks"
        emptyText="Accepted tasks will appear here."
      >
        {activeTasks.map((task) => {
          const isRelayLeg = task.leg === "relay";
          const action = isRelayLeg ? null : nextPrimaryAction(task);
          return (
            <TaskCard key={`${task.id}-${task.leg}`} task={task}>
              {isRelayLeg ? (
                <button
                  type="button"
                  className="primary"
                  disabled={busyTaskId === task.id}
                  onClick={() =>
                    void runTaskAction(task.id, () =>
                      completeRelayHandoff(token, task.id),
                    )
                  }
                >
                  {busyTaskId === task.id ? "Confirming..." : "Confirm handoff"}
                </button>
              ) : action ? (
                <button
                  type="button"
                  className="primary"
                  disabled={busyTaskId === task.id}
                  onClick={() =>
                    void runTaskAction(task.id, () =>
                      updateDeliveryStatus(token, task.id, action.status),
                    )
                  }
                >
                  {busyTaskId === task.id ? "Updating..." : action.label}
                </button>
              ) : null}
            </TaskCard>
          );
        })}
      </TaskList>
    </section>
  );
}

function TaskList({
  title,
  emptyText,
  children,
}: {
  title: string;
  emptyText: string;
  children: React.ReactNode;
}) {
  const tasks = Array.isArray(children) ? children : [];
  return (
    <div className="space-y">
      <h3>{title}</h3>
      {tasks.length === 0 ? <p className="muted">{emptyText}</p> : tasks}
    </div>
  );
}

function TaskCard({
  task,
  children,
}: {
  task: RiderTask;
  children: React.ReactNode;
}) {
  return (
    <article className="alert" style={{ border: "1px solid var(--line)" }}>
      <strong>{task.orderCode}</strong>
      <p className="muted">
        Pick up:{" "}
        {task.leg === "relay" ? task.relayPharmacy?.name : task.pharmacy.name} -
        Deliver to: {task.dropAddress ?? "Available after you accept this task"}
      </p>
      <p>{taskItems(task)}</p>
      <small>
        {task.leg === "relay"
          ? "Relay handoff task"
          : task.status.replaceAll("_", " ")}
      </small>
      <br />
      {children}
    </article>
  );
}
