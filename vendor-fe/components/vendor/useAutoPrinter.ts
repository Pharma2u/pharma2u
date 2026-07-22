"use client";

import { useEffect } from "react";
import { getVendorSettings, type VendorOrder } from "@/lib/authApi";

const printedKey = "pharma2u_vendor_printed_orders";

export function useAutoPrinter(token: string, orders: VendorOrder[]) {
  useEffect(() => {
    if (orders.length === 0) return;
    let cancelled = false;

    async function printNewOrders() {
      const settings = await getVendorSettings(token);
      if (cancelled || !settings.autoPrint || !settings.printerUrl) return;
      const printed = new Set<string>(
        JSON.parse(window.localStorage.getItem(printedKey) ?? "[]"),
      );
      const printable = orders.filter(
        (order) =>
          !printed.has(order.id) &&
          (order.paymentStatus === "paid" || order.paymentMethod === "cod"),
      );

      for (const order of printable) {
        await fetch(settings.printerUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "pharma2u-order",
            orderCode: order.orderCode,
            paymentMethod: order.paymentMethod,
            total: order.total,
            items: order.items.map((item) => ({
              name: item.name,
              qty: item.qty,
              price: item.price,
            })),
          }),
        });
        printed.add(order.id);
      }
      window.localStorage.setItem(
        printedKey,
        JSON.stringify([...printed].slice(-500)),
      );
    }

    void printNewOrders().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [orders, token]);
}
