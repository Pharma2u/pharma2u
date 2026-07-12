"use client";

import Link from "next/link";

import {
  ArrowLeft,
  Clock3,
  ImageIcon,
  MapPin,
  Minus,
  Plus,
  ShoppingBag,
  Store,
  Trash2,
} from "lucide-react";

import { useCartStore } from "@/src/store/cartStore";

export default function CartContent() {
  const items = useCartStore((state) => state.items);

  const increaseQuantity = useCartStore(
    (state) => state.increaseQuantity
  );

  const decreaseQuantity = useCartStore(
    (state) => state.decreaseQuantity
  );

  const removeItem = useCartStore(
    (state) => state.removeItem
  );

  const clearCart = useCartStore(
    (state) => state.clearCart
  );

  /*
   * CART CALCULATIONS
   */

  const subtotal = items.reduce(
    (total, item) =>
      total + item.unitPrice * item.quantity,
    0
  );

  const totalMRP = items.reduce(
    (total, item) =>
      total + item.product.mrp * item.quantity,
    0
  );

  const savings = Math.max(0, totalMRP - subtotal);

  const totalItems = items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  /*
   * FASTEST DELIVERY
   */

  const deliveryTimes = items
    .map((item) => item.pharmacy?.deliveryTime)
    .filter(
      (deliveryTime): deliveryTime is number =>
        deliveryTime !== undefined
    );

  const estimatedDeliveryTime =
    deliveryTimes.length > 0
      ? Math.max(...deliveryTimes)
      : null;

  /*
   * EMPTY CART
   */

  if (items.length === 0) {
    return (
      <div className="flex min-h-[560px] flex-col items-center justify-center px-5 text-center">

        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#EAFAF5]">
          <ShoppingBag
            size={40}
            strokeWidth={1.5}
            className="text-[#2EB68F]"
          />
        </div>

        <h1 className="mt-6 text-2xl font-bold text-[#17212B]">
          Your cart is empty
        </h1>

        <p className="mt-2 max-w-md text-sm leading-6 text-[#64717D]">
          Add medicines and healthcare products to your cart
          to continue with your order.
        </p>

        <Link
          href="/search"
          className="mt-6 flex h-12 items-center justify-center gap-2 rounded-xl bg-[#45C9A5] px-6 text-sm font-bold text-[#17212B] transition hover:bg-[#2EB68F] hover:text-white"
        >
          <ArrowLeft size={17} />

          Browse products
        </Link>

      </div>
    );
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">

      {/* ================= CART ITEMS ================= */}

      <section>

        {/* HEADER */}

        <div className="flex items-center justify-between gap-4">

          <div>

            <h1 className="text-2xl font-bold text-[#17212B] sm:text-3xl">
              Your cart
            </h1>

            <p className="mt-1 text-sm text-[#64717D]">
              {totalItems}{" "}
              {totalItems === 1 ? "item" : "items"} in your cart
            </p>

          </div>

          <button
            type="button"
            onClick={clearCart}
            className="shrink-0 text-xs font-bold text-[#DC2626] transition hover:opacity-70"
          >
            Clear cart
          </button>

        </div>

        {/* CART PRODUCTS */}

        <div className="mt-6 space-y-4">

          {items.map((item) => {
            const lineTotal =
              item.unitPrice * item.quantity;

            const lineMRP =
              item.product.mrp * item.quantity;

            const reachedStockLimit =
              item.availableStock !== null &&
              item.quantity >= item.availableStock;

            return (
              <article
                key={`${item.product.id}-${item.pharmacy?.id ?? "default"}`}
                className="rounded-2xl border border-[#E5EAE8] bg-white p-4 sm:p-5"
              >

                <div className="flex gap-4">

                  {/* PRODUCT IMAGE */}

                  <Link
                    href={`/medicine/${item.product.id}`}
                    className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-[#F7FAF9] sm:h-28 sm:w-28"
                  >
                    <ImageIcon
                      size={30}
                      className="text-[#2EB68F]"
                    />
                  </Link>

                  {/* PRODUCT INFORMATION */}

                  <div className="flex min-w-0 flex-1 flex-col">

                    <div className="flex items-start justify-between gap-3">

                      <div className="min-w-0">

                        <Link
                          href={`/medicine/${item.product.id}`}
                        >
                          <h2 className="truncate text-sm font-bold text-[#17212B] sm:text-base">
                            {item.product.name}
                          </h2>
                        </Link>

                        <p className="mt-1 truncate text-xs text-[#8B949E]">
                          {item.product.manufacturer}
                        </p>

                        <p className="mt-1 text-xs text-[#64717D]">
                          {item.product.packSize}
                        </p>

                      </div>

                      {/* REMOVE */}

                      <button
                        type="button"
                        onClick={() =>
                          removeItem(item.product.id)
                        }
                        aria-label="Remove product"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#8B949E] transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={17} />
                      </button>

                    </div>

                    {/* PRICE PER UNIT */}

                    <div className="mt-3 flex flex-wrap items-center gap-2">

                      <span className="text-sm font-bold text-[#17212B]">
                        ₹{item.unitPrice}
                      </span>

                      {item.product.mrp > item.unitPrice && (
                        <span className="text-xs text-[#9CA3AF] line-through">
                          ₹{item.product.mrp}
                        </span>
                      )}

                      <span className="text-[11px] text-[#8B949E]">
                        per unit
                      </span>

                    </div>

                    {/* QUANTITY + TOTAL */}

                    <div className="mt-auto flex items-end justify-between gap-3 pt-4">

                      {/* QUANTITY */}

                      <div>

                        <div className="flex h-10 items-center rounded-xl border border-[#DDE5E2]">

                          <button
                            type="button"
                            onClick={() =>
                              decreaseQuantity(
                                item.product.id
                              )
                            }
                            aria-label="Decrease quantity"
                            className="flex h-full w-10 items-center justify-center text-[#64717D] transition hover:text-[#2EB68F]"
                          >
                            <Minus size={15} />
                          </button>

                          <span className="flex w-9 items-center justify-center text-sm font-bold text-[#17212B]">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              increaseQuantity(
                                item.product.id
                              )
                            }
                            disabled={reachedStockLimit}
                            aria-label="Increase quantity"
                            className="flex h-full w-10 items-center justify-center text-[#64717D] transition hover:text-[#2EB68F] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Plus size={15} />
                          </button>

                        </div>

                        {/* STOCK INFORMATION */}

                        {item.availableStock !== null && (
                          <p
                            className={`mt-2 text-[10px] font-medium ${
                              reachedStockLimit
                                ? "text-[#B86B00]"
                                : "text-[#8B949E]"
                            }`}
                          >
                            {reachedStockLimit
                              ? "Maximum available stock reached"
                              : `${item.availableStock} units available`}
                          </p>
                        )}

                      </div>

                      {/* LINE PRICE */}

                      <div className="text-right">

                        <p className="text-base font-bold text-[#17212B]">
                          ₹{lineTotal}
                        </p>

                        {lineMRP > lineTotal && (
                          <p className="text-xs text-[#9CA3AF] line-through">
                            ₹{lineMRP}
                          </p>
                        )}

                      </div>

                    </div>

                  </div>

                </div>

                {/* ================= PHARMACY ================= */}

                {item.pharmacy && (
                  <div className="mt-4 border-t border-[#EDF0EF] pt-4">

                    <div className="flex flex-col gap-3 rounded-xl bg-[#F7FAF9] p-3 sm:flex-row sm:items-center sm:justify-between">

                      {/* PHARMACY */}

                      <div className="flex min-w-0 items-start gap-3">

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAFAF5] text-[#2EB68F]">
                          <Store size={16} />
                        </div>

                        <div className="min-w-0">

                          <p className="text-[10px] uppercase tracking-wide text-[#8B949E]">
                            Fulfilled by
                          </p>

                          <p className="mt-0.5 truncate text-xs font-bold text-[#17212B]">
                            {item.pharmacy.name}
                          </p>

                          <p className="mt-1 truncate text-[11px] text-[#8B949E]">
                            {item.pharmacy.address}
                          </p>

                        </div>

                      </div>

                      {/* DELIVERY INFORMATION */}

                      <div className="flex shrink-0 items-center gap-4 pl-12 sm:pl-0">

                        <div className="flex items-center gap-1.5 text-xs font-medium text-[#64717D]">

                          <Clock3
                            size={14}
                            className="text-[#2EB68F]"
                          />

                          {item.pharmacy.deliveryTime} mins

                        </div>

                        <div className="flex items-center gap-1.5 text-xs font-medium text-[#64717D]">

                          <MapPin
                            size={14}
                            className="text-[#2EB68F]"
                          />

                          {item.pharmacy.distance} km

                        </div>

                      </div>

                    </div>

                  </div>
                )}

              </article>
            );
          })}

        </div>

      </section>

      {/* ================= ORDER SUMMARY ================= */}

      <aside className="lg:sticky lg:top-[105px]">

        <div className="rounded-3xl border border-[#E5EAE8] bg-white p-5 shadow-[0_20px_60px_rgba(23,33,43,0.06)] sm:p-6">

          <h2 className="text-xl font-bold text-[#17212B]">
            Order summary
          </h2>

          {/* DELIVERY ESTIMATE */}

          {estimatedDeliveryTime !== null && (
            <div className="mt-5 flex items-center gap-3 rounded-xl bg-[#F4FCF9] p-4">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#2EB68F]">
                <Clock3 size={18} />
              </div>

              <div>

                <p className="text-xs text-[#8B949E]">
                  Estimated delivery
                </p>

                <p className="mt-0.5 text-sm font-bold text-[#17212B]">
                  Within {estimatedDeliveryTime} mins
                </p>

              </div>

            </div>
          )}

          {/* PRICE DETAILS */}

          <div className="mt-6 space-y-4">

            <div className="flex justify-between text-sm">

              <span className="text-[#64717D]">
                Total MRP
              </span>

              <span className="font-semibold text-[#17212B]">
                ₹{totalMRP}
              </span>

            </div>

            <div className="flex justify-between text-sm">

              <span className="text-[#64717D]">
                Product discount
              </span>

              <span className="font-semibold text-[#2EB68F]">
                - ₹{savings}
              </span>

            </div>

            <div className="flex justify-between text-sm">

              <span className="text-[#64717D]">
                Delivery fee
              </span>

              <span className="font-semibold text-[#2EB68F]">
                FREE
              </span>

            </div>

          </div>

          <div className="my-5 border-t border-[#EDF0EF]" />

          {/* PAYABLE */}

          <div className="flex items-center justify-between">

            <span className="font-bold text-[#17212B]">
              Amount payable
            </span>

            <span className="text-2xl font-bold text-[#17212B]">
              ₹{subtotal}
            </span>

          </div>

          {/* SAVINGS */}

          {savings > 0 && (
            <div className="mt-4 rounded-xl bg-[#EAFAF5] px-4 py-3 text-center text-xs font-bold text-[#2EB68F]">
              You save ₹{savings} on this order
            </div>
          )}

          {/* CHECKOUT */}

          <Link
            href="/checkout"
            className="mt-6 flex h-[54px] w-full items-center justify-center rounded-xl bg-[#45C9A5] text-sm font-bold text-[#17212B] transition hover:bg-[#2EB68F] hover:text-white"
          >
            Proceed to checkout
          </Link>

          {/* CONTINUE SHOPPING */}

          <Link
            href="/search"
            className="mt-3 flex h-11 w-full items-center justify-center text-sm font-semibold text-[#64717D] transition hover:text-[#2EB68F]"
          >
            Continue shopping
          </Link>

        </div>

      </aside>

    </div>
  );
}