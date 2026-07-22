"use client";

import { useCallback, useEffect, useState } from "react";
import { adminWorkspaceApi } from "@/lib/adminWorkspaceApi";
import type { CompanyProfile, Subscription, WorkspaceData } from "./types";

const blankCompany: CompanyProfile = {
  name: "",
  legalName: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  gstin: "",
  registrationNumber: "",
  logoDataUrl: "",
};
const emptyData: WorkspaceData = {
  company: blankCompany,
  financeScope: "combined",
  ledger: [],
  announcements: [],
  employees: [],
  tickets: [],
  subscriptions: [],
  customers: [],
  customerSummary: { members: 0, points: 0 },
  permissions: [],
  dashboard: {
    grossVolume: 0,
    activePharmacies: 0,
    fulfilledOrders: 0,
    activeRiders: 0,
    revenueByMonth: [],
    pendingApplications: [],
    topPharmacy: null,
    newCustomers: 0,
    onTimePercent: 0,
    averageFulfilmentMinutes: 0,
    netMarginPercent: 0,
  },
};

export function useWorkspaceData(token: string) {
  const [data, updateData] = useState<WorkspaceData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        updateData(await adminWorkspaceApi.get(token));
        setError("");
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Unable to load admin data.",
        );
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void load(true);
    }, 10_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
    };
  }, [load]);

  const setData = useCallback(
    (next: WorkspaceData) => {
      const previous = data;
      updateData(next);
      void (async () => {
        try {
          if (
            JSON.stringify(previous.company) !== JSON.stringify(next.company)
          ) {
            await adminWorkspaceApi.saveCompany(token, next.company);
          } else {
            const ledger = next.ledger.find(
              (item) => !previous.ledger.some((old) => old.id === item.id),
            );
            const announcement = next.announcements.find(
              (item) =>
                !previous.announcements.some((old) => old.id === item.id),
            );
            const employee = next.employees.find(
              (item) => !previous.employees.some((old) => old.id === item.id),
            );
            const ticket = next.tickets.find(
              (item) =>
                previous.tickets.find((old) => old.id === item.id)?.status !==
                item.status,
            );
            if (ledger) {
              const saved = await adminWorkspaceApi.createLedger(token, ledger);
              updateData((current) => ({
                ...current,
                ledger: current.ledger.map((item) =>
                  item.id === ledger.id ? saved : item,
                ),
              }));
            } else if (announcement) {
              const saved = await adminWorkspaceApi.createAnnouncement(
                token,
                announcement,
              );
              updateData((current) => ({
                ...current,
                announcements: current.announcements.map((item) =>
                  item.id === announcement.id ? saved : item,
                ),
              }));
            } else if (employee) {
              const saved = await adminWorkspaceApi.createEmployee(
                token,
                employee,
              );
              updateData((current) => ({
                ...current,
                employees: current.employees.map((item) =>
                  item.id === employee.id ? saved : item,
                ),
              }));
            } else if (ticket) {
              const saved = await adminWorkspaceApi.updateTicket(token, ticket);
              updateData((current) => ({
                ...current,
                tickets: current.tickets.map((item) =>
                  item.id === saved.id ? saved : item,
                ),
              }));
            }
          }
          setError("");
        } catch (cause) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to save the change.",
          );
          void load(true);
        }
      })();
    },
    [data, load, token],
  );

  const toggleSubscription = useCallback(
    async (subscription: Subscription) => {
      const optimistic = {
        ...subscription,
        autopay: !subscription.autopay,
        status: subscription.autopay ? "attention" : "active",
      };
      updateData((current) => ({
        ...current,
        subscriptions: current.subscriptions.map((item) =>
          item.pharmacyId === optimistic.pharmacyId ? optimistic : item,
        ),
      }));
      try {
        const saved = await adminWorkspaceApi.updateSubscription(
          token,
          optimistic,
        );
        updateData((current) => ({
          ...current,
          subscriptions: current.subscriptions.map((item) =>
            item.pharmacyId === saved.pharmacyId ? saved : item,
          ),
        }));
        setError("");
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Unable to update auto-pay.",
        );
        void load();
      }
    },
    [load, token],
  );

  return { data, setData, toggleSubscription, loading, error, reload: load };
}
