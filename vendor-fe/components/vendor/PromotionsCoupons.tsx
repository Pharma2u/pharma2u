"use client";

import { useEffect, useState } from "react";
import {
  createVendorPromotion,
  listProducts,
  listVendorPromotions,
  updateProduct,
  type Product,
  type VendorPromotion,
} from "@/lib/authApi";
import { TextField } from "./Shared";
import { rupees } from "./vendorUtils";
import { vendorStyles as styles } from "./vendorStyles";

type OfferType = "coupon" | "product";

const emptyCoupon = {
  title: "",
  code: "",
  discount: "",
  minimum: "",
  expiresAt: "",
};

export function PromotionsCoupons({ token }: { token: string }) {
  const [offerType, setOfferType] = useState<OfferType>("coupon");
  const [form, setForm] = useState(emptyCoupon);
  const [productDiscount, setProductDiscount] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [items, setItems] = useState<VendorPromotion[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listVendorPromotions(token)
      .then((response) => setItems(response.items))
      .catch((caught) =>
        setError(
          caught instanceof Error ? caught.message : "Unable to load promotions.",
        ),
      );
    listProducts(token)
      .then((response) =>
        setProducts(response.items.filter((product) => product.isActive)),
      )
      .catch((caught) =>
        setError(
          caught instanceof Error ? caught.message : "Unable to load products.",
        ),
      );
  }, [token]);

  const matchingProducts = products.filter((product) => {
    const query = productSearch.trim().toLowerCase();
    return !query || `${product.name} ${product.genericName}`.toLowerCase().includes(query);
  });

  function toggleProduct(productId: string) {
    setSelectedProductIds((selected) =>
      selected.includes(productId)
        ? selected.filter((id) => id !== productId)
        : [...selected, productId],
    );
  }

  async function submitCoupon(event: React.FormEvent) {
    event.preventDefault();
    const amountOff = Number(form.discount);
    const minimumOrder = Number(form.minimum || 0);
    if (!Number.isFinite(amountOff) || amountOff <= 0) {
      setError("Enter a coupon discount greater than zero.");
      return;
    }
    if (!Number.isFinite(minimumOrder) || minimumOrder < 0) {
      setError("Minimum order cannot be negative.");
      return;
    }
    if (form.expiresAt && new Date(`${form.expiresAt}T23:59:59`).getTime() < Date.now()) {
      setError("Expiry date must be today or later.");
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");
    try {
      const created = await createVendorPromotion(token, {
        title: form.title.trim(),
        code: form.code.trim(),
        amountOff,
        minimumOrder,
        expiresAt: form.expiresAt || undefined,
      });
      setItems((current) => [created, ...current]);
      setForm(emptyCoupon);
      setNotice("Order coupon launched successfully.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create coupon.");
    } finally {
      setBusy(false);
    }
  }

  async function applyProductOffer(event: React.FormEvent) {
    event.preventDefault();
    const discount = Number(productDiscount);
    if (!Number.isFinite(discount) || discount <= 0 || discount > 100) {
      setError("Enter a product discount between 1 and 100%.");
      return;
    }
    if (selectedProductIds.length === 0) {
      setError("Select at least one product for this offer.");
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");
    try {
      const updated = await Promise.all(
        selectedProductIds.map((id) => updateProduct(token, id, { discount })),
      );
      setProducts((current) =>
        current.map((product) => updated.find((item) => item.id === product.id) ?? product),
      );
      setSelectedProductIds([]);
      setProductDiscount("");
      setNotice(`Applied ${discount}% off to ${updated.length} product${updated.length === 1 ? "" : "s"}.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to apply product offer.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.section}>
      <div className={styles.twoColumns}>
        <section className={styles.card}>
          <p className={styles.eyebrow}>Promotions & Coupons</p>
          <h2 className={styles.cardTitle}>Create an offer</h2>
          <p className={styles.muted}>Choose whether the offer is redeemed on an order or shown directly on selected products.</p>
          <div className={`${styles.segmented} mt-5`}>
            <button type="button" className={`${styles.segment} ${offerType === "coupon" ? styles.segmentActive : ""}`} onClick={() => { setOfferType("coupon"); setError(""); setNotice(""); }}>Order coupon</button>
            <button type="button" className={`${styles.segment} ${offerType === "product" ? styles.segmentActive : ""}`} onClick={() => { setOfferType("product"); setError(""); setNotice(""); }}>Product offer</button>
          </div>

          {offerType === "coupon" ? (
            <form onSubmit={submitCoupon}>
              <div className={styles.formGrid}>
                <TextField label="Offer name" required value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
                <TextField label="Coupon code" required placeholder="SAVE50" value={form.code} onChange={(value) => setForm({ ...form, code: value.toUpperCase() })} />
                <TextField label="Discount amount (INR)" type="number" required value={form.discount} onChange={(value) => setForm({ ...form, discount: value })} />
                <TextField label="Minimum order (INR)" type="number" value={form.minimum} onChange={(value) => setForm({ ...form, minimum: value })} />
                <TextField label="Expiry date (optional)" type="date" value={form.expiresAt} onChange={(value) => setForm({ ...form, expiresAt: value })} />
              </div>
              <div className={styles.formActions}><button disabled={busy} className={styles.primaryButton}>{busy ? "Launching..." : "Launch order coupon"}</button></div>
            </form>
          ) : (
            <form onSubmit={applyProductOffer}>
              <div className={styles.formGrid}>
                <TextField label="Discount (%)" type="number" required placeholder="10" value={productDiscount} onChange={setProductDiscount} />
                <TextField label="Find products" placeholder="Search medicine or generic name" value={productSearch} onChange={setProductSearch} />
              </div>
              <div className="mt-4 max-h-64 overflow-y-auto rounded-[14px] border border-slate-200">
                {matchingProducts.map((product) => {
                  const selected = selectedProductIds.includes(product.id);
                  return <label key={product.id} className="flex cursor-pointer items-center justify-between gap-3 border-b border-slate-100 px-3.5 py-3 text-xs last:border-b-0">
                    <span className="flex min-w-0 items-center gap-3"><input className={styles.checkbox} type="checkbox" checked={selected} onChange={() => toggleProduct(product.id)} /><span className="min-w-0"><b className="block truncate text-slate-900">{product.name}</b><span className="text-[11px] text-slate-500">{product.genericName} {product.discount ? `- ${product.discount}% off active` : ""}</span></span></span>
                    <strong className="shrink-0 text-slate-700">{rupees.format(product.price)}</strong>
                  </label>;
                })}
                {matchingProducts.length === 0 && <p className={styles.empty}>No active products match this search.</p>}
              </div>
              <p className={styles.muted}>{selectedProductIds.length} product{selectedProductIds.length === 1 ? "" : "s"} selected. Applying this offer updates their product discount.</p>
              <div className={styles.formActions}><button disabled={busy} className={styles.primaryButton}>{busy ? "Applying..." : "Apply to selected products"}</button></div>
            </form>
          )}
          {error && <p className={styles.error}>{error}</p>}
          {notice && <p className={styles.notice}>{notice}</p>}
        </section>
        <aside className={styles.fundingCard}>
          <p className={styles.eyebrow}>Funding clarity</p>
          <h2 className={styles.cardTitle}>Every discount has an owner</h2>
          <div className={styles.fundingItem}><strong>Order coupon</strong>The pharmacy bears the fixed INR discount when the coupon is redeemed at checkout.</div>
          <div className={styles.fundingItem}><strong>Product offer</strong>The selected products display the percentage discount set here. Update the offer any time from this screen.</div>
          <div className={styles.fundingItem}><strong>Pharma2U-sponsored offer</strong>Pharma2U funds the discount and the pharmacy receives the eligible payment.</div>
        </aside>
      </div>
      <section className={`${styles.card} mt-[18px]`}>
        <p className={styles.eyebrow}>Your pharmacy offers</p>
        <h2 className={styles.cardTitle}>Order coupons</h2>
        <div className={styles.orderList}>
          {items.map((item) => <div className={styles.orderRow} key={item.id}><div><p className={styles.orderCode}>{item.title} · {item.code}</p><p className={styles.orderMeta}>Minimum order {rupees.format(item.minimumOrder)} · Pharmacy funded</p></div><strong>{rupees.format(item.amountOff)} off</strong></div>)}
          {items.length === 0 && <p className={styles.empty}>No order coupons have been created.</p>}
        </div>
      </section>
    </div>
  );
}
