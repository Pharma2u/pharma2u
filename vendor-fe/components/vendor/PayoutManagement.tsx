"use client";

import { useEffect, useState } from "react";
import {
  createPayoutRequest,
  listPayoutRequests,
  type PayoutRequest,
} from "@/lib/authApi";
import type { FinancialSummary } from "./types";
import { TextField } from "./Shared";
import { rupees } from "./vendorUtils";
import { vendorStyles as styles } from "./vendorStyles";

export function PayoutManagement({
  token,
  financials,
  onChanged,
}: {
  token: string;
  financials: FinancialSummary;
  onChanged: () => Promise<void>;
}) {
  const [form, setForm] = useState({ amount: "", note: "" });
  const [items, setItems] = useState<PayoutRequest[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    listPayoutRequests(token)
      .then((response) => setItems(response.items))
      .catch((caught) =>
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load payout requests.",
        ),
      );
  }, [token]);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const created = await createPayoutRequest(token, {
        amount: Number(form.amount),
        note: form.note,
      });
      setItems([created, ...items]);
      setForm({ amount: "", note: "" });
      await onChanged();
      setNotice("Withdrawal support ticket raised successfully.");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to request payout.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={styles.section}>
      <div className={styles.twoColumns}>
        <aside className={styles.card}>
          <p className={styles.eyebrow}>Available to withdraw</p>
          <strong className={styles.darkValue}>
            {rupees.format(financials.availableBalance)}
          </strong>
          <p className={styles.muted}>
            Only cleared online settlement can be requested.
          </p>
          <div className={styles.rows}>
            <Line
              label="Held balance"
              value={rupees.format(financials.heldBalance)}
            />
            <Line
              label="Upcoming payout"
              value={rupees.format(financials.upcomingPayout)}
            />
          </div>
        </aside>
        <form className={styles.card} onSubmit={submit}>
          <p className={styles.eyebrow}>Payout management</p>
          <h2 className={styles.cardTitle}>
            Raise a withdrawal support ticket
          </h2>
          <p className={styles.muted}>
            The requested amount is validated against your available balance.
          </p>
          <div className={styles.formGrid}>
            <TextField
              label="Withdrawal amount"
              type="number"
              required
              value={form.amount}
              onChange={(value) => setForm({ ...form, amount: value })}
            />
            <TextField
              label="Support note"
              required
              value={form.note}
              onChange={(value) => setForm({ ...form, note: value })}
            />
          </div>
          <div className={styles.formActions}>
            <button disabled={busy} className={styles.primaryButton}>
              {busy ? "Submitting…" : "Request withdrawal"}
            </button>
          </div>
          {error && <p className={styles.error}>{error}</p>}
          {notice && <p className={styles.notice}>{notice}</p>}
        </form>
      </div>
      <section className={`${styles.card} ${styles.section}`}>
        <p className={styles.eyebrow}>Support tickets</p>
        <h2 className={styles.cardTitle}>Withdrawal request history</h2>
        <div className={styles.orderList}>
          {items.map((item) => (
            <div className={styles.orderRow} key={item.id}>
              <div>
                <p className={styles.orderCode}>{item.note}</p>
                <p className={styles.orderMeta}>
                  {new Date(item.createdAt).toLocaleDateString("en-IN")} ·{" "}
                  {item.status}
                </p>
              </div>
              <strong>{rupees.format(item.amount)}</strong>
            </div>
          ))}
          {items.length === 0 && (
            <p className={styles.empty}>
              No withdrawal requests have been raised.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.row}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
