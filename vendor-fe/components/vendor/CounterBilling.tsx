"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createCounterBill,
  getVendorSettings,
  listProducts,
  updateVendorSettings,
  type CounterBill as Bill,
  type Product,
} from "@/lib/authApi";
import { rupees } from "./vendorUtils";
import { TextField } from "./Shared";
import { vendorStyles as styles } from "./vendorStyles";

type BillLine = { productId: string; qty: number };

export function CounterBilling({
  token,
  onDataChanged,
}: {
  token: string;
  onDataChanged: () => Promise<void>;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [lines, setLines] = useState<BillLine[]>([]);
  const [selection, setSelection] = useState("");
  const [customerReference, setCustomerReference] = useState("");
  const [discount, setDiscount] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [printerUrl, setPrinterUrl] = useState("");
  const [autoPrint, setAutoPrint] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([listProducts(token), getVendorSettings(token)])
      .then(([catalogue, settings]) => {
        setProducts(catalogue.items);
        setPrinterUrl(settings.printerUrl ?? "");
        setAutoPrint(settings.autoPrint);
      })
      .catch((caught) =>
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load billing data.",
        ),
      );
  }, [token]);

  const subtotal = useMemo(
    () =>
      lines.reduce((sum, line) => {
        const product = products.find((item) => item.id === line.productId);
        return sum + (product?.price ?? 0) * line.qty;
      }, 0),
    [lines, products],
  );
  const total = Math.max(0, subtotal - Number(discount || 0));

  function addProduct() {
    if (!selection || lines.some((line) => line.productId === selection))
      return;
    setLines([...lines, { productId: selection, qty: 1 }]);
    setSelection("");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const bill = await createCounterBill(token, {
        customerReference,
        paymentMethod,
        discount: Number(discount || 0),
        items: lines,
      });
      printBill(bill);
      setLines([]);
      setDiscount("0");
      setCustomerReference("");
      setProducts((await listProducts(token)).items);
      await onDataChanged();
      setNotice(
        `${bill.billNumber} was created and shared inventory was updated.`,
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to create the counter bill.",
      );
    } finally {
      setBusy(false);
    }
  }

  function printBill(bill: Bill) {
    const popup = window.open("", "_blank", "width=420,height=720");
    if (!popup) return;
    popup.document.write(
      `<html><head><title>${bill.billNumber}</title></head><body style="font-family:Arial;padding:24px"><h2>Pharma2U Counter Bill</h2><p>${bill.billNumber}</p><hr/>${bill.items.map((item) => `<p>${item.name} × ${item.qty}<span style="float:right">${rupees.format(item.price * item.qty)}</span></p>`).join("")}<hr/><p>Subtotal <b style="float:right">${rupees.format(bill.subtotal)}</b></p><p>Discount <b style="float:right">${rupees.format(bill.discount)}</b></p><h3>Total <span style="float:right">${rupees.format(bill.total)}</span></h3></body></html>`,
    );
    popup.document.close();
    popup.focus();
    popup.print();
  }

  async function savePrinter() {
    setError("");
    try {
      await updateVendorSettings(token, {
        printerUrl: printerUrl.trim(),
        autoPrint,
      });
      setNotice("Printer settings saved for this pharmacy.");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to save printer settings.",
      );
    }
  }

  return (
    <div className={`${styles.section} ${styles.twoColumns}`}>
      <form className={styles.card} onSubmit={submit}>
        <p className={styles.eyebrow}>Offline store sale</p>
        <h2 className={styles.cardTitle}>Create counter bill</h2>
        <p className={styles.muted}>
          Every billed quantity is deducted from the same inventory used by
          online orders.
        </p>
        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span>Add product</span>
            <select
              value={selection}
              onChange={(event) => setSelection(event.target.value)}
            >
              <option value="">Select an in-stock product</option>
              {products
                .filter(
                  (product) =>
                    product.stock > 0 &&
                    !lines.some((line) => line.productId === product.id),
                )
                .map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} · {rupees.format(product.price)} ·{" "}
                    {product.stock} available
                  </option>
                ))}
            </select>
          </label>
          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={addProduct}
            >
              Add to bill
            </button>
          </div>
        </div>
        <div className={styles.orderList}>
          {lines.map((line) => {
            const product = products.find(
              (item) => item.id === line.productId,
            )!;
            return (
              <div className={styles.orderRow} key={line.productId}>
                <div>
                  <p className={styles.orderCode}>{product.name}</p>
                  <p className={styles.orderMeta}>
                    {rupees.format(product.price)} each · {product.stock}{" "}
                    available
                  </p>
                </div>
                <div>
                  <input
                    aria-label={`Quantity for ${product.name}`}
                    style={{ width: 70 }}
                    type="number"
                    min="1"
                    max={product.stock}
                    value={line.qty}
                    onChange={(event) =>
                      setLines(
                        lines.map((item) =>
                          item.productId === line.productId
                            ? { ...item, qty: Number(event.target.value) }
                            : item,
                        ),
                      )
                    }
                  />
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() =>
                      setLines(
                        lines.filter(
                          (item) => item.productId !== line.productId,
                        ),
                      )
                    }
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
          {lines.length === 0 && (
            <p className={styles.empty}>Add products to begin the bill.</p>
          )}
        </div>
        <div className={styles.formGrid}>
          <TextField
            label="Customer reference (optional)"
            value={customerReference}
            onChange={setCustomerReference}
          />
          <TextField
            label="Pharmacy discount"
            type="number"
            value={discount}
            onChange={setDiscount}
          />
          <label className={styles.field}>
            <span>Payment method</span>
            <select
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
            </select>
          </label>
        </div>
        <div className={styles.totalBox}>
          <span>Bill total</span>
          <strong>{rupees.format(total)}</strong>
        </div>
        <div className={styles.formActions}>
          <button
            className={styles.primaryButton}
            disabled={busy || lines.length === 0}
          >
            {busy ? "Creating bill…" : "Create bill and print"}
          </button>
        </div>
        {error && <p className={styles.error}>{error}</p>}
        {notice && <p className={styles.notice}>{notice}</p>}
      </form>
      <aside className={styles.card}>
        <p className={styles.eyebrow}>Auto-printing</p>
        <h2 className={styles.cardTitle}>Bill printer connection</h2>
        <p className={styles.muted}>
          Connect the local printer bridge used by this pharmacy.
        </p>
        <div className={styles.section}>
          <TextField
            label="Printer bridge URL"
            value={printerUrl}
            onChange={setPrinterUrl}
            placeholder="http://localhost:9100/print"
          />
          <label className={styles.toggleRow}>
            <span>Print every newly received successful online order</span>
            <input
              className={styles.checkbox}
              type="checkbox"
              checked={autoPrint}
              onChange={(event) => setAutoPrint(event.target.checked)}
            />
          </label>
          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => void savePrinter()}
            >
              Save printer settings
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
