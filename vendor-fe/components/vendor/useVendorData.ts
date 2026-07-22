"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getVendorFinancialSummary,
  listVendorOrders,
  type VendorOrder,
} from "@/lib/authApi";
import type { FinancialSummary, VendorData } from "./types";

const emptyFinancials: FinancialSummary = {
  onlineRevenue: 0,
  cashRevenue: 0,
  receivable: 0,
  heldBalance: 0,
  availableBalance: 0,
  stockPayable: 0,
  platformEarnings: 0,
  pharmacyDiscounts: 0,
  upcomingPayout: 0,
  totalRevenue: 0,
};

export function useVendorData(
  token: string,
): VendorData & { reload: () => Promise<void> } {
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [financials, setFinancials] =
    useState<FinancialSummary>(emptyFinancials);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setError("");
    try {
      const [orderResponse, financialResponse] = await Promise.all([
        listVendorOrders(token),
        getVendorFinancialSummary(token),
      ]);
      setOrders(orderResponse.items);
      setFinancials(financialResponse);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load vendor data.",
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const initial = window.setTimeout(() => void reload(), 0);
    const timer = window.setInterval(reload, 15_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [reload]);

  return { orders, loading, error, financials, reload };
}
