"use client";

import { useEffect, useMemo, useState } from "react";
import { Minus, PackagePlus, Plus, Search, Trash2 } from "lucide-react";
import {
  createCounterBill,
  listProducts,
  type CounterBill as Bill,
  type Product,
} from "@/lib/authApi";
import { rupees } from "./vendorUtils";

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
  const [search, setSearch] = useState("");
  const [customerReference, setCustomerReference] =
    useState("Walk-in Customer");
  const [customerPhone, setCustomerPhone] = useState("");
  const [discount, setDiscount] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listProducts(token)
      .then((catalogue) =>
        setProducts(catalogue.items.filter((product) => product.isActive)),
      )
      .catch((caught) =>
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load medicines.",
        ),
      );
  }, [token]);

  const matches = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products
      .filter(
        (product) =>
          product.stock > 0 &&
          (!query ||
            `${product.name} ${product.genericName} ${product.batchNumber ?? ""}`
              .toLowerCase()
              .includes(query)),
      )
      .slice(0, 8);
  }, [products, search]);
  const quickProducts = useMemo(
    () => products.filter((product) => product.stock > 0).slice(0, 5),
    [products],
  );
  const subtotal = useMemo(
    () =>
      lines.reduce(
        (sum, line) =>
          sum +
          (products.find((product) => product.id === line.productId)?.price ??
            0) *
            line.qty,
        0,
      ),
    [lines, products],
  );
  const discountAmount = Math.max(0, Number(discount) || 0);
  const total = Math.max(0, subtotal - discountAmount);

  function addProduct(productId: string) {
    const product = products.find((item) => item.id === productId);
    if (!product || product.stock < 1) return;
    setLines((current) => {
      const existing = current.find((line) => line.productId === productId);
      if (!existing) return [...current, { productId, qty: 1 }];
      if (existing.qty >= product.stock) return current;
      return current.map((line) =>
        line.productId === productId ? { ...line, qty: line.qty + 1 } : line,
      );
    });
    setError("");
  }

  function updateQuantity(productId: string, qty: number) {
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    if (qty <= 0) {
      setLines((current) =>
        current.filter((line) => line.productId !== productId),
      );
      return;
    }
    setLines((current) =>
      current.map((line) =>
        line.productId === productId
          ? { ...line, qty: Math.min(product.stock, Math.max(1, qty)) }
          : line,
      ),
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const bill = await createCounterBill(token, {
        customerReference: [customerReference.trim(), customerPhone.trim()]
          .filter(Boolean)
          .join(" · "),
        paymentMethod,
        discount: discountAmount,
        items: lines,
      });
      printBill(bill);
      setLines([]);
      setDiscount("0");
      setCustomerReference("Walk-in Customer");
      setCustomerPhone("");
      setProducts(
        (await listProducts(token)).items.filter((product) => product.isActive),
      );
      await onDataChanged();
      setNotice(`${bill.billNumber} created. Shared stock has been updated.`);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to create the bill.",
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

  return (
    <form
      onSubmit={submit}
      className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]"
    >
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">
            Fast pharmacy billing
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Search an in-stock medicine, add quantities, then complete the
            walk-in bill.
          </p>
        </div>
        <div className="grid gap-3 border-b border-slate-100 p-5 md:grid-cols-2">
          <label className="grid gap-1 text-xs font-bold text-slate-600">
            Patient name
            <input
              value={customerReference}
              onChange={(event) => setCustomerReference(event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-teal-600"
            />
          </label>
          <label className="grid gap-1 text-xs font-bold text-slate-600">
            Phone
            <input
              value={customerPhone}
              onChange={(event) => setCustomerPhone(event.target.value)}
              placeholder="Optional"
              className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-teal-600"
            />
          </label>
        </div>
        <div className="mx-5 mb-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-600">
            Search medicine / batch
            <span className="flex items-center gap-2 rounded-xl border border-amber-100 bg-white px-3 py-2.5 normal-case tracking-normal focus-within:border-teal-500">
              <Search size={17} className="text-teal-700" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Type medicine name, generic name or batch"
                className="w-full bg-transparent text-sm font-normal outline-none"
              />
            </span>
          </label>
          <div className="mt-3 max-h-72 overflow-y-auto rounded-xl border border-amber-100 bg-white">
            {matches.map((product) => (
              <MedicineResult
                key={product.id}
                product={product}
                onAdd={() => addProduct(product.id)}
              />
            ))}
            {matches.length === 0 && (
              <p className="p-6 text-center text-sm text-slate-500">
                No in-stock medicine matches your search.
              </p>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Select a medicine to add one unit. You can change the quantity
            below.
          </p>
        </div>
        <div className="border-t border-slate-100 px-5 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Added medicines
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              {lines.length} item{lines.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
            {lines.map((line) => {
              const product = products.find(
                (item) => item.id === line.productId,
              )!;
              return (
                <BillRow
                  key={line.productId}
                  product={product}
                  qty={line.qty}
                  onQuantity={(qty) => updateQuantity(product.id, qty)}
                  onRemove={() => updateQuantity(product.id, 0)}
                />
              );
            })}
            {lines.length === 0 && (
              <div className="grid min-h-40 place-items-center p-6 text-center">
                <PackagePlus size={24} className="text-amber-600" />
                <p className="mt-2 text-sm font-bold text-slate-800">
                  Start by searching medicine above
                </p>
                <p className="text-xs text-slate-500">
                  Added medicines will stay visible here.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
      <aside className="space-y-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900">Payment summary</h2>
          <div className="mt-4 space-y-2 text-sm">
            <SummaryRow label="Subtotal" value={rupees.format(subtotal)} />
            <label className="grid gap-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Discount (INR)
              <input
                type="number"
                min="0"
                max={subtotal}
                value={discount}
                onChange={(event) => setDiscount(event.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal"
              />
            </label>
            <label className="grid gap-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Payment mode
              <select
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal"
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
              </select>
            </label>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-amber-50 px-3 py-4">
            <span className="font-bold text-slate-900">Total</span>
            <strong className="text-xl text-slate-950">
              {rupees.format(total)}
            </strong>
          </div>
          <button
            disabled={busy || lines.length === 0}
            className="mt-3 w-full rounded-xl bg-teal-950 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Saving bill…" : "Save bill & print"}
          </button>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900">
            Fast medicine list
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Quickly add your available items.
          </p>
          <div className="mt-3 space-y-2">
            {quickProducts.map((product) => (
              <button
                type="button"
                key={product.id}
                onClick={() => addProduct(product.id)}
                className="w-full rounded-xl border border-slate-200 p-3 text-left transition hover:border-teal-300 hover:bg-teal-50"
              >
                <p className="text-sm font-bold text-slate-900">
                  {product.name}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Stock: {product.stock} ·{" "}
                  {product.batchNumber
                    ? `Batch: ${product.batchNumber}`
                    : product.unit}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm font-bold text-teal-800">
                    {rupees.format(product.price)}
                  </span>
                  <span className="rounded-lg bg-teal-800 px-2 py-1 text-[11px] font-bold text-white">
                    + Add
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
        {error && (
          <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {notice && (
          <p className="rounded-xl bg-teal-50 p-3 text-sm text-teal-800">
            {notice}
          </p>
        )}
      </aside>
    </form>
  );
}

function MedicineResult({
  product,
  onAdd,
}: {
  product: Product;
  onAdd: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-3 last:border-b-0">
      <div>
        <p className="text-sm font-bold text-slate-900">{product.name}</p>
        <p className="mt-1 text-xs text-slate-500">
          {product.genericName} ·{" "}
          {product.batchNumber ? `Batch: ${product.batchNumber}` : product.unit}{" "}
          ·{" "}
          {product.expiryDate
            ? `Exp: ${new Date(product.expiryDate).toLocaleDateString("en-IN", { month: "2-digit", year: "2-digit" })}`
            : "No expiry recorded"}{" "}
          · Stock: {product.stock}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-bold text-amber-700">
          {rupees.format(product.price)}
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="mt-1 rounded-lg bg-teal-800 px-2.5 py-1.5 text-xs font-bold text-white"
        >
          + Add
        </button>
      </div>
    </div>
  );
}

function BillRow({
  product,
  qty,
  onQuantity,
  onRemove,
}: {
  product: Product;
  qty: number;
  onQuantity: (qty: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-3 last:border-b-0">
      <div>
        <p className="text-sm font-bold text-slate-900">{product.name}</p>
        <p className="mt-1 text-xs text-slate-500">
          {product.batchNumber ? `Batch: ${product.batchNumber} · ` : ""}
          {rupees.format(product.price)} each · {product.stock} available
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onQuantity(qty - 1)}
          className="rounded-lg border border-slate-200 p-1.5"
        >
          <Minus size={14} />
        </button>
        <span className="min-w-7 text-center text-sm font-bold">{qty}</span>
        <button
          type="button"
          disabled={qty >= product.stock}
          onClick={() => onQuantity(qty + 1)}
          className="rounded-lg border border-slate-200 p-1.5 disabled:opacity-40"
        >
          <Plus size={14} />
        </button>
        <strong className="ml-2 text-sm">
          {rupees.format(product.price * qty)}
        </strong>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${product.name}`}
          className="ml-1 text-red-600"
        >
          <Trash2 size={17} />
        </button>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
