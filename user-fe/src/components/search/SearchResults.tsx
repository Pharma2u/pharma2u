"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  RotateCcw,
  SearchX,
  SlidersHorizontal,
  X,
} from "lucide-react";

import ProductCard from "@/src/components/medicine/ProductCard";
import { products } from "@/src/data/products";

interface SearchResultsProps {
  query: string;
}

type SortOption =
  | "recommended"
  | "price-low"
  | "price-high"
  | "discount";

export default function SearchResults({
  query,
}: SearchResultsProps) {
  const [prescriptionFilter, setPrescriptionFilter] = useState<
    "all" | "required" | "not-required"
  >("all");

  const [deliveryFilter, setDeliveryFilter] = useState<
    "all" | "10" | "15"
  >("all");

  const [discountFilter, setDiscountFilter] = useState<
    "all" | "10" | "20"
  >("all");

  const [sortOption, setSortOption] =
    useState<SortOption>("recommended");

  const [mobileFiltersOpen, setMobileFiltersOpen] =
    useState(false);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredProducts = useMemo(() => {
    let results = products.filter((product) => {
      const matchesSearch =
        !normalizedQuery ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.manufacturer.toLowerCase().includes(normalizedQuery) ||
        product.category.toLowerCase().includes(normalizedQuery);

      const matchesPrescription =
        prescriptionFilter === "all" ||
        (prescriptionFilter === "required" &&
          product.prescriptionRequired) ||
        (prescriptionFilter === "not-required" &&
          !product.prescriptionRequired);

      const deliveryMinutes = Number.parseInt(
        product.deliveryTime,
        10
      );

      const matchesDelivery =
        deliveryFilter === "all" ||
        (deliveryFilter === "10" &&
          deliveryMinutes <= 10) ||
        (deliveryFilter === "15" &&
          deliveryMinutes <= 15);

      const matchesDiscount =
        discountFilter === "all" ||
        (discountFilter === "10" &&
          product.discount >= 10) ||
        (discountFilter === "20" &&
          product.discount >= 20);

      return (
        matchesSearch &&
        matchesPrescription &&
        matchesDelivery &&
        matchesDiscount
      );
    });

    results = [...results];

    if (sortOption === "price-low") {
      results.sort((a, b) => a.price - b.price);
    }

    if (sortOption === "price-high") {
      results.sort((a, b) => b.price - a.price);
    }

    if (sortOption === "discount") {
      results.sort((a, b) => b.discount - a.discount);
    }

    return results;
  }, [
    normalizedQuery,
    prescriptionFilter,
    deliveryFilter,
    discountFilter,
    sortOption,
  ]);

  const resetFilters = () => {
    setPrescriptionFilter("all");
    setDeliveryFilter("all");
    setDiscountFilter("all");
    setSortOption("recommended");
  };

  const FilterContent = () => (
    <>
      {/* FILTER HEADER */}

      <div className="flex items-center justify-between border-b border-[#EDF0EF] px-5 py-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal
            size={18}
            className="text-[#2EB68F]"
          />

          <h2 className="text-sm font-bold text-[#17212B]">
            Filters
          </h2>
        </div>

        <button
          type="button"
          onClick={resetFilters}
          className="flex items-center gap-1 text-xs font-semibold text-[#8B949E] transition hover:text-[#2EB68F]"
        >
          <RotateCcw size={13} />

          Reset
        </button>
      </div>

      {/* PRESCRIPTION */}

      <div className="border-b border-[#EDF0EF] p-5">
        <h3 className="text-sm font-bold text-[#17212B]">
          Prescription
        </h3>

        <div className="mt-4 space-y-3">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="radio"
              name="prescription"
              checked={prescriptionFilter === "all"}
              onChange={() => setPrescriptionFilter("all")}
              className="h-4 w-4 accent-[#45C9A5]"
            />

            <span className="text-sm text-[#64717D]">
              All products
            </span>
          </label>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="radio"
              name="prescription"
              checked={
                prescriptionFilter === "not-required"
              }
              onChange={() =>
                setPrescriptionFilter("not-required")
              }
              className="h-4 w-4 accent-[#45C9A5]"
            />

            <span className="text-sm text-[#64717D]">
              Prescription not required
            </span>
          </label>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="radio"
              name="prescription"
              checked={prescriptionFilter === "required"}
              onChange={() =>
                setPrescriptionFilter("required")
              }
              className="h-4 w-4 accent-[#45C9A5]"
            />

            <span className="text-sm text-[#64717D]">
              Prescription required
            </span>
          </label>
        </div>
      </div>

      {/* DELIVERY */}

      <div className="border-b border-[#EDF0EF] p-5">
        <h3 className="text-sm font-bold text-[#17212B]">
          Delivery time
        </h3>

        <div className="mt-4 space-y-3">
          {[
            ["all", "Any delivery time"],
            ["10", "Within 10 minutes"],
            ["15", "Within 15 minutes"],
          ].map(([value, label]) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-3"
            >
              <input
                type="radio"
                name="delivery"
                checked={deliveryFilter === value}
                onChange={() =>
                  setDeliveryFilter(
                    value as "all" | "10" | "15"
                  )
                }
                className="h-4 w-4 accent-[#45C9A5]"
              />

              <span className="text-sm text-[#64717D]">
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* DISCOUNT */}

      <div className="p-5">
        <h3 className="text-sm font-bold text-[#17212B]">
          Discount
        </h3>

        <div className="mt-4 space-y-3">
          {[
            ["all", "All discounts"],
            ["10", "10% and above"],
            ["20", "20% and above"],
          ].map(([value, label]) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-3"
            >
              <input
                type="radio"
                name="discount"
                checked={discountFilter === value}
                onChange={() =>
                  setDiscountFilter(
                    value as "all" | "10" | "20"
                  )
                }
                className="h-4 w-4 accent-[#45C9A5]"
              />

              <span className="text-sm text-[#64717D]">
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* TOOLBAR */}

      <div className="mb-6 flex items-center justify-between gap-3">
        <p className="text-sm text-[#64717D]">
          Showing{" "}
          <span className="font-bold text-[#17212B]">
            {filteredProducts.length}{" "}
            {filteredProducts.length === 1
              ? "product"
              : "products"}
          </span>
        </p>

        <div className="flex items-center gap-2">

          {/* MOBILE FILTER */}

          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="flex h-10 items-center gap-2 rounded-xl border border-[#DDE5E2] bg-white px-3 text-xs font-semibold text-[#17212B] md:hidden"
          >
            <SlidersHorizontal size={15} />

            Filters
          </button>

          {/* SORT */}

          <div className="relative">
            <select
              value={sortOption}
              onChange={(event) =>
                setSortOption(
                  event.target.value as SortOption
                )
              }
              className="h-10 appearance-none rounded-xl border border-[#DDE5E2] bg-white pl-3 pr-9 text-xs font-semibold text-[#17212B] outline-none transition focus:border-[#45C9A5] sm:h-11 sm:text-sm"
            >
              <option value="recommended">
                Recommended
              </option>

              <option value="price-low">
                Price: Low to High
              </option>

              <option value="price-high">
                Price: High to Low
              </option>

              <option value="discount">
                Highest Discount
              </option>
            </select>

            <ChevronDown
              size={15}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#64717D]"
            />
          </div>
        </div>
      </div>

      {/* DESKTOP LAYOUT */}

      <div className="grid items-start gap-6 md:grid-cols-[240px_minmax(0,1fr)] lg:grid-cols-[260px_minmax(0,1fr)]">

        {/* DESKTOP FILTERS */}

        <aside className="sticky top-[100px] hidden overflow-hidden rounded-2xl border border-[#E5EAE8] bg-white md:block">
          <FilterContent />
        </aside>

        {/* PRODUCTS */}

        <div>
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
          ) : (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-[#E5EAE8] bg-white px-6 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#EAFAF5]">
                <SearchX
                  size={34}
                  className="text-[#2EB68F]"
                />
              </div>

              <h2 className="mt-5 text-xl font-bold text-[#17212B]">
                No products found
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-[#6B7280]">
                No products match your search and selected
                filters.
              </p>

              <button
                type="button"
                onClick={resetFilters}
                className="mt-5 rounded-xl bg-[#45C9A5] px-5 py-3 text-sm font-bold text-[#17212B]"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE FILTER DRAWER */}

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">

          {/* OVERLAY */}

          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setMobileFiltersOpen(false)}
            className="absolute inset-0 bg-[#17212B]/40"
          />

          {/* DRAWER */}

          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-[28px] bg-white shadow-2xl">

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#EDF0EF] bg-white px-5 py-4">
              <h2 className="text-lg font-bold text-[#17212B]">
                Filter products
              </h2>

              <button
                type="button"
                onClick={() =>
                  setMobileFiltersOpen(false)
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F4F7F6] text-[#17212B]"
              >
                <X size={19} />
              </button>
            </div>

            <FilterContent />

            <div className="sticky bottom-0 border-t border-[#EDF0EF] bg-white p-4">
              <button
                type="button"
                onClick={() =>
                  setMobileFiltersOpen(false)
                }
                className="flex h-12 w-full items-center justify-center rounded-xl bg-[#45C9A5] text-sm font-bold text-[#17212B]"
              >
                Show {filteredProducts.length}{" "}
                {filteredProducts.length === 1
                  ? "product"
                  : "products"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}