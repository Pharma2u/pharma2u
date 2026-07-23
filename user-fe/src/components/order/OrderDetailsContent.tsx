"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

import {
  ArrowLeft,
  Check,
  ChevronRight,
  Circle,
  Clock3,
  CreditCard,
  Home,
  MapPin,
  Package,
  PackageCheck,
  ReceiptText,
  Store,
  Truck,
} from "lucide-react";

import { useSelector } from "react-redux";
import { getMyOrder } from "@/src/lib/ordersApi";
import type { AuthRootState } from "@/src/store/authStore";
import { useOrderStore } from "@/src/store/orderStore";
import { ProductThumbnail } from "@/src/components/product/ProductThumbnail";
import { LiveRiderMap } from "@/src/components/order/LiveRiderMap";

import type { OrderStatus } from "@/src/types/order";

/*
 * ORDER TRACKING STEPS
 */

const trackingSteps: {
  status: OrderStatus;
  label: string;
  description: string;
}[] = [
  {
    status: "placed",
    label: "Order placed",
    description: "Your order has been successfully placed.",
  },
  {
    status: "confirmed",
    label: "Confirmed by pharmacy",
    description: "The pharmacy has accepted your order.",
  },
  {
    status: "preparing",
    label: "Preparing your order",
    description: "The pharmacy is preparing your medicines.",
  },
  {
    status: "ready_for_pickup",
    label: "Ready for pickup",
    description: "Your order is ready for the delivery partner.",
  },
  {
    status: "picked_up",
    label: "Order picked up",
    description: "The delivery partner has collected your order.",
  },
  {
    status: "out_for_delivery",
    label: "Out for delivery",
    description: "Your order is on the way to your location.",
  },
  {
    status: "delivered",
    label: "Delivered",
    description: "Your order has been successfully delivered.",
  },
];

/*
 * STATUS LABELS
 */

const statusLabels: Record<OrderStatus, string> = {
  placed: "Order placed",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready_for_pickup: "Ready for pickup",
  picked_up: "Picked up",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/*
 * DATE FORMATTER
 */

function formatOrderDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

/*
 * PAYMENT METHOD FORMATTER
 */

function formatPaymentMethod(paymentMethod: string) {
  switch (paymentMethod) {
    case "upi":
      return "UPI";

    case "card":
      return "Credit / Debit Card";

    case "cod":
      return "Cash on Delivery";

    default:
      return paymentMethod;
  }
}

function toTrackingStatus(status: string): OrderStatus {
  switch (status) {
    case "verified":
      return "confirmed";
    case "awaiting_rider":
    case "rider_assigned":
      return "ready_for_pickup";
    case "picked_up":
    case "relay_pending":
      return "picked_up";
    case "on_the_way":
      return "out_for_delivery";
    case "delivered":
    case "cancelled":
      return status;
    default:
      return "placed";
  }
}

/*
 * PROPS
 */

interface OrderDetailsContentProps {
  orderId: string;
}

/*
 * COMPONENT
 */

export default function OrderDetailsContent({
  orderId,
}: OrderDetailsContentProps) {
  const session = useSelector((state: AuthRootState) => state.auth.session);
  const [liveStatus, setLiveStatus] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [liveDestination, setLiveDestination] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [liveOrigin, setLiveOrigin] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [deliveryOtp, setDeliveryOtp] = useState<string | null>(null);
  /*
   * GET ORDER
   */

  const order = useOrderStore((state) =>
    state.orders.find((item) => item.id === orderId),
  );

  useEffect(() => {
    if (!session?.token) return;

    let active = true;
    const refreshStatus = async () => {
      try {
        const liveOrder = await getMyOrder(session.token, orderId);
        if (!active) return;
        setDeliveryOtp(liveOrder.deliveryOtp ?? null);
        setLiveStatus(liveOrder.status);
        setLastUpdated(new Date());
        if (
          Number.isFinite(liveOrder.pharmacy.location?.lat) &&
          Number.isFinite(liveOrder.pharmacy.location?.lng)
        ) {
          setLiveOrigin({
            lat: liveOrder.pharmacy.location!.lat,
            lng: liveOrder.pharmacy.location!.lng,
          });
        }
        if (
          Number.isFinite(liveOrder.dropLat) &&
          Number.isFinite(liveOrder.dropLng)
        ) {
          setLiveDestination({
            lat: liveOrder.dropLat as number,
            lng: liveOrder.dropLng as number,
          });
        }
      } catch {
        // Keep the last known status while a refresh is temporarily unavailable.
      }
    };

    void refreshStatus();
    const intervalId = window.setInterval(refreshStatus, 15_000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [orderId, session?.token]);

  useEffect(() => {
    if (!session?.token) return;

    const socketBase = (
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"
    )
      .replace(/\/api\/?$/, "")
      .replace(/\/$/, "");
    const socket = io(socketBase, { auth: { token: session.token } });
    socket.on("connect", () => socket.emit("tracking:subscribe", orderId));
    socket.on("order:updated", (update: { status?: string }) => {
      if (update.status) {
        setLiveStatus(update.status);
        setLastUpdated(new Date());
      }
    });
    return () => {
      socket.close();
    };
  }, [orderId, session?.token]);

  /*
   * ORDER NOT FOUND
   */

  if (!order) {
    return (
      <div className="flex min-h-[560px] flex-col items-center justify-center px-5 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#FFF5E6]">
          <ReceiptText size={40} strokeWidth={1.5} className="text-[#B86B00]" />
        </div>

        <h1 className="mt-6 text-2xl font-bold text-[#17212B]">
          Order not found
        </h1>

        <p className="mt-2 max-w-md text-sm leading-6 text-[#64717D]">
          We could not find the order you are looking for.
        </p>

        <Link
          href="/orders"
          className="mt-6 flex h-12 items-center justify-center gap-2 rounded-xl bg-[#45C9A5] px-6 text-sm font-bold text-[#17212B] transition hover:bg-[#2EB68F] hover:text-white"
        >
          <ArrowLeft size={17} />
          Back to orders
        </Link>
      </div>
    );
  }

  const currentStatus = liveStatus
    ? toTrackingStatus(liveStatus)
    : order.status;

  const isLiveTrackingActive = [
    "rider_assigned",
    "picked_up",
    "relay_pending",
    "on_the_way",
  ].includes(liveStatus ?? "");

  /*
   * CURRENT TRACKING POSITION
   */

  const currentStepIndex =
    currentStatus === "cancelled"
      ? -1
      : trackingSteps.findIndex((step) => step.status === currentStatus);

  /*
   * ORDER INFORMATION
   */

  const firstPharmacy = order.items[0]?.pharmacy;

  const totalQuantity = order.items.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  return (
    <div className="mx-auto max-w-6xl">
      {/* ================= BACK ================= */}

      <Link
        href="/orders"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#64717D] transition hover:text-[#2EB68F]"
      >
        <ArrowLeft size={17} />
        Back to orders
      </Link>

      {/* ================= PAGE HEADER ================= */}

      <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#17212B] sm:text-3xl">
              Order details
            </h1>

            <span
              className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${
                currentStatus === "cancelled"
                  ? "bg-[#FFF0F0] text-[#DC2626]"
                  : currentStatus === "delivered"
                    ? "bg-[#EAFAF5] text-[#239C7B]"
                    : "bg-[#EAF7FF] text-[#1976A8]"
              }`}
            >
              {statusLabels[currentStatus]}
            </span>
          </div>

          <p className="mt-2 text-sm text-[#64717D]">Order #{order.id}</p>

          <div className="mt-2 flex items-center gap-1.5 text-xs text-[#8B949E]">
            <Clock3 size={13} />

            {formatOrderDate(order.createdAt)}
          </div>
        </div>

        {currentStatus !== "delivered" && currentStatus !== "cancelled" && (
          <div className="flex items-center gap-2 rounded-xl bg-[#EAFAF5] px-4 py-3">
            <Truck size={18} className="text-[#2EB68F]" />

            <div>
              <p className="text-[10px] text-[#64717D]">Estimated delivery</p>

              <p className="text-sm font-bold text-[#17212B]">
                Within {order.estimatedDeliveryTime} mins
              </p>
            </div>
          </div>
        )}
      </div>

      {isLiveTrackingActive && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#9CE3D0] bg-[#EAFAF5] px-4 py-3 text-sm">
          <span className="flex items-center gap-2 font-semibold text-[#17212B]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#2EB68F]" />
            Live delivery updates are on
          </span>
          <span className="text-xs text-[#64717D]">
            {lastUpdated
              ? `Updated ${lastUpdated.toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}`
              : "Connecting to your rider..."}
          </span>
        </div>
      )}

      {session?.token && isLiveTrackingActive && (
        <div className="mt-8">
          <LiveRiderMap
            orderId={orderId}
            token={session.token}
            destination={liveDestination}
            origin={liveOrigin}
          />
        </div>
      )}

      {/* ================= MAIN GRID ================= */}
      {currentStatus === "out_for_delivery" && deliveryOtp && (
        <section className="mt-8 rounded-3xl border border-[#9CE3D0] bg-[#EAFAF5] p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#239C7B]">
            Delivery OTP
          </p>
          <h2 className="mt-2 text-xl font-bold text-[#17212B]">
            Share this code only when your rider arrives
          </h2>
          <p className="mt-3 font-mono text-3xl font-bold tracking-[0.35em] text-[#17212B]">
            {deliveryOtp}
          </p>
          <p className="mt-3 text-sm text-[#64717D]">
            The delivery partner will enter this 6-digit OTP to complete your
            delivery.
          </p>
        </section>
      )}

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* ================= LEFT ================= */}

        <div className="space-y-6">
          {/* ================= TRACKING ================= */}

          <section className="rounded-3xl border border-[#E5EAE8] bg-white p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EAFAF5] text-[#2EB68F]">
                <PackageCheck size={20} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-[#17212B]">
                  Track order
                </h2>

                <p className="mt-0.5 text-xs text-[#8B949E]">
                  Follow the progress of your delivery
                </p>
              </div>
            </div>

            {currentStatus === "cancelled" ? (
              <div className="mt-6 rounded-2xl bg-[#FFF0F0] p-5">
                <p className="font-bold text-[#DC2626]">Order cancelled</p>

                <p className="mt-2 text-sm leading-6 text-[#7F1D1D]">
                  This order has been cancelled.
                </p>
              </div>
            ) : (
              <div className="mt-8">
                {trackingSteps.map((step, index) => {
                  const isCompleted = index < currentStepIndex;

                  const isCurrent = index === currentStepIndex;

                  const isActive = index <= currentStepIndex;

                  const isLast = index === trackingSteps.length - 1;

                  return (
                    <div key={step.status} className="relative flex gap-4">
                      {/* LINE */}

                      {!isLast && (
                        <div
                          className={`absolute left-[19px] top-10 h-[calc(100%-16px)] w-[2px] ${
                            index < currentStepIndex
                              ? "bg-[#45C9A5]"
                              : "bg-[#E5EAE8]"
                          }`}
                        />
                      )}

                      {/* ICON */}

                      <div
                        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${
                          isCompleted
                            ? "border-[#45C9A5] bg-[#45C9A5] text-white"
                            : isCurrent
                              ? "border-[#45C9A5] bg-[#EAFAF5] text-[#2EB68F]"
                              : "border-[#E5EAE8] bg-white text-[#B8C0C7]"
                        }`}
                      >
                        {isCompleted ? (
                          <Check size={17} />
                        ) : isCurrent ? (
                          <Package size={17} />
                        ) : (
                          <Circle size={11} fill="currentColor" />
                        )}
                      </div>

                      {/* INFORMATION */}

                      <div
                        className={`min-w-0 flex-1 ${isLast ? "pb-0" : "pb-8"}`}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <p
                            className={`text-sm font-bold ${
                              isActive ? "text-[#17212B]" : "text-[#9CA3AF]"
                            }`}
                          >
                            {step.label}
                          </p>

                          {isCurrent && (
                            <span className="rounded-full bg-[#EAFAF5] px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-[#2EB68F]">
                              Current
                            </span>
                          )}
                        </div>

                        <p
                          className={`mt-1 text-xs leading-5 ${
                            isActive ? "text-[#64717D]" : "text-[#B8C0C7]"
                          }`}
                        >
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ================= PRODUCTS ================= */}

          <section className="rounded-3xl border border-[#E5EAE8] bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#17212B]">
                  Items ordered
                </h2>

                <p className="mt-1 text-xs text-[#8B949E]">
                  {totalQuantity} {totalQuantity === 1 ? "item" : "items"}
                </p>
              </div>

              <Package size={21} className="text-[#2EB68F]" />
            </div>

            <div className="mt-6 space-y-5">
              {order.items.map((item) => (
                <div
                  key={`${item.product.id}-${item.pharmacy.id}`}
                  className="border-b border-[#EDF0EF] pb-5 last:border-b-0 last:pb-0"
                >
                  <div className="flex gap-4">
                    <Link
                      href={`/medicine/${item.product.id}`}
                      className="block"
                    >
                      <ProductThumbnail
                        src={item.product.image}
                        alt={item.product.name}
                        className="h-20 w-20"
                      />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <Link href={`/medicine/${item.product.id}`}>
                        <h3 className="text-sm font-bold text-[#17212B] transition hover:text-[#2EB68F]">
                          {item.product.name}
                        </h3>
                      </Link>

                      <p className="mt-1 text-xs text-[#8B949E]">
                        {item.product.manufacturer}
                      </p>

                      <p className="mt-1 text-xs text-[#64717D]">
                        {item.product.packSize}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs text-[#64717D]">
                          Qty:{" "}
                          <span className="font-bold text-[#17212B]">
                            {item.quantity}
                          </span>
                        </p>

                        <p className="text-sm font-bold text-[#17212B]">
                          {"\u20B9"}
                          {item.unitPrice * item.quantity}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#F8FAFA] px-3 py-2.5">
                    <Store
                      size={14}
                      className="mt-0.5 shrink-0 text-[#2EB68F]"
                    />

                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-[#17212B]">
                        {item.pharmacy.name}
                      </p>

                      <p className="mt-1 text-[11px] text-[#8B949E]">
                        {item.pharmacy.distance === null
                          ? "Distance unavailable"
                          : String(item.pharmacy.distance) + " km away"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ================= RIGHT ================= */}

        <aside className="space-y-6 lg:sticky lg:top-[105px]">
          {/* ================= DELIVERY ADDRESS ================= */}

          <section className="rounded-3xl border border-[#E5EAE8] bg-white p-5">
            <div className="flex items-center gap-3">
              <MapPin size={19} className="text-[#2EB68F]" />

              <h2 className="font-bold text-[#17212B]">Delivery address</h2>
            </div>

            <div className="mt-5">
              <p className="text-sm font-bold text-[#17212B]">
                {order.address.label}
              </p>

              <p className="mt-2 text-xs leading-5 text-[#64717D]">
                {order.address.fullAddress}
              </p>

              <p className="mt-2 text-xs text-[#8B949E]">
                {order.address.city}

                {order.address.state ? `, ${order.address.state}` : ""}

                {order.address.pincode ? ` - ${order.address.pincode}` : ""}
              </p>
            </div>
          </section>

          {/* ================= PHARMACY ================= */}

          {firstPharmacy && (
            <section className="rounded-3xl border border-[#E5EAE8] bg-white p-5">
              <div className="flex items-center gap-3">
                <Store size={19} className="text-[#2EB68F]" />

                <h2 className="font-bold text-[#17212B]">Pharmacy</h2>
              </div>

              <div className="mt-5">
                <p className="text-sm font-bold text-[#17212B]">
                  {firstPharmacy.name}
                </p>

                <p className="mt-2 text-xs leading-5 text-[#64717D]">
                  {firstPharmacy.address}
                </p>

                <div className="mt-4 flex flex-wrap gap-3 text-xs text-[#64717D]">
                  <span className="flex items-center gap-1.5">
                    <Clock3 size={13} className="text-[#2EB68F]" />
                    {firstPharmacy.deliveryTime} mins
                  </span>

                  <span className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-[#2EB68F]" />
                    {firstPharmacy.distance === null
                      ? "Distance unavailable"
                      : `${firstPharmacy.distance} km`}
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* ================= PAYMENT ================= */}

          <section className="rounded-3xl border border-[#E5EAE8] bg-white p-5">
            <div className="flex items-center gap-3">
              <CreditCard size={19} className="text-[#2EB68F]" />

              <h2 className="font-bold text-[#17212B]">Payment details</h2>
            </div>

            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-[#64717D]">Payment method</span>

                <span className="text-xs font-bold text-[#17212B]">
                  {formatPaymentMethod(order.paymentMethod)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-[#64717D]">Total MRP</span>

                <span className="text-xs font-semibold text-[#17212B]">
                  {"\u20B9"}
                  {order.totalMRP}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-[#64717D]">Product discount</span>

                <span className="text-xs font-semibold text-[#2EB68F]">
                  - {"\u20B9"}
                  {order.savings}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-[#64717D]">Delivery fee</span>

                <span className="text-xs font-semibold text-[#2EB68F]">
                  {order.deliveryFee === 0
                    ? "FREE"
                    : `\u20B9${order.deliveryFee}`}
                </span>
              </div>

              <div className="border-t border-[#EDF0EF] pt-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#17212B]">Total amount</span>

                  <span className="text-xl font-bold text-[#17212B]">
                    {"\u20B9"}
                    {order.totalAmount}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ================= DELIVERY INSTRUCTIONS ================= */}

          {order.deliveryInstructions && (
            <section className="rounded-3xl border border-[#E5EAE8] bg-white p-5">
              <h2 className="font-bold text-[#17212B]">
                Delivery instructions
              </h2>

              <p className="mt-3 text-xs leading-5 text-[#64717D]">
                {order.deliveryInstructions}
              </p>
            </section>
          )}

          {/* ================= ACTIONS ================= */}

          <div className="grid gap-3">
            <Link
              href="/"
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#45C9A5] text-sm font-bold text-[#17212B] transition hover:bg-[#2EB68F] hover:text-white"
            >
              <Home size={17} />
              Continue shopping
            </Link>

            <Link
              href="/orders"
              className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[#DDE5E2] bg-white text-sm font-bold text-[#64717D] transition hover:border-[#45C9A5] hover:text-[#2EB68F]"
            >
              View all orders
              <ChevronRight size={16} />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
