import type { VendorOrder } from "@/lib/authApi";

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
    if (filter === "All Orders") return true;
    if (filter === "Needs Review") return order.status === "pending_verification";
    if (filter === "Preparing") return order.status === "verified";
    if (filter === "Ready for Pickup") return ["awaiting_rider", "rider_assigned"].includes(order.status);
    if (filter === "Out for Delivery") return ["picked_up", "relay_pending", "on_the_way"].includes(order.status);
    if (filter === "Delivered") return order.status === "delivered";
    return order.paymentStatus === "failed" || ["rejected", "cancelled", "relay_failed", "disputed"].includes(order.status);
  });
}
