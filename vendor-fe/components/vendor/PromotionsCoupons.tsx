"use client";

import { useEffect, useState } from "react";
import {
  createVendorPromotion,
  listVendorPromotions,
  type VendorPromotion,
} from "@/lib/authApi";
import { TextField } from "./Shared";
import { rupees } from "./vendorUtils";
import { vendorStyles as styles } from "./vendorStyles";

export function PromotionsCoupons({ token }: { token: string }) {
  const [form, setForm] = useState({
    title: "",
    code: "",
    discount: "",
    minimum: "",
    expiresAt: "",
  });
  const [items, setItems] = useState<VendorPromotion[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    listVendorPromotions(token)
      .then((response) => setItems(response.items))
      .catch((caught) =>
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load promotions.",
        ),
      );
  }, [token]);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const created = await createVendorPromotion(token, {
        title: form.title,
        code: form.code,
        amountOff: Number(form.discount),
        minimumOrder: Number(form.minimum || 0),
        expiresAt: form.expiresAt || undefined,
      });
      setItems([created, ...items]);
      setForm({
        title: "",
        code: "",
        discount: "",
        minimum: "",
        expiresAt: "",
      });
      setNotice("Pharmacy-funded offer launched successfully.");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to create promotion.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={styles.section}>
      <div className={styles.twoColumns}>
        <form className={styles.card} onSubmit={submit}>
          <p className={styles.eyebrow}>Promotions & Coupons</p>
          <h2 className={styles.cardTitle}>Create a pharmacy offer</h2>
          <p className={styles.muted}>
            Merchant-created discounts are recorded as pharmacy-funded
            settlement deductions.
          </p>
          <div className={styles.formGrid}>
            <TextField
              label="Offer name"
              required
              value={form.title}
              onChange={(value) => setForm({ ...form, title: value })}
            />
            <TextField
              label="Coupon code"
              required
              value={form.code}
              onChange={(value) =>
                setForm({ ...form, code: value.toUpperCase() })
              }
            />
            <TextField
              label="Discount amount"
              type="number"
              required
              value={form.discount}
              onChange={(value) => setForm({ ...form, discount: value })}
            />
            <TextField
              label="Minimum order"
              type="number"
              value={form.minimum}
              onChange={(value) => setForm({ ...form, minimum: value })}
            />
            <TextField
              label="Expiry date (optional)"
              type="date"
              value={form.expiresAt}
              onChange={(value) => setForm({ ...form, expiresAt: value })}
            />
          </div>
          <div className={styles.formActions}>
            <button disabled={busy} className={styles.primaryButton}>
              {busy ? "Launching…" : "Launch pharmacy offer"}
            </button>
          </div>
          {error && <p className={styles.error}>{error}</p>}
          {notice && <p className={styles.notice}>{notice}</p>}
        </form>
        <aside className={styles.fundingCard}>
          <p className={styles.eyebrow}>Funding clarity</p>
          <h2 className={styles.cardTitle}>Every discount has an owner</h2>
          <div className={styles.fundingItem}>
            <strong>Pharmacy-created offer</strong>The pharmacy bears the
            discount and it is deducted from settlement.
          </div>
          <div className={styles.fundingItem}>
            <strong>Pharma2U-sponsored offer</strong>Pharma2U funds the discount
            and the pharmacy receives full eligible payment.
          </div>
        </aside>
      </div>
      <section className={`${styles.card} ${styles.section}`}>
        <p className={styles.eyebrow}>Your pharmacy offers</p>
        <h2 className={styles.cardTitle}>Active and scheduled coupons</h2>
        <div className={styles.orderList}>
          {items.map((item) => (
            <div className={styles.orderRow} key={item.id}>
              <div>
                <p className={styles.orderCode}>
                  {item.title} · {item.code}
                </p>
                <p className={styles.orderMeta}>
                  Minimum order {rupees.format(item.minimumOrder)} · Pharmacy
                  funded
                </p>
              </div>
              <strong>{rupees.format(item.amountOff)} off</strong>
            </div>
          ))}
          {items.length === 0 && (
            <p className={styles.empty}>
              No pharmacy-funded offers have been created.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
