"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getVendorFinancialSummary,
  listVendorOrders,
  type VendorOrder,
} from "@/lib/authApi";
import type { FinancialSummary, VendorData } from "./types";

const emptyFinancials: FinancialSummary = {
  today: { received: 0, pending: 0, packed: 0, outForDelivery: 0, delivered: 0, failed: 0 },
  allTime: { received: 0, pending: 0, packed: 0, outForDelivery: 0, delivered: 0, failed: 0 },
  onlineRevenue: 0,
  offlineRevenue: 0,
  cashRevenue: 0,
  receivable: 0,
  heldBalance: 0,
  availableBalance: 0,
  inventoryPurchaseValue: 0,
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
  const [financialsLoaded, setFinancialsLoaded] = useState(false);
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
      setFinancialsLoaded(true);
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

  return { orders, loading, financialsLoaded, error, financials, reload };
}
