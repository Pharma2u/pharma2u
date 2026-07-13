"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  createProduct,
  deactivateProduct,
  getMyPharmacy,
  listProducts,
  updateStock,
  type Pharmacy,
  type Product,
  type ProductCategory,
} from "@/lib/authApi";

const categories: ProductCategory[] = ["otc", "prescription", "schedule_h"];

export function InventoryPanel({ token }: { token: string }) {
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  const activeProducts = products.filter((product) => product.isActive).length;
  const lowStockProducts = products.filter(
    (product) => product.isActive && product.stock < 10,
  ).length;
  const totalUnits = products.reduce(
    (total, product) => total + product.stock,
    0,
  );

  async function refresh() {
    setLoading(true);
    try {
      const [pharmacyData, productData] = await Promise.all([
        getMyPharmacy(token),
        listProducts(token, search, category),
      ]);
      setPharmacy(pharmacyData);
      setProducts(productData.items);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to load inventory.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function addProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await createProduct(token, {
        name: String(form.get("name")),
        genericName: String(form.get("genericName")),
        category: String(form.get("category")) as ProductCategory,
        price: Number(form.get("price")),
        stock: Number(form.get("stock")),
        unit: String(form.get("unit")),
      });
      event.currentTarget.reset();
      setNotice("Product added to your inventory.");
      await refresh();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to add product.",
      );
    }
  }

  async function changeStock(product: Product) {
    const value = window.prompt(
      `Set stock for ${product.name}`,
      String(product.stock),
    );
    if (value === null) return;
    const stock = Number(value);
    if (!Number.isInteger(stock) || stock < 0) {
      setError("Stock must be a non-negative whole number.");
      return;
    }
    try {
      await updateStock(token, product.id, stock);
      setNotice("Stock updated.");
      await refresh();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to update stock.",
      );
    }
  }

  async function deactivate(product: Product) {
    if (!window.confirm(`Remove ${product.name} from active inventory?`))
      return;
    try {
      await deactivateProduct(token, product.id);
      setNotice("Product deactivated.");
      await refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to deactivate product.",
      );
    }
  }

  return (
    <section className="mx-auto mt-8 max-w-6xl space-y-6">
      {pharmacy && (
        <div className="rounded-2xl border bg-white p-5">
          <p className="text-sm font-bold text-teal-600">YOUR PHARMACY</p>
          <h2 className="mt-1 text-xl font-bold">{pharmacy.name}</h2>
          <p className="text-slate-600">
            {pharmacy.address} · {pharmacy.isOpen ? "Open" : "Closed"}
          </p>
        </div>
      )}
      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-red-700">{error}</p>
      )}
      {notice && (
        <p className="rounded-xl bg-emerald-50 p-3 text-emerald-800">
          {notice}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <DashboardMetric
          label="Active products"
          value={activeProducts}
          detail="Visible to customers"
        />
        <DashboardMetric
          label="Low-stock products"
          value={lowStockProducts}
          detail="Below 10 units"
          tone="amber"
        />
        <DashboardMetric
          label="Units on hand"
          value={totalUnits}
          detail="Across current results"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form
          onSubmit={addProduct}
          className="rounded-2xl bg-white p-5 shadow-sm"
        >
          <p className="text-sm font-bold text-teal-600">CATALOG</p>
          <h2 className="mt-1 text-xl font-bold">Add a product</h2>
          <div className="mt-4 grid gap-3">
            <input required name="name" placeholder="Product name" />
            <input required name="genericName" placeholder="Generic name" />
            <select required name="category">
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <input
              required
              min="0.01"
              step="0.01"
              name="price"
              type="number"
              placeholder="Price"
            />
            <input
              required
              min="0"
              step="1"
              name="stock"
              type="number"
              placeholder="Stock"
            />
            <input
              required
              name="unit"
              placeholder="Unit (strip, bottle, etc.)"
            />
            <button className="rounded-xl bg-teal-500 p-3 font-semibold">
              Add product
            </button>
          </div>
        </form>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-teal-600">INVENTORY</p>
              <h2 className="mt-1 text-xl font-bold">Your products</h2>
            </div>
            <button
              onClick={() => void refresh()}
              className="rounded-xl border px-3 py-2 text-sm font-semibold"
            >
              Refresh
            </button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name or generic name"
            />
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => void refresh()}
            className="mt-3 text-sm font-semibold text-teal-700"
          >
            Apply filters
          </button>
          {loading ? (
            <p className="mt-6 text-slate-500">Loading inventory…</p>
          ) : (
            <div className="mt-5 space-y-3">
              {products.length === 0 && (
                <p className="text-slate-500">
                  No products match these filters.
                </p>
              )}
              {products.map((product) => (
                <article
                  key={product.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4"
                >
                  <div>
                    <h3 className="font-bold">{product.name}</h3>
                    <p className="text-sm text-slate-500">
                      {product.genericName} · {product.category} · ₹
                      {product.price.toFixed(2)} / {product.unit}
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      Stock: {product.stock}{" "}
                      {product.isActive ? "" : "(inactive)"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => void changeStock(product)}
                      className="rounded-lg border px-3 py-2 text-sm font-semibold"
                    >
                      Update stock
                    </button>
                    {product.isActive && (
                      <button
                        onClick={() => void deactivate(product)}
                        className="rounded-lg border px-3 py-2 text-sm font-semibold text-red-700"
                      >
                        Deactivate
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function DashboardMetric({
  label,
  value,
  detail,
  tone = "green",
}: {
  label: string;
  value: number;
  detail: string;
  tone?: "green" | "amber";
}) {
  const color =
    tone === "amber"
      ? "border-amber-100 bg-amber-50"
      : "border-teal-100 bg-teal-50";
  return (
    <article className={`rounded-2xl border p-5 ${color}`}>
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{detail}</p>
    </article>
  );
}
