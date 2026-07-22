import type { VendorOrder } from "@/lib/authApi";
import type { FinancialSummary } from "./types";

export const rupees = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function protectedCustomerLabel() {
  return "Customer details protected";
}

export function readableStatus(status: string) {
  return status.replaceAll("_", " ");
}

export function filterOrders(orders: VendorOrder[], filter: string) {
  return orders.filter((order) => {
    if (filter === "Pending") {
      return ["pending_verification", "verified", "awaiting_rider", "rider_assigned"].includes(order.status);
    }
    if (filter === "Out for Delivery") {
      return ["picked_up", "relay_pending", "on_the_way"].includes(order.status);
    }
    if (filter === "Failed") {
      return order.paymentStatus === "failed" || ["rejected", "cancelled", "relay_failed", "disputed"].includes(order.status);
    }
    return order.paymentStatus === "refunded";
  });
}

export function calculateFinancials(orders: VendorOrder[]): FinancialSummary {
  const paid = orders.filter((order) => order.paymentStatus === "paid");
  const onlineRevenue = paid.filter((order) => order.paymentMethod !== "cod").reduce((total, order) => total + order.total, 0);
  const cashRevenue = paid.filter((order) => order.paymentMethod === "cod").reduce((total, order) => total + order.total, 0);
  const receivable = orders.filter((order) => order.paymentStatus === "pending").reduce((total, order) => total + order.total, 0);
  const heldBalance = paid.filter((order) => order.status !== "delivered").reduce((total, order) => total + order.total, 0);
  const pharmacyDiscounts = 0;
  const availableBalance = Math.max(0, onlineRevenue - heldBalance - pharmacyDiscounts);

  return {
    onlineRevenue,
    cashRevenue,
    receivable,
    heldBalance,
    availableBalance,
    stockPayable: 0,
    platformEarnings: onlineRevenue - pharmacyDiscounts,
    pharmacyDiscounts,
    upcomingPayout: availableBalance,
    totalRevenue: onlineRevenue + cashRevenue,
  };
}
