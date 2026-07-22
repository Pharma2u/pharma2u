"use client";

import { useMemo, useState } from "react";
import {
  markVendorOrderPacked,
  verifyVendorOrder,
  type VendorOrder,
} from "@/lib/authApi";
import {
  filterOrders,
  protectedCustomerLabel,
  readableStatus,
  rupees,
} from "./vendorUtils";
import { vendorStyles as styles } from "./vendorStyles";

const filters = ["Pending", "Out for Delivery", "Failed", "Return Orders"];

export function OrderStatusQueue({
  token,
  orders,
  loading,
  error,
  onChanged,
}: {
  token: string;
  orders: VendorOrder[];
  loading: boolean;
  error: string;
  onChanged: () => Promise<void>;
}) {
  const [filter, setFilter] = useState("Pending");
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const filtered = useMemo(
    () => filterOrders(orders, filter),
    [orders, filter],
  );

  async function act(orderId: string, action: () => Promise<unknown>) {
    setBusy(orderId);
    setActionError("");
    try {
      await action();
      await onChanged();
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : "Order action failed.",
      );
    } finally {
      setBusy(null);
    }
  }
  function reject(order: VendorOrder) {
    const reason = window.prompt("Enter the prescription rejection reason.");
    if (reason?.trim())
      void act(order.id, () =>
        verifyVendorOrder(token, order.id, false, reason.trim()),
      );
  }

  return (
    <section className={`${styles.section} ${styles.card}`}>
      <div className={styles.cardHeader}>
        <div>
          <p className={styles.eyebrow}>Order operations</p>
          <h2 className={styles.cardTitle}>Pharma2U Orders Rcvd</h2>
          <p className={styles.muted}>
            Review, approve and pack orders without exposing customer personal
            information.
          </p>
        </div>
        <span className={styles.badge}>Personal data masked</span>
      </div>
      <div className={styles.filters}>
        {filters.map((item) => (
          <button
            type="button"
            key={item}
            onClick={() => setFilter(item)}
            className={`${styles.filter} ${filter === item ? styles.filterActive : ""}`}
          >
            {item}
          </button>
        ))}
      </div>
      {(error || actionError) && (
        <p className={styles.error}>{error || actionError}</p>
      )}
      <div className={styles.privacyNote}>
        <strong>Privacy control</strong>
        <span>
          Customer name, phone, address, coordinates and delivery instructions
          are removed by the vendor API.
        </span>
      </div>
      <div className={styles.table}>
        <div className={styles.tableHead}>
          <span>Order</span>
          <span>Status and actions</span>
          <span className={styles.alignRight}>Amount</span>
        </div>
        {loading ? (
          <p className={styles.empty}>Loading order queue…</p>
        ) : (
          filtered.map((order) => (
            <div className={styles.tableRow} key={order.id}>
              <div>
                <p className={styles.orderCode}>{order.orderCode}</p>
                <p className={styles.orderMeta}>
                  {protectedCustomerLabel()} ·{" "}
                  {order.items
                    .map((item) => `${item.name} × ${item.qty}`)
                    .join(", ")}
                </p>
              </div>
              <div className="max-[560px]:col-span-2">
                <span className={styles.status}>
                  {readableStatus(order.status)}
                </span>
                <div className={styles.filters}>
                  {order.status === "pending_verification" &&
                    (order.paymentMethod === "cod" ||
                      order.paymentStatus === "paid") && (
                      <>
                        <button
                          disabled={busy === order.id}
                          className={styles.primaryButton}
                          onClick={() =>
                            void act(order.id, () =>
                              verifyVendorOrder(token, order.id, true),
                            )
                          }
                        >
                          Approve
                        </button>
                        <button
                          disabled={busy === order.id}
                          className={styles.secondaryButton}
                          onClick={() => reject(order)}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  {order.status === "verified" && (
                    <button
                      disabled={busy === order.id}
                      className={styles.primaryButton}
                      onClick={() =>
                        void act(order.id, () =>
                          markVendorOrderPacked(token, order.id),
                        )
                      }
                    >
                      Mark packed
                    </button>
                  )}
                </div>
              </div>
              <strong
                className={`${styles.alignRight} max-[560px]:col-start-2 max-[560px]:row-start-1 max-[560px]:text-[11px]`}
              >
                {rupees.format(order.total)}
              </strong>
            </div>
          ))
        )}
        {!loading && filtered.length === 0 && (
          <p className={styles.empty}>
            No {filter.toLowerCase()} are currently in the queue.
          </p>
        )}
      </div>
    </section>
  );
}
