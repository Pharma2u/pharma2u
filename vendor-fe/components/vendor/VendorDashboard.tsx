import type { VendorOrder } from "@/lib/authApi";
import type { FinancialSummary } from "./types";
import { protectedCustomerLabel, readableStatus, rupees } from "./vendorUtils";
import { FinanceRow, MetricCard } from "./Shared";
import { vendorStyles as styles } from "./vendorStyles";

export function VendorDashboard({
  orders,
  financials,
  loading,
  onViewOrders,
}: {
  orders: VendorOrder[];
  financials: FinancialSummary;
  loading: boolean;
  onViewOrders: () => void;
}) {
  return (
    <div className={styles.section}>
      <div className={styles.metrics}>
        <MetricCard
          label="Platform earnings"
          value={rupees.format(financials.platformEarnings)}
          detail="After pharmacy-funded discounts"
        />
        <MetricCard
          label="Available balance"
          value={rupees.format(financials.availableBalance)}
          detail="Ready for a payout request"
        />
        <MetricCard
          label="Held balance"
          value={rupees.format(financials.heldBalance)}
          detail="Orders still in fulfilment"
        />
        <MetricCard
          label="Orders received"
          value={loading ? "—" : String(orders.length)}
          detail="Current Pharma2U queue"
        />
      </div>
      <div className={styles.dashboardGrid}>
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.eyebrow}>Pharma2U Orders Rcvd</p>
              <h2 className={styles.cardTitle}>Recent fulfilment activity</h2>
            </div>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={onViewOrders}
            >
              View queue
            </button>
          </div>
          <div className={styles.orderList}>
            {orders.slice(0, 5).map((order) => (
              <div className={styles.orderRow} key={order.id}>
                <div>
                  <p className={styles.orderCode}>{order.orderCode}</p>
                  <p className={styles.orderMeta}>
                    {protectedCustomerLabel()} · {order.items.length} item
                    {order.items.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className={styles.orderAmount}>
                  {rupees.format(order.total)}
                  <span className={styles.status}>
                    {readableStatus(order.status)}
                  </span>
                </div>
              </div>
            ))}
            {!loading && orders.length === 0 && (
              <p className={styles.empty}>No orders have been received yet.</p>
            )}
          </div>
        </section>
        <aside className={styles.darkCard}>
          <p className={styles.eyebrow}>Settlement snapshot</p>
          <strong className={styles.darkValue}>
            {rupees.format(financials.onlineRevenue)}
          </strong>
          <p className={styles.darkMuted}>Online sales revenue</p>
          <div className={styles.rows}>
            <FinanceRow
              label="Cash collected"
              value={rupees.format(financials.cashRevenue)} dark
            />
            <FinanceRow
              label="Receivable from Pharma2U"
              value={rupees.format(financials.receivable)} dark
            />
            <FinanceRow
              label="Stock payable"
              value={rupees.format(financials.stockPayable)} dark
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
