"use client";

import Link from "next/link";

import {
  ChevronRight,
  Clock3,
  ImageIcon,
  MapPin,
  Package,
  PackageCheck,
  ShoppingBag,
  Store,
} from "lucide-react";

import { useOrderStore } from "@/src/store/orderStore";

import type {
  Order,
  OrderStatus,
} from "@/src/types/order";

interface StatusDetails {
  label: string;
  className: string;
}

const statusDetails: Record<
  OrderStatus,
  StatusDetails
> = {
  placed: {
    label: "Order placed",
    className:
      "bg-[#EAF7FF] text-[#1976A8]",
  },

  confirmed: {
    label: "Confirmed",
    className:
      "bg-[#EAFAF5] text-[#2EB68F]",
  },

  preparing: {
    label: "Preparing",
    className:
      "bg-[#FFF5E6] text-[#B86B00]",
  },

  ready_for_pickup: {
    label: "Ready for pickup",
    className:
      "bg-[#F3EEFF] text-[#7455C5]",
  },

  picked_up: {
    label: "Picked up",
    className:
      "bg-[#EEF3FF] text-[#4C6EDB]",
  },

  out_for_delivery: {
    label: "Out for delivery",
    className:
      "bg-[#EAF7FF] text-[#1976A8]",
  },

  delivered: {
    label: "Delivered",
    className:
      "bg-[#EAFAF5] text-[#239C7B]",
  },

  cancelled: {
    label: "Cancelled",
    className:
      "bg-[#FFF0F0] text-[#DC2626]",
  },
};

function formatOrderDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

export default function OrdersContent() {
  const orders = useOrderStore(
    (state) => state.orders
  );

  /*
   * EMPTY ORDERS
   */

  if (orders.length === 0) {
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
          No orders yet
        </h1>

        <p className="mt-2 max-w-md text-sm leading-6 text-[#64717D]">
          You have not placed any orders yet. Browse medicines
          and healthcare products to place your first order.
        </p>

        <Link
          href="/search"
          className="mt-6 flex h-12 items-center justify-center rounded-xl bg-[#45C9A5] px-6 text-sm font-bold text-[#17212B] transition hover:bg-[#2EB68F] hover:text-white"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* ================= PAGE HEADER ================= */}

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#17212B] sm:text-3xl">
          My orders
        </h1>

        <p className="mt-2 text-sm text-[#64717D]">
          View and track all your GoCure orders.
        </p>
      </div>

      {/* ================= ORDER COUNT ================= */}

      <div className="mt-6 flex items-center gap-2 text-sm text-[#64717D]">
        <Package size={17} />

        <span>
          {orders.length}{" "}
          {orders.length === 1
            ? "order"
            : "orders"}
        </span>
      </div>

      {/* ================= ORDERS ================= */}

      <div className="mt-6 space-y-5">
        {orders.map((order) => {
          const status =
            statusDetails[order.status];

          const firstPharmacy =
            order.items[0]?.pharmacy;

          const totalQuantity =
            order.items.reduce(
              (total, item) =>
                total + item.quantity,
              0
            );

          return (
            <article
              key={order.id}
              className="overflow-hidden rounded-3xl border border-[#E5EAE8] bg-white transition hover:border-[#C9D6D1] hover:shadow-[0_16px_50px_rgba(23,33,43,0.06)]"
            >
              {/* ORDER HEADER */}

              <div className="flex flex-col gap-4 border-b border-[#EDF0EF] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-base font-bold text-[#17212B]">
                      Order #{order.id}
                    </h2>

                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-bold ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-1.5 text-xs text-[#8B949E]">
                    <Clock3 size={13} />

                    {formatOrderDate(
                      order.createdAt
                    )}
                  </div>
                </div>

                <Link
                  href={`/orders/${order.id}`}
                  className="flex h-10 shrink-0 items-center justify-center gap-1 rounded-xl border border-[#DDE5E2] px-4 text-xs font-bold text-[#64717D] transition hover:border-[#45C9A5] hover:text-[#2EB68F]"
                >
                  View details

                  <ChevronRight size={15} />
                </Link>
              </div>

              {/* ORDER BODY */}

              <div className="p-5 sm:p-6">
                {/* PRODUCTS */}

                <div className="space-y-4">
                  {order.items
                    .slice(0, 2)
                    .map((item) => (
                      <div
                        key={`${item.product.id}-${item.pharmacy.id}`}
                        className="flex items-center gap-4"
                      >
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#F7FAF9]">
                          <ImageIcon
                            size={22}
                            className="text-[#2EB68F]"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-[#17212B]">
                            {item.product.name}
                          </p>

                          <p className="mt-1 text-xs text-[#8B949E]">
                            Qty: {item.quantity}
                          </p>
                        </div>

                        <p className="shrink-0 text-sm font-bold text-[#17212B]">
                          ₹
                          {item.unitPrice *
                            item.quantity}
                        </p>
                      </div>
                    ))}

                  {order.items.length > 2 && (
                    <p className="pl-[72px] text-xs font-semibold text-[#2EB68F]">
                      + {order.items.length - 2} more{" "}
                      {order.items.length - 2 === 1
                        ? "product"
                        : "products"}
                    </p>
                  )}
                </div>

                {/* ORDER INFORMATION */}

                <div className="mt-6 grid gap-4 border-t border-[#EDF0EF] pt-5 sm:grid-cols-3">
                  {/* PHARMACY */}

                  <div className="flex items-start gap-3">
                    <Store
                      size={17}
                      className="mt-0.5 shrink-0 text-[#2EB68F]"
                    />

                    <div className="min-w-0">
                      <p className="text-[11px] text-[#8B949E]">
                        Pharmacy
                      </p>

                      <p className="mt-1 truncate text-xs font-bold text-[#17212B]">
                        {firstPharmacy?.name ??
                          "Pharmacy"}
                      </p>
                    </div>
                  </div>

                  {/* DELIVERY */}

                  <div className="flex items-start gap-3">
                    <MapPin
                      size={17}
                      className="mt-0.5 shrink-0 text-[#2EB68F]"
                    />

                    <div className="min-w-0">
                      <p className="text-[11px] text-[#8B949E]">
                        Delivering to
                      </p>

                      <p className="mt-1 truncate text-xs font-bold text-[#17212B]">
                        {order.address.label}
                      </p>
                    </div>
                  </div>

                  {/* TOTAL */}

                  <div className="flex items-start gap-3">
                    <PackageCheck
                      size={17}
                      className="mt-0.5 shrink-0 text-[#2EB68F]"
                    />

                    <div>
                      <p className="text-[11px] text-[#8B949E]">
                        Order total
                      </p>

                      <p className="mt-1 text-xs font-bold text-[#17212B]">
                        ₹{order.totalAmount}
                      </p>
                    </div>
                  </div>
                </div>

                {/* FOOTER */}

                <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-[#F8FAFA] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-[#64717D]">
                    {totalQuantity}{" "}
                    {totalQuantity === 1
                      ? "item"
                      : "items"}{" "}
                    in this order
                  </p>

                  {order.status !==
                    "delivered" &&
                    order.status !==
                      "cancelled" && (
                      <Link
                        href={`/orders/${order.id}`}
                        className="flex items-center gap-1 text-xs font-bold text-[#2EB68F]"
                      >
                        Track order

                        <ChevronRight
                          size={14}
                        />
                      </Link>
                    )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}