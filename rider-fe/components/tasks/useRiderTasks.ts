"use client";

import { useCallback, useEffect, useState } from "react";
import {
  acceptRiderTask,
  completeRelayHandoff,
  listMyRiderTasks,
  listRiderTasks,
  updateDeliveryStatus,
  type RiderTask,
} from "@/lib/api";

type TaskOperation = () => Promise<unknown>;

export function useRiderTasks(token: string) {
  const [availableTasks, setAvailableTasks] = useState<RiderTask[]>([]);
  const [activeTasks, setActiveTasks] = useState<RiderTask[]>([]);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshTasks = useCallback(async () => {
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
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void Promise.resolve().then(refreshTasks);
  }, [refreshTasks]);

  async function runTaskOperation(taskId: string, operation: TaskOperation) {
    setBusyTaskId(taskId);
    setError("");
    try {
      await operation();
      await refreshTasks();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to update task.",
      );
    } finally {
      setBusyTaskId(null);
    }
  }

  function acceptTask(task: RiderTask) {
    return runTaskOperation(task.id, () =>
      acceptRiderTask(token, task.id, task.leg ?? "primary"),
    );
  }

  function advanceTask(task: RiderTask) {
    let operation: TaskOperation | null = null;

    if (task.leg === "relay" && task.status === "relay_pending") {
      operation = () => completeRelayHandoff(token, task.id);
    } else if (task.leg !== "relay") {
      if (task.status === "rider_assigned") {
        operation = () => updateDeliveryStatus(token, task.id, "picked_up");
      } else if (
        task.status === "picked_up" ||
        task.status === "relay_pending"
      ) {
        operation = () => updateDeliveryStatus(token, task.id, "on_the_way");
      } else if (task.status === "on_the_way") {
        operation = () => updateDeliveryStatus(token, task.id, "delivered");
      }
    }

    return operation ? runTaskOperation(task.id, operation) : Promise.resolve();
  }

  return {
    activeTasks,
    availableTasks,
    busyTaskId,
    error,
    isLoading,
    acceptTask,
    advanceTask,
    refreshTasks,
  };
}
