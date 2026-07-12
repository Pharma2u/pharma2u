"use client";

import Link from "next/link";

import {
  Check,
  ChevronRight,
  Clock3,
  Home,
  MapPin,
  PackageCheck,
  ReceiptText,
  Store,
} from "lucide-react";

import { useOrderStore } from "@/src/store/orderStore";

interface OrderSuccessContentProps {
  orderId: string;
}

export default function OrderSuccessContent({
  orderId,
}: OrderSuccessContentProps) {
  const order = useOrderStore(
    (state) =>
      state.orders.find(
        (item) =>
          item.id === orderId
      )
  );

  if (!order) {
    return (
      <div className="mx-auto flex min-h-[560px] max-w-xl flex-col items-center justify-center text-center">

        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#FFF5E6]">
          <ReceiptText
            size={32}
            className="text-[#B86B00]"
          />
        </div>

        <h1 className="mt-6 text-2xl font-bold text-[#17212B]">
          Order not found
        </h1>

        <p className="mt-2 text-sm leading-6 text-[#64717D]">
          We could not find the order details.
        </p>

        <Link
          href="/"
          className="mt-6 flex h-12 items-center justify-center rounded-xl bg-[#45C9A5] px-6 text-sm font-bold text-[#17212B]"
        >
          Go to home
        </Link>

      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">

      {/* SUCCESS */}

      <section className="rounded-3xl border border-[#E5EAE8] bg-white p-6 text-center shadow-[0_20px_60px_rgba(23,33,43,0.06)] sm:p-10">

        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#EAFAF5]">

          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#45C9A5] text-white">
            <Check size={26} />
          </div>

        </div>

        <h1 className="mt-6 text-2xl font-bold text-[#17212B] sm:text-3xl">
          Order placed successfully
        </h1>

        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#64717D]">
          Your order has been received and sent to the pharmacy
          for confirmation.
        </p>

        <div className="mt-6 inline-flex rounded-xl bg-[#F7FAF9] px-5 py-3">

          <div>
            <p className="text-[10px] uppercase tracking-wider text-[#8B949E]">
              Order ID
            </p>

            <p className="mt-1 text-sm font-bold text-[#17212B]">
              {order.id}
            </p>
          </div>

        </div>

      </section>

      {/* DELIVERY */}

      <section className="mt-6 rounded-3xl border border-[#E5EAE8] bg-white p-5 sm:p-6">

        <div className="flex items-center gap-3">

          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EAFAF5] text-[#2EB68F]">
            <Clock3 size={20} />
          </div>

          <div>

            <p className="text-xs text-[#8B949E]">
              Estimated delivery
            </p>

            <p className="mt-1 text-lg font-bold text-[#17212B]">
              Within {order.estimatedDeliveryTime} mins
            </p>

          </div>

        </div>

        <div className="mt-5 border-t border-[#EDF0EF] pt-5">

          <div className="flex items-start gap-3">

            <MapPin
              size={18}
              className="mt-0.5 shrink-0 text-[#2EB68F]"
            />

            <div>

              <p className="text-xs text-[#8B949E]">
                Delivering to
              </p>

              <p className="mt-1 text-sm font-bold text-[#17212B]">
                {order.address.label}
              </p>

              <p className="mt-1 text-xs leading-5 text-[#64717D]">
                {order.address.fullAddress}
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* ORDER ITEMS */}

      <section className="mt-6 rounded-3xl border border-[#E5EAE8] bg-white p-5 sm:p-6">

        <h2 className="text-lg font-bold text-[#17212B]">
          Order details
        </h2>

        <div className="mt-5 space-y-5">

          {order.items.map(
            (item) => (
              <div
                key={`${item.product.id}-${item.pharmacy.id}`}
                className="border-b border-[#EDF0EF] pb-5 last:border-0 last:pb-0"
              >

                <div className="flex items-start justify-between gap-4">

                  <div className="min-w-0">

                    <p className="text-sm font-bold text-[#17212B]">
                      {item.product.name}
                    </p>

                    <p className="mt-1 text-xs text-[#8B949E]">
                      Quantity: {item.quantity}
                    </p>

                  </div>

                  <p className="shrink-0 text-sm font-bold text-[#17212B]">
                    ₹{item.unitPrice * item.quantity}
                  </p>

                </div>

                <div className="mt-3 flex items-center gap-2 text-xs text-[#64717D]">

                  <Store
                    size={14}
                    className="text-[#2EB68F]"
                  />

                  {item.pharmacy.name}

                </div>

              </div>
            )
          )}

        </div>

      </section>

      {/* PAYMENT SUMMARY */}

      <section className="mt-6 rounded-3xl border border-[#E5EAE8] bg-white p-5 sm:p-6">

        <div className="flex items-center justify-between">

          <span className="text-sm text-[#64717D]">
            Payment method
          </span>

          <span className="text-sm font-bold uppercase text-[#17212B]">
            {order.paymentMethod}
          </span>

        </div>

        <div className="mt-4 flex items-center justify-between">

          <span className="font-bold text-[#17212B]">
            Amount paid
          </span>

          <span className="text-xl font-bold text-[#17212B]">
            ₹{order.totalAmount}
          </span>

        </div>

      </section>

      {/* ACTIONS */}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">

        <Link
          href={`/orders/${order.id}`}
          className="flex h-[52px] items-center justify-center gap-2 rounded-xl bg-[#45C9A5] text-sm font-bold text-[#17212B] transition hover:bg-[#2EB68F] hover:text-white"
        >
          <PackageCheck size={18} />

          Track order

          <ChevronRight size={17} />
        </Link>

        <Link
          href="/"
          className="flex h-[52px] items-center justify-center gap-2 rounded-xl border border-[#DDE5E2] bg-white text-sm font-bold text-[#64717D] transition hover:border-[#45C9A5] hover:text-[#2EB68F]"
        >
          <Home size={18} />

          Continue shopping
        </Link>

      </div>

    </div>
  );
}