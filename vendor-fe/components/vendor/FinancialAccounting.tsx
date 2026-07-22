"use client";

import { useState } from "react";
import type { FinanceMode, FinancialSummary } from "./types";
import { FinanceRow, MetricCard } from "./Shared";
import { rupees } from "./vendorUtils";
import { vendorStyles as styles } from "./vendorStyles";

export function FinancialAccounting({
  financials,
}: {
  financials: FinancialSummary;
}) {
  const [mode, setMode] = useState<FinanceMode>("merged");
  const metrics =
    mode === "online"
      ? [
          [
            "Online sales revenue",
            financials.onlineRevenue,
            "Paid Pharma2U orders",
          ],
          [
            "Receivable from Pharma2U",
            financials.receivable,
            "Pending settlement",
          ],
          [
            "Available balance",
            financials.availableBalance,
            "Ready for payout",
          ],
          ["Held balance", financials.heldBalance, "Orders in fulfilment"],
        ]
      : mode === "offline"
        ? [
            [
              "Cash revenue received",
              financials.cashRevenue,
              "Counter and COD collections",
            ],
            ["Stock payable", financials.stockPayable, "Supplier liability"],
            [
              "Available balance",
              financials.cashRevenue,
              "Offline cash position",
            ],
            ["Held balance", 0, "No settlement hold"],
          ]
        : [
            [
              "Cash revenue received",
              financials.cashRevenue,
              "Offline and COD",
            ],
            [
              "Online sales revenue",
              financials.onlineRevenue,
              "Pharma2U paid orders",
            ],
            [
              "Available balance",
              financials.availableBalance + financials.cashRevenue,
              "Merged cash position",
            ],
            ["Held balance", financials.heldBalance, "Online fulfilment hold"],
          ];

  return (
    <section className={`${styles.section} ${styles.card}`}>
      <div className={styles.cardHeader}>
        <div>
          <p className={styles.eyebrow}>Financial accounting</p>
          <h2 className={styles.cardTitle}>Offline and online operations</h2>
          <p className={styles.muted}>
            The accounting view changes; the underlying product inventory stays
            unified.
          </p>
        </div>
        <div className={styles.segmented}>
          {(["online", "offline", "merged"] as FinanceMode[]).map((item) => (
            <button
              type="button"
              key={item}
              onClick={() => setMode(item)}
              className={`${styles.segment} ${mode === item ? styles.segmentActive : ""}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className={`${styles.metrics} ${styles.section}`}>
        {metrics.map(([label, value, detail]) => (
          <MetricCard
            key={String(label)}
            label={String(label)}
            value={rupees.format(Number(value))}
            detail={String(detail)}
          />
        ))}
      </div>
      <div className={styles.summaryStrip}>
        <FinanceRow
          label="Total earnings through Pharma2U"
          value={rupees.format(financials.platformEarnings)}
        />
        <FinanceRow
          label="Upcoming payout"
          value={rupees.format(financials.upcomingPayout)}
        />
        <FinanceRow
          label="Independent discount deductions"
          value={rupees.format(financials.pharmacyDiscounts)}
        />
      </div>
    </section>
  );
}
