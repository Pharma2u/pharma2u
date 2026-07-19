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

export function useRiderTasks(token: string, isOnline: boolean) {
  const [availableTasks, setAvailableTasks] = useState<RiderTask[]>([]);
  const [activeTasks, setActiveTasks] = useState<RiderTask[]>([]);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshTasks = useCallback(async () => {
    setError("");
    try {
      const [available, active] = await Promise.all([
        isOnline
          ? listRiderTasks(token)
          : Promise.resolve({ items: [] as RiderTask[] }),
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
  }, [isOnline, token]);

  useEffect(() => {
    void Promise.resolve().then(refreshTasks);
    if (!isOnline) return;

    const intervalId = window.setInterval(refreshTasks, 15_000);
    return () => window.clearInterval(intervalId);
  }, [isOnline, refreshTasks]);

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

  function advanceTask(task: RiderTask, deliveryOtp?: string, pickupOtp?: string) {
    let operation: TaskOperation | null = null;

    if (task.leg === "relay" && task.status === "relay_pending") {
      operation = () => completeRelayHandoff(token, task.id);
    } else if (task.leg !== "relay") {
      if (task.status === "rider_assigned") {
        operation = () => updateDeliveryStatus(token, task.id, "picked_up", undefined, pickupOtp);
      } else if (
        task.status === "picked_up" ||
        task.status === "relay_pending"
      ) {
        operation = () => updateDeliveryStatus(token, task.id, "on_the_way");
      } else if (task.status === "on_the_way") {
        operation = () => updateDeliveryStatus(token, task.id, "delivered", deliveryOtp);
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
