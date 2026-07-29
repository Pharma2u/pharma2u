"use client";

import { useCallback, useEffect, useState } from "react";
import { adminWorkspaceApi } from "@/lib/adminWorkspaceApi";
import type {
  Announcement,
  CompanyProfile,
  Employee,
  LedgerEntry,
  Subscription,
  SupportTicket,
  WorkspaceData,
} from "./types";

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
  profileTypes: [],
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

  const setData = useCallback((next: WorkspaceData) => {
    updateData(next);
  }, []);

  const createLedger = useCallback(
    async (
      input: Pick<LedgerEntry, "description" | "division" | "type" | "amount">,
    ) => {
      try {
        const saved = await adminWorkspaceApi.createLedger(token, input);
        updateData((current) => ({
          ...current,
          ledger: [saved, ...current.ledger],
        }));
        setError("");
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to save ledger entry.",
        );
        throw cause;
      }
    },
    [token],
  );

  const createAnnouncement = useCallback(
    async (input: Pick<Announcement, "title" | "message" | "audience">) => {
      try {
        const saved = await adminWorkspaceApi.createAnnouncement(token, input);
        updateData((current) => ({
          ...current,
          announcements: [saved, ...current.announcements],
        }));
        setError("");
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to publish announcement.",
        );
        throw cause;
      }
    },
    [token],
  );

  const createEmployee = useCallback(
    async (
      input: Pick<Employee, "name" | "role" | "department" | "monthlySalary">,
    ) => {
      try {
        const saved = await adminWorkspaceApi.createEmployee(token, input);
        updateData((current) => ({
          ...current,
          employees: [saved, ...current.employees],
        }));
        setError("");
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Unable to save employee.",
        );
        throw cause;
      }
    },
    [token],
  );

  const updateTicket = useCallback(
    async (input: SupportTicket) => {
      try {
        const saved = await adminWorkspaceApi.updateTicket(token, input);
        updateData((current) => ({
          ...current,
          tickets: current.tickets.map((item) =>
            item.id === saved.id ? saved : item,
          ),
        }));
        setError("");
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to update support ticket.",
        );
        throw cause;
      }
    },
    [token],
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

  const saveCompany = useCallback(
    async (company: CompanyProfile) => {
      const saved = await adminWorkspaceApi.saveCompany(token, company);
      updateData((current) => ({ ...current, company: saved }));
      setError("");
    },
    [token],
  );

  return {
    data,
    setData,
    saveCompany,
    createLedger,
    createAnnouncement,
    createEmployee,
    updateTicket,
    toggleSubscription,
    loading,
    error,
    reload: load,
  };
}
