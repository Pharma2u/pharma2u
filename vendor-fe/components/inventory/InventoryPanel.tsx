"use client";

import { ChangeEvent, Dispatch, FormEvent, SetStateAction, useEffect, useMemo, useRef, useState } from "react";
import { ProductImage, ProductImageGallery, ProductRow } from "./ProductDisplay";
import { productCategories as categories, productCategoryLabels as labels } from "./productConfig";
import { Dialog, FormActions } from "./shared/Dialog";
import { InputField, MetricCard } from "./shared/Fields";
import {
  createProduct,
  deactivateProduct,
  getMyPharmacy,
  listProducts,
  setMyPharmacyOpenStatus,
  updateStock,
  updateProduct,
  updateMyPharmacyProfile,
  type Pharmacy,
  type Product,
  type ProductCategory,
} from "@/lib/authApi";

export function InventoryPanel({
  token,
  startAdding = false,
  showCatalogue = true,
  profileOnly = false,
  showPharmacyProfile = true,
}: {
  token: string;
  startAdding?: boolean;
  showCatalogue?: boolean;
  profileOnly?: boolean;
  showPharmacyProfile?: boolean;
}) {
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingPharmacyStatus, setUpdatingPharmacyStatus] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [showForm, setShowForm] = useState(startAdding);
  const [adding, setAdding] = useState(false);
  const [newProductImages, setNewProductImages] = useState<File[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [editProductImages, setEditProductImages] = useState<File[]>([]);
  const [savingStock, setSavingStock] = useState(false);
  const [stock, setStock] = useState("");
  const [removing, setRemoving] = useState<Product | null>(null);
  const loadRequestId = useRef(0);
  const metrics = useMemo(
    () => ({
      active: products.filter((p) => p.isActive).length,
      low: products.filter((p) => p.isActive && p.stock < 10).length,
      units: products.reduce((sum, p) => sum + p.stock, 0),
    }),
    [products],
  );


  
  async function load(query = search, filter = category) {
    const requestId = ++loadRequestId.current;
    setLoading(true);
    try {
      const result = await listProducts(token, query, filter);
      if (requestId === loadRequestId.current) setProducts(result.items);
    } catch (caught) {
      if (requestId === loadRequestId.current)
        setError(
          caught instanceof Error ? caught.message : "Unable to load inventory.",
        );
    } finally {
      if (requestId === loadRequestId.current) setLoading(false);
    }
  }
  useEffect(() => {
    void getMyPharmacy(token)
      .then(setPharmacy)
      .catch((caught) =>
        setError(
          caught instanceof Error ? caught.message : "Unable to load pharmacy.",
        ),
      );
  }, [token]);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(search, category), 250);
    return () => window.clearTimeout(timer); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, search, category]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);
  async function savePharmacyProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingProfile(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const updated = await updateMyPharmacyProfile(token, {
        name: String(form.get("pharmacyName")).trim(), address: String(form.get("pharmacyAddress")).trim(),
        openingTime: String(form.get("openingTime")), closingTime: String(form.get("closingTime")),
        operatingDays: form.getAll("operatingDays").map(String),
        logo: form.get("logo") instanceof File && (form.get("logo") as File).size ? form.get("logo") as File : undefined,
        banner: form.get("banner") instanceof File && (form.get("banner") as File).size ? form.get("banner") as File : undefined,
      });
      setPharmacy(updated); setNotice("Pharmacy profile updated.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to update pharmacy profile."); }
    finally { setSavingProfile(false); }
  }
  async function togglePharmacyStatus() {
    if (!pharmacy || updatingPharmacyStatus) return;
    setError("");
    setUpdatingPharmacyStatus(true);
    try {
      const updated = await setMyPharmacyOpenStatus(token, !pharmacy.isOpen);
      setPharmacy(updated);
      setNotice(
        updated.isOpen
          ? "Your pharmacy is now open for customer orders."
          : "Your pharmacy is now closed for new customer orders.",
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to update pharmacy status.",
      );
    } finally {
      setUpdatingPharmacyStatus(false);
    }
  }


  function selectProductImages(
    event: ChangeEvent<HTMLInputElement>,
    setImages: Dispatch<SetStateAction<File[]>>,
  ) {
    const images = Array.from(event.currentTarget.files ?? []);
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const invalid = images.find(
      (image) => !allowedTypes.includes(image.type) || image.size > 5 * 1024 * 1024,
    );
    if (images.length > 10 || invalid) {
      event.currentTarget.value = "";
      setImages([]);
      setError(
        images.length > 10
          ? "Choose up to 10 product images."
          : "Each image must be a JPEG, PNG, or WebP file no larger than 5 MB.",
      );
      return;
    }
    setError("");
    setImages(images);
  }


  
  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setAdding(true);
    setError("");
    try {
      await createProduct(token, {
        name: String(form.get("name")).trim(),
        genericName: String(form.get("genericName")).trim(),
        category: String(form.get("category")) as ProductCategory,
        price: Number(form.get("price")),
        stock: Number(form.get("stock")),
        unit: String(form.get("unit")).trim(),
        description: String(form.get("description") ?? "").trim() || undefined,
        manufacturer:
          String(form.get("manufacturer") ?? "").trim() || undefined,
        packSize: String(form.get("packSize") ?? "").trim() || undefined,
        mrp: form.get("mrp") ? Number(form.get("mrp")) : undefined,
        discount: form.get("discount")
          ? Number(form.get("discount"))
          : undefined,
        saltComposition:
          String(form.get("saltComposition") ?? "").trim() || undefined,
        storageInstructions:
          String(form.get("storageInstructions") ?? "").trim() || undefined,
        deliveryTime: form.get("deliveryTime")
          ? Number(form.get("deliveryTime"))
          : undefined,
        expiryDate: String(form.get("expiryDate") ?? "") || undefined,
        batchNumber: String(form.get("batchNumber") ?? "").trim() || undefined,
        images: form
          .getAll("images")
          .filter(
            (value): value is File => value instanceof File && value.size > 0,
          ),
      });
      setNewProductImages([]);
      setShowForm(false);
      setNotice("Product added to inventory.");
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to add product.",
      );
    } finally {
      setAdding(false);
    }
  }



  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!productToEdit) return;
    const form = new FormData(event.currentTarget);
    setSavingProduct(true);
    setError("");
    try {
      // Do not allow a list request that started before this save to overwrite it.
      ++loadRequestId.current;
      const updated = await updateProduct(token, productToEdit.id, {
        name: String(form.get("name")).trim(),
        genericName: String(form.get("genericName")).trim(),
        category: String(form.get("category")) as ProductCategory,
        price: Number(form.get("price")),
        stock: Number(form.get("stock")),
        unit: String(form.get("unit")).trim(),
        description: String(form.get("description") ?? "").trim() || undefined,
        manufacturer:
          String(form.get("manufacturer") ?? "").trim() || undefined,
        packSize: String(form.get("packSize") ?? "").trim() || undefined,
        mrp: form.get("mrp") ? Number(form.get("mrp")) : undefined,
        discount: form.get("discount")
          ? Number(form.get("discount"))
          : undefined,
        saltComposition:
          String(form.get("saltComposition") ?? "").trim() || undefined,
        storageInstructions:
          String(form.get("storageInstructions") ?? "").trim() || undefined,
        deliveryTime: form.get("deliveryTime")
          ? Number(form.get("deliveryTime"))
          : undefined,
        expiryDate: String(form.get("expiryDate") ?? "") || undefined,
        batchNumber: String(form.get("batchNumber") ?? "").trim() || undefined,
        images: form
          .getAll("images")
          .filter(
            (value): value is File => value instanceof File && value.size > 0,
          ),
      });
      setProducts((current) =>
        current.map((product) =>
          product.id === updated.id ? { ...product, ...updated } : product,
        ),
      );
      setProductToEdit(null);
      setNotice(`${productToEdit.name} updated.`);
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to update product.",
      );
    } finally {
      setSavingProduct(false);
    }
  }



  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(stock);
    if (!editing || !Number.isInteger(value) || value < 0) {
      setError("Stock must be a non-negative whole number.");
      return;
    }
    setSavingStock(true);
    setError("");
    try {
      // Stock is an absolute value. Show the confirmed API response immediately
      // and invalidate any older list request that could contain stale stock.
      ++loadRequestId.current;
      const updated = await updateStock(token, editing.id, value);
      setProducts((current) =>
        current.map((product) =>
          product.id === updated.id ? { ...product, ...updated } : product,
        ),
      );
      setNotice(`${editing.name} stock updated.`);
      setEditing(null);
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to update stock.",
      );
    } finally {
      setSavingStock(false);
    }
  }


  async function deactivate() {
    if (!removing) return;
    try {
      await deactivateProduct(token, removing.id);
      setNotice(`${removing.name} is no longer visible to customers.`);
      setRemoving(null);
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to deactivate product.",
      );
    }
  }



  return (
    <section className="mt-6 space-y-5">
      {showPharmacyProfile && pharmacy && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-teal-700">
              YOUR PHARMACY
            </p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">
              {pharmacy.name}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{pharmacy.address}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${pharmacy.isOpen ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
          >
            {pharmacy.isOpen ? "Open for orders" : "Currently closed"}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={pharmacy.isOpen}
            aria-label={pharmacy.isOpen ? "Close pharmacy for orders" : "Open pharmacy for orders"}
            disabled={updatingPharmacyStatus}
            onClick={() => void togglePharmacyStatus()}
            className={`relative ml-3 inline-flex h-8 w-14 shrink-0 items-center rounded-full transition focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${pharmacy.isOpen ? "bg-teal-600" : "bg-slate-300"}`}
          >
            <span className={`inline-block h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${pharmacy.isOpen ? "translate-x-7" : "translate-x-1"}`} />
            <span className="sr-only">
              {updatingPharmacyStatus ? "Updating pharmacy status" : "Toggle pharmacy status"}
            </span>
          </button>
        </div>
      )}
      {showPharmacyProfile && pharmacy && (
        <form onSubmit={savePharmacyProfile} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2">
          <div className="md:col-span-2"><p className="text-xs font-bold tracking-[0.16em] text-teal-700">PHARMACY PROFILE</p><h2 className="mt-1 text-lg font-bold text-slate-900">Store details customers will see</h2></div>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">Pharmacy name<input name="pharmacyName" required defaultValue={pharmacy.name} className="rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">Address<input name="pharmacyAddress" required defaultValue={pharmacy.address} className="rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">Opening time<input name="openingTime" required type="time" defaultValue={pharmacy.openingTime ?? "09:00"} className="rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">Closing time<input name="closingTime" required type="time" defaultValue={pharmacy.closingTime ?? "21:00"} className="rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">Pharmacy logo{pharmacy.logoPath && <img src={pharmacy.logoPath} alt="Current pharmacy logo" className="h-16 w-16 rounded-xl border border-slate-200 object-cover" />}<input name="logo" type="file" accept="image/jpeg,image/png,image/webp" className="rounded-xl border border-slate-200 px-3 py-2 font-normal" /></label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">Cover image{pharmacy.bannerPath && <img src={pharmacy.bannerPath} alt="Current pharmacy cover" className="h-20 w-full rounded-xl border border-slate-200 object-cover" />}<input name="banner" type="file" accept="image/jpeg,image/png,image/webp" className="rounded-xl border border-slate-200 px-3 py-2 font-normal" /></label>
          <fieldset className="md:col-span-2"><legend className="text-sm font-semibold text-slate-700">Operating days</legend><div className="mt-2 flex flex-wrap gap-3">{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((day) => <label key={day} className="flex items-center gap-1.5 text-sm text-slate-600"><input name="operatingDays" type="checkbox" value={day} defaultChecked={pharmacy.operatingDays?.includes(day) ?? ["Mon","Tue","Wed","Thu","Fri","Sat"].includes(day)} />{day}</label>)}</div></fieldset>
          <div className="flex justify-end md:col-span-2"><button disabled={savingProfile} className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{savingProfile ? "Saving..." : "Save pharmacy profile"}</button></div>
        </form>
      )}      {(error || notice) && (
        <div
          role="status"
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${error ? "border-red-100 bg-red-50 text-red-700" : "border-emerald-100 bg-emerald-50 text-emerald-800"}`}
        >
          {error || notice}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Active products"
          value={metrics.active}
          detail="Available to customers"
        />
        <MetricCard
          label="Low stock"
          value={metrics.low}
          detail="Less than 10 units"
          amber
        />
        <MetricCard
          label="Units in stock"
          value={metrics.units}
          detail="Across filtered products"
        />
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5">
          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-teal-700">
              INVENTORY
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">
              Product catalogue
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Search products, update stock, and edit catalogue details.
            </p>
          </div>
        </div>
        {showForm && (
          <form
            onSubmit={add}
            className="grid gap-3 border-y border-slate-100 bg-slate-50 p-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            <InputField
              name="name"
              label="Product name"
              placeholder="e.g. Paracetamol 650"
            />
            <InputField
              name="genericName"
              label="Generic name"
              placeholder="e.g. Paracetamol"
            />
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
              <span>
                Category{" "}
                <span className="text-red-600" aria-hidden="true">
                  *
                </span>
                <span className="sr-only"> required</span>
              </span>
              <select
                required
                name="category"
                defaultValue="otc"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5"
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {labels[item]}
                  </option>
                ))}
              </select>
            </label>
            <InputField
              name="price"
              label="Price (INR)"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
            />
            <InputField
              name="stock"
              label="Opening stock"
              type="number"
              min="0"
              step="1"
              placeholder="0"
            />
            <InputField name="unit" label="Unit" placeholder="Strip, bottle, box" />
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
              Product images
              <input
                name="images"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => selectProductImages(event, setNewProductImages)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal"
              />
              <span className="text-xs font-normal leading-5 text-slate-500">
                Select up to 10 JPEG, PNG, or WebP images (5 MB each).
              </span>
              {newProductImages.length > 0 && (
                <span className="rounded-lg bg-teal-50 px-2.5 py-2 text-xs font-semibold leading-5 text-teal-800">
                  {newProductImages.length} image{newProductImages.length === 1 ? "" : "s"} selected: {newProductImages.map((image) => image.name).join(", ")}
                </span>
              )}
            </label>
            <InputField
              name="manufacturer"
              label="Manufacturer"
              placeholder="e.g. Cipla"
            />{" "}
            <InputField
              name="packSize"
              label="Pack size"
              placeholder="e.g. 10 tablets"
            />{" "}
            <InputField
              name="mrp"
              label="MRP (INR)"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
            />{" "}
            <InputField
              name="discount"
              label="Discount (%)"
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
            />{" "}
            <InputField
              name="saltComposition"
              label="Salt composition"
              placeholder="e.g. Paracetamol 650mg"
            />{" "}
            <InputField
              name="storageInstructions"
              label="Storage instructions"
              placeholder="e.g. Store below 25 degrees C"
            />{" "}
            <InputField
              name="deliveryTime"
              label="Delivery time (minutes)"
              type="number"
              min="0"
              step="1"
              placeholder="30"
            />
            <InputField name="expiryDate" label="Expiry date" type="date" />{" "}
            <InputField
              name="batchNumber"
              label="Batch / lot number"
              placeholder="e.g. BATCH-2026-01"
            />{" "}
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700 sm:col-span-2 lg:col-span-3">
              Description
              <textarea
                name="description"
                rows={3}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal"
                placeholder="Customer-facing medicine description"
              />
            </label>{" "}
            <div className="flex justify-end gap-3 sm:col-span-2 lg:col-span-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                disabled={adding}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {adding ? "Adding..." : "Add to catalogue"}
              </button>
            </div>
          </form>
        )}
        {showCatalogue && (
          <div className="p-5">
            <div className="grid gap-3 sm:grid-cols-[1fr_180px_auto]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search product or generic name"
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            />
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            >
              <option value="">All categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {labels[item]}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>
          {loading ? (
            <div className="mt-5 space-y-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-20 animate-pulse rounded-xl bg-slate-100"
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-14 text-center">
              <p className="font-semibold text-slate-800">No products found</p>
              <p className="mt-1 text-sm text-slate-500">
                Change the filters or add your first product.
              </p>
            </div>
          ) : (
            <section className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 sm:p-4">
              <div className="mb-3 flex items-center justify-between gap-3 px-1">
                <div>
                  <h3 className="font-bold text-slate-900">Your products</h3>
                  <p className="text-sm text-slate-500">Select a product to update its details or stock.</p>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600 shadow-sm">
                  {products.length} item{products.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                {products.map((product) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    onStock={() => {
                      setEditing(product);
                      setStock(String(product.stock));
                    }}
                    onRemove={() => setRemoving(product)}
                    onEdit={() => { setEditProductImages([]); setProductToEdit(product); }}
                  />
                ))}
              </div>
            </section>
            )}
          </div>
        )}
      </div>
      {productToEdit && (
        <Dialog title="Edit product" onClose={() => { setEditProductImages([]); setProductToEdit(null); }} wide>
          <form onSubmit={saveProduct} className="grid gap-4">
            <div className="flex items-center gap-3 rounded-xl border border-teal-100 bg-teal-50/60 p-3">
              <ProductImage product={productToEdit} large />
              <div className="min-w-0">
                <p className="truncate font-bold text-slate-900">{productToEdit.name}</p>
                <p className="mt-0.5 text-sm text-slate-600">{productToEdit.genericName} / {labels[productToEdit.category]}</p>
                <p className="mt-1 text-xs font-semibold text-teal-700">Current stock: {productToEdit.stock} {productToEdit.unit}</p>
              </div>
              <ProductImageGallery product={productToEdit} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
            <InputField
              name="name"
              label="Product name"
              defaultValue={productToEdit.name}
            />
            <InputField
              name="genericName"
              label="Generic name"
              defaultValue={productToEdit.genericName}
            />
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
              Category
              <select
                name="category"
                defaultValue={productToEdit.category}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5"
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {labels[item]}
                  </option>
                ))}
              </select>
            </label>
            <InputField
              name="price"
              label="Price (INR)"
              type="number"
              min="0.01"
              step="0.01"
              defaultValue={productToEdit.price}
            />
            <InputField
              name="stock"
              label="Stock"
              type="number"
              min="0"
              step="1"
              defaultValue={productToEdit.stock}
            />
            <InputField name="unit" label="Unit" defaultValue={productToEdit.unit} />
            <InputField
              name="manufacturer"
              label="Manufacturer"
              defaultValue={productToEdit.manufacturer ?? ""}
              required={false}
            />
            <InputField
              name="packSize"
              label="Pack size"
              defaultValue={productToEdit.packSize ?? ""}
              required={false}
            />
            <InputField
              name="mrp"
              label="MRP (INR)"
              type="number"
              min="0"
              step="0.01"
              defaultValue={productToEdit.mrp ?? ""}
              required={false}
            />
            <InputField
              name="discount"
              label="Discount (%)"
              type="number"
              min="0"
              step="0.01"
              defaultValue={productToEdit.discount ?? ""}
              required={false}
            />
            <InputField
              name="saltComposition"
              label="Salt composition"
              defaultValue={productToEdit.saltComposition ?? ""}
              required={false}
            />
            <InputField
              name="storageInstructions"
              label="Storage instructions"
              defaultValue={productToEdit.storageInstructions ?? ""}
              required={false}
            />
            <InputField
              name="deliveryTime"
              label="Delivery time (minutes)"
              type="number"
              min="0"
              step="1"
              defaultValue={productToEdit.deliveryTime ?? ""}
              required={false}
            />
            <InputField
              name="expiryDate"
              label="Expiry date"
              type="date"
              defaultValue={productToEdit.expiryDate?.slice(0, 10) ?? ""}
              required={false}
            />
            <InputField
              name="batchNumber"
              label="Batch / lot number"
              defaultValue={productToEdit.batchNumber ?? ""}
              required={false}
            />
            </div>
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
              Description
              <textarea
                name="description"
                rows={3}
                defaultValue={productToEdit.description ?? ""}
                className="rounded-xl border border-slate-200 px-3 py-2.5 font-normal"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
              Replace product images
              <input
                name="images"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => selectProductImages(event, setEditProductImages)}
                className="rounded-xl border border-slate-200 px-3 py-2.5 font-normal"
              />
              <span className="text-xs font-normal leading-5 text-slate-500">
                Leave empty to keep the current gallery. Choosing images replaces the full gallery.
              </span>
              {editProductImages.length > 0 && (
                <span className="rounded-lg bg-teal-50 px-2.5 py-2 text-xs font-semibold leading-5 text-teal-800">
                  {editProductImages.length} replacement image{editProductImages.length === 1 ? "" : "s"} selected: {editProductImages.map((image) => image.name).join(", ")}
                </span>
              )}
            </label>
            <FormActions
              onClose={() => { setEditProductImages([]); setProductToEdit(null); }}
              label={savingProduct ? "Saving..." : "Save product"}
              disabled={savingProduct}
            />
          </form>
        </Dialog>
      )}
      {editing && (
        <Dialog title="Update stock" onClose={() => setEditing(null)}>
          <form onSubmit={save}>
            <p className="text-sm text-slate-600">
              Set available units for <b>{editing.name}</b>.
            </p>
            <input
              autoFocus
              required
              min="0"
              step="1"
              type="number"
              value={stock}
              onChange={(event) => setStock(event.target.value)}
              className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2.5"
            />
            <FormActions
              onClose={() => setEditing(null)}
              label={savingStock ? "Saving..." : "Save stock"}
              disabled={savingStock}
            />
          </form>
        </Dialog>
      )}
      {removing && (
        <Dialog title="Deactivate product?" onClose={() => setRemoving(null)}>
          <p className="text-sm leading-6 text-slate-600">
            <b>{removing.name}</b> will be hidden from customers and no longer
            be sold.
          </p>
          <FormActions
            onClose={() => setRemoving(null)}
            label="Deactivate"
            destructive
            action={deactivate}
          />
        </Dialog>
      )}
    </section>
  );
}
