"use client";

import type { FinancialSummary } from "./types";
import { FinanceRow } from "./Shared";
import { rupees } from "./vendorUtils";
import { vendorStyles as styles } from "./vendorStyles";

export function FinancialReports({
  financials,
}: {
  financials: FinancialSummary;
}) {
  const netProfit =
    financials.totalRevenue -
    financials.stockPayable -
    financials.pharmacyDiscounts;
  const workingBalance =
    financials.cashRevenue +
    financials.availableBalance +
    financials.heldBalance -
    financials.stockPayable;

  function generateReport(title: string, rows: [string, number][]) {
    const report = window.open("", "_blank", "width=760,height=900");
    if (!report) return;
    report.document.write(
      `<html><head><title>${title}</title><style>body{font-family:Arial;padding:42px;color:#172033}h1{font-size:24px}small{color:#64748b}.row{display:flex;justify-content:space-between;padding:14px 0;border-bottom:1px solid #dfe7ec}.total{font-weight:700;border-top:2px solid #172033;margin-top:12px}</style></head><body><h1>Pharma2U Pharmacy ${title}</h1><small>Generated ${new Date().toLocaleString("en-IN")}</small><div style="margin-top:28px">${rows.map(([label, value], index) => `<div class="row ${index === rows.length - 1 ? "total" : ""}"><span>${label}</span><strong>${rupees.format(value)}</strong></div>`).join("")}</div></body></html>`,
    );
    report.document.close();
    report.focus();
    report.print();
  }

  return (
    <div className={`${styles.section} ${styles.equalColumns}`}>
      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <p className={styles.eyebrow}>Profit & Loss statement</p>
            <h2 className={styles.cardTitle}>Current reporting period</h2>
          </div>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() =>
              generateReport("Profit & Loss Statement", [
                ["Online sales revenue", financials.onlineRevenue],
                ["Cash revenue", financials.cashRevenue],
                ["Stock payable", -financials.stockPayable],
                ["Pharmacy-funded discounts", -financials.pharmacyDiscounts],
                ["Net profit", netProfit],
              ])
            }
          >
            Generate
          </button>
        </div>
        <p className={styles.muted}>
          Revenue and expenses across online and offline operations.
        </p>
        <div className={styles.rows}>
          <FinanceRow
            label="Online sales revenue"
            value={rupees.format(financials.onlineRevenue)}
          />
          <FinanceRow
            label="Cash revenue"
            value={rupees.format(financials.cashRevenue)}
          />
          <FinanceRow
            label="Stock payable"
            value={`(${rupees.format(financials.stockPayable)})`}
          />
          <FinanceRow
            label="Pharmacy-funded discounts"
            value={`(${rupees.format(financials.pharmacyDiscounts)})`}
          />
          <div className={styles.reportTotal}>
            <FinanceRow label="Net profit" value={rupees.format(netProfit)} />
          </div>
        </div>
      </section>
      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <p className={styles.eyebrow}>Balance Sheet</p>
            <h2 className={styles.cardTitle}>Operational position</h2>
          </div>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() =>
              generateReport("Balance Sheet", [
                ["Cash received", financials.cashRevenue],
                ["Available settlement", financials.availableBalance],
                ["Held settlement", financials.heldBalance],
                ["Stock payable", -financials.stockPayable],
                ["Net working balance", workingBalance],
              ])
            }
          >
            Generate
          </button>
        </div>
        <p className={styles.muted}>
          Assets and liabilities visible to the pharmacy vendor.
        </p>
        <div className={styles.rows}>
          <FinanceRow
            label="Cash received"
            value={rupees.format(financials.cashRevenue)}
          />
          <FinanceRow
            label="Available settlement"
            value={rupees.format(financials.availableBalance)}
          />
          <FinanceRow
            label="Held settlement"
            value={rupees.format(financials.heldBalance)}
          />
          <FinanceRow
            label="Stock payable"
            value={`(${rupees.format(financials.stockPayable)})`}
          />
          <div className={styles.reportTotal}>
            <FinanceRow
              label="Net working balance"
              value={rupees.format(workingBalance)}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
