"use client";

import {
  BadgeIndianRupee,
  Boxes,
  ChevronRight,
  ImagePlus,
  PackageCheck,
  Pill,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import type {
  ChangeEvent,
  FormEvent,
  InputHTMLAttributes,
  ReactNode,
} from "react";
import {
  productCategories as categories,
  productCategoryLabels as labels,
} from "./productConfig";

const control =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10";

function Field({
  label,
  optional = false,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  optional?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      <span>
        {label}
        {optional ? (
          <span className="ml-1.5 text-xs font-medium text-slate-400">
            Optional
          </span>
        ) : (
          <span className="ml-1 text-rose-500" aria-hidden="true">
            *
          </span>
        )}
      </span>
      <input
        required={!optional}
        {...props}
        className={`${control} ${props.className ?? ""}`}
      />
    </label>
  );
}

function Section({
  number,
  icon,
  title,
  description,
  children,
}: {
  number: string;
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
          {icon}
        </div>
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-emerald-700">
            Step {number}
          </span>
          <h2 className="mt-0.5 text-lg font-bold text-slate-950">{title}</h2>
          <p className="mt-0.5 text-sm leading-5 text-slate-500">
            {description}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}

export function AddProductForm({
  adding,
  images,
  onSubmit,
  onImagesSelected,
  onReset,
}: {
  adding: boolean;
  images: File[];
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onImagesSelected: (event: ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-cyan-50 shadow-sm">
        <div className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-center lg:p-6">
          <div className="flex items-start gap-4">
            <div className="hidden h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-700 text-white shadow-lg shadow-emerald-700/15 sm:grid">
              <Sparkles size={22} />
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-700">
                Quick catalogue setup
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                Add one medicine to your pharmacy
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Start with the medicine and selling details. Add batch, expiry,
                images and customer information where available.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            {["Medicine", "Stock & pricing", "Review & add"].map(
              (step, index) => (
                <div key={step} className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-2 ${index === 0 ? "bg-emerald-700 text-white" : "border border-slate-200 bg-white text-slate-600"}`}
                  >
                    {index + 1}. {step}
                  </span>
                  {index < 2 && (
                    <ChevronRight
                      size={14}
                      className="hidden text-slate-300 sm:block"
                    />
                  )}
                </div>
              ),
            )}
          </div>
        </div>
      </div>

      <Section
        number="01"
        icon={<Pill size={20} />}
        title="Medicine information"
        description="The main details used to identify this product in your catalogue."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field name="name" label="Product name" placeholder="e.g. Dolo 650" />
          <Field
            name="genericName"
            label="Generic name"
            placeholder="e.g. Paracetamol"
          />
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            <span>
              Category<span className="ml-1 text-rose-500">*</span>
            </span>
            <select
              required
              name="category"
              defaultValue="otc"
              className={control}
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {labels[item]}
                </option>
              ))}
            </select>
          </label>
          <Field
            name="manufacturer"
            label="Manufacturer"
            placeholder="e.g. Micro Labs"
            optional
          />
          <Field
            name="saltComposition"
            label="Salt composition"
            placeholder="e.g. Paracetamol 650 mg"
            optional
          />
          <Field
            name="packSize"
            label="Pack size"
            placeholder="e.g. 15 tablets"
            optional
          />
        </div>
      </Section>

      <Section
        number="02"
        icon={<BadgeIndianRupee size={20} />}
        title="Pricing and opening stock"
        description="Set the customer price and the quantity currently available to sell."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Field
            name="price"
            label="Selling price (INR)"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
          />
          <Field
            name="mrp"
            label="MRP (INR)"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            optional
          />
          <Field
            name="discount"
            label="Discount (%)"
            type="number"
            min="0"
            max="100"
            step="0.01"
            placeholder="0"
            optional
          />
          <Field
            name="stock"
            label="Opening stock"
            type="number"
            min="0"
            step="1"
            placeholder="0"
          />
          <Field
            name="unit"
            label="Selling unit"
            placeholder="Strip, bottle, box"
          />
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 px-3.5 py-3 text-xs leading-5 text-amber-800">
          <Boxes size={16} className="mt-0.5 shrink-0" />
          MRP must be equal to or higher than the selling price. Opening stock
          is the quantity available immediately after saving.
        </div>
      </Section>

      <Section
        number="03"
        icon={<PackageCheck size={20} />}
        title="Batch and fulfilment"
        description="Useful traceability and delivery details for pharmacy operations."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field
            name="batchNumber"
            label="Batch / lot number"
            placeholder="e.g. PCM-2607-A"
            optional
          />
          <Field name="expiryDate" label="Expiry date" type="date" optional />
          <Field
            name="storageInstructions"
            label="Storage instructions"
            placeholder="e.g. Store below 25°C"
            optional
          />
          <Field
            name="deliveryTime"
            label="Delivery time (minutes)"
            type="number"
            min="0"
            step="1"
            placeholder="30"
            optional
          />
        </div>
      </Section>

      <Section
        number="04"
        icon={<ImagePlus size={20} />}
        title="Customer-facing details"
        description="Help customers recognise the medicine and understand the listing."
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <label className="group grid min-h-32 cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 px-5 py-6 text-center transition hover:border-emerald-300 hover:bg-emerald-50/40">
            <input
              name="images"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={onImagesSelected}
              className="sr-only"
            />
            <span>
              <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-white text-emerald-700 shadow-sm">
                <ImagePlus size={20} />
              </span>
              <span className="mt-3 block text-sm font-bold text-slate-800">
                {images.length
                  ? `${images.length} image${images.length === 1 ? "" : "s"} selected`
                  : "Choose product images"}
              </span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">
                Up to 10 JPEG, PNG or WebP files · 5 MB each
              </span>
              {images.length > 0 && (
                <span className="mt-2 block max-w-lg truncate text-xs font-medium text-emerald-700">
                  {images.map((image) => image.name).join(", ")}
                </span>
              )}
            </span>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            <span>
              Product description
              <span className="ml-1.5 text-xs font-medium text-slate-400">
                Optional
              </span>
            </span>
            <textarea
              name="description"
              rows={5}
              className="min-h-32 w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-normal text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              placeholder="Add a short customer-friendly description, usage notes or important product information."
            />
          </label>
        </div>
      </Section>

      <div className="sticky bottom-3 z-10 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl shadow-slate-900/10 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-slate-500">
          Fields marked <span className="font-bold text-rose-500">*</span> are
          required. You can edit the product later.
        </p>
        <div className="flex gap-2">
          <button
            type="reset"
            onClick={onReset}
            disabled={adding}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 sm:flex-none"
          >
            <RotateCcw size={16} />
            Clear
          </button>
          <button
            type="submit"
            disabled={adding}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 text-sm font-bold text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 disabled:cursor-wait disabled:opacity-60 sm:flex-none"
          >
            <PackageCheck size={17} />
            {adding ? "Adding product..." : "Add product"}
          </button>
        </div>
      </div>
    </form>
  );
}
