"use client";

import {
  CheckCircle2,
  ChevronDown,
  RotateCcw,
} from "lucide-react";

import { useOrderStore } from "@/src/store/orderStore";

import type {
  OrderStatus,
} from "@/src/types/order";

interface OrderStatusControlsProps {
  orderId: string;
  currentStatus: OrderStatus;
}

const orderStatuses: {
  value: OrderStatus;
  label: string;
}[] = [
  {
    value: "placed",
    label: "Order placed",
  },
  {
    value: "confirmed",
    label: "Confirmed by pharmacy",
  },
  {
    value: "preparing",
    label: "Preparing order",
  },
  {
    value: "ready_for_pickup",
    label: "Ready for pickup",
  },
  {
    value: "picked_up",
    label: "Picked up",
  },
  {
    value: "out_for_delivery",
    label: "Out for delivery",
  },
  {
    value: "delivered",
    label: "Delivered",
  },
  {
    value: "cancelled",
    label: "Cancelled",
  },
];

export default function OrderStatusControls({
  orderId,
  currentStatus,
}: OrderStatusControlsProps) {
  const updateOrderStatus =
    useOrderStore(
      (state) =>
        state.updateOrderStatus
    );

  const handleStatusChange = (
    status: OrderStatus
  ) => {
    updateOrderStatus(
      orderId,
      status
    );
  };

  return (
    <section className="rounded-3xl border border-dashed border-[#45C9A5] bg-[#F4FCF9] p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <div className="flex items-center gap-2">
            <RotateCcw
              size={18}
              className="text-[#2EB68F]"
            />

            <h2 className="font-bold text-[#17212B]">
              Development status control
            </h2>
          </div>

          <p className="mt-2 max-w-lg text-xs leading-5 text-[#64717D]">
            Temporarily change the order status to test
            the complete tracking interface.
          </p>
        </div>

        <div className="relative shrink-0">
          <select
            value={currentStatus}
            onChange={(event) =>
              handleStatusChange(
                event.target
                  .value as OrderStatus
              )
            }
            className="h-11 min-w-[220px] appearance-none rounded-xl border border-[#45C9A5] bg-white px-4 pr-10 text-sm font-bold text-[#17212B] outline-none transition focus:ring-4 focus:ring-[#45C9A5]/10"
          >
            {orderStatuses.map(
              (status) => (
                <option
                  key={status.value}
                  value={status.value}
                >
                  {status.label}
                </option>
              )
            )}
          </select>

          <ChevronDown
            size={16}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#64717D]"
          />
        </div>

      </div>

      <div className="mt-4 flex items-start gap-2 rounded-xl bg-white px-4 py-3">
        <CheckCircle2
          size={16}
          className="mt-0.5 shrink-0 text-[#2EB68F]"
        />

        <p className="text-[11px] leading-5 text-[#64717D]">
          Current test status:{" "}
          <span className="font-bold text-[#17212B]">
            {
              orderStatuses.find(
                (status) =>
                  status.value ===
                  currentStatus
              )?.label
            }
          </span>
        </p>
      </div>
    </section>
  );
}