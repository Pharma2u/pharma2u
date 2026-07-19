"use client";

import { useEffect, useState } from "react";
import {
  listVendorOrders,
  markVendorOrderPacked,
  verifyVendorOrder,
  type VendorOrder,
} from "@/lib/authApi";

type OrderAction = () => Promise<unknown>;

function statusLabel(status: VendorOrder["status"]) {
  const labels: Record<VendorOrder["status"], string> = {
    pending_verification: "Prescription review",
    verified: "Ready to pack",
    rejected: "Rejected",
    awaiting_rider: "Awaiting rider",
    rider_assigned: "Rider assigned",
    picked_up: "Picked up",
    relay_pending: "Relay handoff",
    relay_failed: "Relay failed",
    on_the_way: "On the way",
    delivered: "Delivered",
    cancelled: "Cancelled",
    disputed: "Disputed",
  };
  return labels[status];
}

function orderItemsLabel(order: VendorOrder) {
  return order.items.map((item) => `${item.name} x ${item.qty}`).join(", ");
}

export function OrderQueue({ token }: { token: string }) {
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [error, setError] = useState("");
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadOrders() {
    setIsLoading(true);
    setError("");
    try {
      const response = await listVendorOrders(token);
      setOrders(response.items);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to load orders.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    listVendorOrders(token)
      .then((response) => {
        if (active) setOrders(response.items);
      })
      .catch((caught) => {
        if (active) {
          setError(
            caught instanceof Error ? caught.message : "Unable to load orders.",
          );
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    const intervalId = window.setInterval(() => {
      void loadOrders();
    }, 15_000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [token]);

  async function runOrderAction(orderId: string, action: OrderAction) {
    setBusyOrderId(orderId);
    setError("");
    try {
      await action();
      await loadOrders();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Order action failed.",
      );
    } finally {
      setBusyOrderId(null);
    }
  }

  function rejectOrder(order: VendorOrder) {
    const reason = window.prompt("Why is this prescription being rejected?");
    if (!reason?.trim()) return;

    void runOrderAction(order.id, () =>
      verifyVendorOrder(token, order.id, false, reason.trim()),
    );
  }

  return (
    <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.18em] text-teal-700">
            ORDER QUEUE
          </p>
          <h2 className="mt-1 text-xl font-bold">Fulfil incoming orders</h2>
        </div>
        <button
          type="button"
          onClick={() => void loadOrders()}
          disabled={isLoading}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {error && (
        <p
          className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      )}

      <div className="mt-5 space-y-3">
        {isLoading ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Loading order queue...
          </p>
        ) : orders.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            No orders have been received yet.
          </p>
        ) : (
          orders.map((order) => {
            const isBusy = busyOrderId === order.id;

            return (
              <article
                key={order.id}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">{order.orderCode}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {order.customer.name} - INR {order.total}
                    </p>
                    <p className="mt-2 text-sm">{orderItemsLabel(order)}</p>
                    {order.rider && (
                      <p className="mt-2 text-sm text-slate-600">
                        Delivery rider:{" "}
                        <span className="font-semibold text-slate-900">
                          {order.rider.name}
                        </span>
                        {order.rider.riderLocation?.isOnline
                          ? " - Live location active"
                          : " - Location unavailable"}
                      </p>
                    )}
                    {order.relayRider && (
                      <p className="mt-2 text-sm text-slate-600">
                        Relay rider:{" "}
                        <span className="font-semibold text-slate-900">
                          {order.relayRider.name}
                        </span>
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                      <span
                        className={`rounded-full px-2.5 py-1 ${order.paymentStatus === "paid" ? "bg-emerald-50 text-emerald-700" : order.paymentStatus === "failed" ? "bg-red-50 text-red-700" : order.paymentStatus === "refunded" ? "bg-violet-50 text-violet-700" : "bg-amber-50 text-amber-700"}`}
                      >
                        {order.paymentMethod.toUpperCase()} ·{" "}
                        {order.paymentStatus}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                        {order.fulfilmentLeg} fulfilment
                      </span>
                      {order.refund && (
                        <span
                          className={`rounded-full px-2.5 py-1 ${order.refund.status === "completed" ? "bg-violet-50 text-violet-700" : order.refund.status === "failed" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}
                        >
                          Refund {order.refund.status} · INR{" "}
                          {order.refund.amount}
                        </span>
                      )}
                    </div>
                    {order.payment?.failureReason && (
                      <p className="mt-2 text-xs text-red-600">
                        {order.payment.failureReason}
                      </p>
                    )}
                    {order.refund?.errorReason && (
                      <p className="mt-2 text-xs text-red-600">
                        Refund: {order.refund.errorReason}
                      </p>
                    )}
                  </div>
                  <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">
                    {order.fulfilmentLeg === "relay" && order.relayPackedAt
                      ? "Relay items packed"
                      : statusLabel(order.status)}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {order.status === "pending_verification" &&
                    (order.paymentMethod === "cod" ||
                      order.paymentStatus === "paid") && (
                      <>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() =>
                            void runOrderAction(order.id, () =>
                              verifyVendorOrder(token, order.id, true),
                            )
                          }
                          className="rounded-xl bg-teal-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => rejectOrder(order)}
                          className="rounded-xl border border-red-200 px-3 py-2 text-sm font-bold text-red-700 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  {(order.status === "verified" || order.canPackRelay) &&
                    (order.paymentMethod === "cod" ||
                      order.paymentStatus === "paid") && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() =>
                          void runOrderAction(order.id, () =>
                            markVendorOrderPacked(token, order.id),
                          )
                        }
                        className="rounded-xl bg-teal-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
                      >
                        Mark packed
                      </button>
                    )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
