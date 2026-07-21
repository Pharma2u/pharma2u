"use client";

import { useRef, useState } from "react";
import { useSelector } from "react-redux";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";

import {
  AlertCircle,
  Banknote,
  ChevronRight,
  Clock3,
  CreditCard,
  FileText,
  LoaderCircle,
  MapPin,
  Plus,
  ShieldCheck,
  Smartphone,
  Store,
  Truck,
} from "lucide-react";

import LocationModal from "@/src/components/location/LocationModal";

import {
  createOrder,
  uploadOrderPrescription,
  reportRazorpayPaymentFailed,
  verifyRazorpayPayment,
  type CreatedOrder,
  type RazorpayPaymentResponse,
} from "@/src/lib/ordersApi";
import { ProductThumbnail } from "@/src/components/product/ProductThumbnail";
import type { AuthRootState } from "@/src/store/authStore";

import { useAddressStore } from "@/src/store/addressStore";
import { useCartStore } from "@/src/store/cartStore";
import { useOrderStore } from "@/src/store/orderStore";

import type { Order, OrderPaymentMethod } from "@/src/types/order";

type PaymentMethod = "upi" | "card" | "cod";

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  handler: (response: RazorpayPaymentResponse) => void;
  modal: { ondismiss: () => void };
  prefill: { name: string };
  theme: { color: string };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => {
      open: () => void;
      on: (
        event: "payment.failed",
        callback: (response: { error?: { description?: string } }) => void,
      ) => void;
    };
  }
}

class CheckoutPaymentError extends Error {}

export default function CheckoutContent() {
  const router = useRouter();
  const session = useSelector((state: AuthRootState) => state.auth.session);

  /*
   * ORDER PROCESSING
   */

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [isRazorpayReady, setIsRazorpayReady] = useState(false);
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const prescriptionInputRef = useRef<HTMLInputElement>(null);

  /*
   * CART
   */

  const items = useCartStore((state) => state.items);

  const clearCart = useCartStore((state) => state.clearCart);

  /*
   * ORDER STORE
   */

  const addOrder = useOrderStore((state) => state.addOrder);

  /*
   * ADDRESS
   */

  const [locationModalOpen, setLocationModalOpen] = useState(false);

  const addresses = useAddressStore((state) => state.addresses);

  const selectedAddressId = useAddressStore((state) => state.selectedAddressId);

  const selectedAddress = addresses.find(
    (address) => address.id === selectedAddressId,
  );

  /*
   * PAYMENT
   */

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");

  /*
   * DELIVERY INSTRUCTIONS
   */

  const [deliveryInstructions, setDeliveryInstructions] = useState("");

  /*
   * ORDER CALCULATIONS
   */

  const subtotal = items.reduce(
    (total, item) => total + item.unitPrice * item.quantity,
    0,
  );

  const totalMRP = items.reduce(
    (total, item) => total + item.product.mrp * item.quantity,
    0,
  );

  const savings = Math.max(0, totalMRP - subtotal);

  const deliveryFee = 0;

  const totalAmount = subtotal + deliveryFee;

  /*
   * DELIVERY TIME
   */

  const deliveryTimes = items
    .map((item) => item.pharmacy?.deliveryTime)
    .filter(
      (deliveryTime): deliveryTime is number => typeof deliveryTime === "number",
    );

  const estimatedDeliveryTime =
    deliveryTimes.length > 0 ? Math.max(...deliveryTimes) : 30;

  /*
   * PRESCRIPTION CHECK
   */

  const hasPrescriptionProducts = items.some(
    (item) => item.product.prescriptionRequired,
  );

  /*
   * STOCK VALIDATION
   */

  const hasStockIssue = items.some(
    (item) =>
      item.availableStock !== null && item.quantity > item.availableStock,
  );

  /*
   * PHARMACY VALIDATION
   */

  // Pharmacy selection is verified and matched atomically by the backend at checkout.
  const hasMissingPharmacy = false;

  /*
   * PLACE ORDER VALIDATION
   */

  const canPlaceOrder =
    Boolean(selectedAddress) &&
    items.length > 0 &&
    !hasStockIssue &&
    !hasMissingPharmacy &&
    (!hasPrescriptionProducts || Boolean(prescriptionFile)) &&
    !isPlacingOrder &&
    (paymentMethod === "cod" || isRazorpayReady);

  function openRazorpayCheckout(created: CreatedOrder) {
    return new Promise<RazorpayPaymentResponse>((resolve, reject) => {
      if (!created.razorpay || !window.Razorpay) {
        reject(
          new Error(
            "Secure payment checkout is still loading. Please try again.",
          ),
        );
        return;
      }
      let settled = false;
      const fail = (message: string) => {
        if (settled) return;
        settled = true;
        reject(new CheckoutPaymentError(message));
      };
      const checkout = new window.Razorpay({
        key: created.razorpay.keyId,
        amount: created.razorpay.amount,
        currency: created.razorpay.currency,
        order_id: created.razorpay.orderId,
        name: "Pharma2U",
        description: `Order ${created.orderCode}`,
        prefill: { name: session?.name ?? "" },
        theme: { color: "#2EB68F" },
        handler: (response) => {
          if (settled) return;
          settled = true;
          resolve(response);
        },
        modal: {
          ondismiss: () => fail("Payment was cancelled before completion."),
        },
      });
      checkout.on("payment.failed", (response) =>
        fail(
          response.error?.description ?? "Payment failed. Please try again.",
        ),
      );
      checkout.open();
    });
  }

  /*
   * CREATE ORDER
   */

  const handlePlaceOrder = async () => {
    setOrderError("");
    if (
      isPlacingOrder ||
      !selectedAddress ||
      !items.length ||
      hasStockIssue ||
      hasMissingPharmacy
    )
      return;
    if (!session?.token) {
      setOrderError("Please sign in before placing an order.");
      router.push("/login");
      return;
    }
    const orderItems = items.flatMap((item) =>
      item.pharmacy
        ? [
            {
              product: item.product,
              quantity: item.quantity,
              pharmacy: item.pharmacy,
              unitPrice: item.unitPrice,
              availableStock: item.availableStock,
            },
          ]
        : [],
    );
    const localOrder: Omit<Order, "id"> = {
      items: orderItems,
      address: {
        id: selectedAddress.id,
        label: selectedAddress.label,
        fullAddress: selectedAddress.fullAddress,
        city: selectedAddress.city,
        state: selectedAddress.state,
        pincode: selectedAddress.pincode,
      },
      paymentMethod: paymentMethod as OrderPaymentMethod,
      deliveryInstructions,
      subtotal,
      totalMRP,
      savings,
      deliveryFee,
      totalAmount,
      estimatedDeliveryTime: estimatedDeliveryTime,
      status: "placed",
      createdAt: new Date().toISOString(),
    };

    setIsPlacingOrder(true);
    try {
      const created = await createOrder(session.token, {
        items: items.map((item) => ({
          productId: String(item.product.id),
          qty: item.quantity,
        })),
        dropAddress: `${selectedAddress.fullAddress}, ${selectedAddress.city}${selectedAddress.state ? `, ${selectedAddress.state}` : ""}${selectedAddress.pincode ? ` - ${selectedAddress.pincode}` : ""}`,
        ...(selectedAddress.latitude === undefined
          ? {}
          : { dropLat: selectedAddress.latitude }),
        ...(selectedAddress.longitude === undefined
          ? {}
          : { dropLng: selectedAddress.longitude }),
        paymentMethod,
        deliveryInstructions: deliveryInstructions.trim() || undefined,
        deliveryFee,
        estimatedMinutes: estimatedDeliveryTime,
      });
      if (hasPrescriptionProducts && prescriptionFile) {
        await uploadOrderPrescription(session.token, created.id, prescriptionFile);
      }
      if (paymentMethod !== "cod") {
        try {
          const payment = await openRazorpayCheckout(created);
          try {
            await verifyRazorpayPayment(session.token, created.id, payment);
          } catch {
            // The signed webhook remains authoritative if immediate verification is delayed.
          }
        } catch (caught) {
          const message =
            caught instanceof Error
              ? caught.message
              : "Payment was not completed.";
          if (caught instanceof CheckoutPaymentError) {
            await reportRazorpayPaymentFailed(
              session.token,
              created.id,
              message,
            ).catch(() => undefined);
          }
          throw caught;
        }
      }
      addOrder({ ...localOrder, id: created.id });
      clearCart();
      router.push(`/order-success/${created.id}`);
    } catch (caught) {
      setOrderError(
        caught instanceof Error
          ? caught.message
          : "Unable to place your order. Please try again.",
      );
    } finally {
      setIsPlacingOrder(false);
    }
  };
  /*
   * EMPTY CART
   */

  if (items.length === 0) {
    return (
      <div className="flex min-h-[560px] flex-col items-center justify-center px-5 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#EAFAF5]">
          <Truck size={40} strokeWidth={1.5} className="text-[#2EB68F]" />
        </div>

        <h1 className="mt-6 text-2xl font-bold text-[#17212B]">
          Your cart is empty
        </h1>

        <p className="mt-2 max-w-md text-sm leading-6 text-[#64717D]">
          Add medicines or healthcare products before proceeding to checkout.
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
    <>
      <Script
        id="razorpay-checkout"
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onReady={() => setIsRazorpayReady(true)}
        onError={() => {
          setIsRazorpayReady(false);
          setOrderError(
            "Unable to load secure payment checkout. You can choose cash on delivery or retry.",
          );
        }}
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
        {/* ================= LEFT CONTENT ================= */}

        <div className="space-y-6">
          {/* PAGE TITLE */}

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#17212B] sm:text-3xl">
              Checkout
            </h1>

            <p className="mt-2 text-sm text-[#64717D]">
              Review your delivery details and complete your order.
            </p>
          </div>

          {/* ================= DELIVERY ADDRESS ================= */}

          <section className="rounded-3xl border border-[#E5EAE8] bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EAFAF5] text-[#2EB68F]">
                  <MapPin size={20} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-[#17212B]">
                    Delivery address
                  </h2>

                  <p className="mt-0.5 text-xs text-[#8B949E]">
                    Select where your order should be delivered
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setLocationModalOpen(true)}
                className="flex shrink-0 items-center gap-1 text-xs font-bold text-[#2EB68F] transition hover:text-[#239C7B]"
              >
                <Plus size={15} />

                {selectedAddress ? "Change" : "Add address"}
              </button>
            </div>

            {selectedAddress ? (
              <button
                type="button"
                onClick={() => setLocationModalOpen(true)}
                className="mt-6 flex w-full items-start gap-4 rounded-2xl border border-[#45C9A5] bg-[#F4FCF9] p-4 text-left transition hover:bg-[#EAFAF5]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#2EB68F]">
                  <MapPin size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-[#17212B]">
                      {selectedAddress.label}
                    </span>

                    <span className="rounded-md bg-white px-2 py-1 text-[10px] font-bold text-[#2EB68F]">
                      SELECTED
                    </span>
                  </div>

                  <p className="mt-2 text-sm leading-6 text-[#64717D]">
                    {selectedAddress.fullAddress}
                  </p>

                  <p className="mt-1 text-xs text-[#8B949E]">
                    {selectedAddress.city}

                    {selectedAddress.state ? `, ${selectedAddress.state}` : ""}

                    {selectedAddress.pincode
                      ? ` - ${selectedAddress.pincode}`
                      : ""}
                  </p>
                </div>

                <ChevronRight
                  size={18}
                  className="mt-1 shrink-0 text-[#8B949E]"
                />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setLocationModalOpen(true)}
                className="mt-6 flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-[#45C9A5] bg-[#F8FCFA] px-5 py-8 text-center transition hover:bg-[#F4FCF9]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EAFAF5] text-[#2EB68F]">
                  <MapPin size={21} />
                </div>

                <p className="mt-4 text-sm font-bold text-[#17212B]">
                  Add delivery address
                </p>

                <p className="mt-1 max-w-sm text-xs leading-5 text-[#8B949E]">
                  Select your location so we can find nearby pharmacies and
                  calculate delivery availability.
                </p>
              </button>
            )}
          </section>

          {/* ================= DELIVERY ================= */}

          <section className="rounded-3xl border border-[#E5EAE8] bg-white p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EAFAF5] text-[#2EB68F]">
                <Clock3 size={20} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-[#17212B]">Delivery</h2>

                <p className="mt-0.5 text-xs text-[#8B949E]">
                  Estimated delivery time
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-[#45C9A5] bg-[#F4FCF9] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Truck size={21} className="shrink-0 text-[#2EB68F]" />

                <div>
                  <p className="text-sm font-bold text-[#17212B]">
                    Express delivery
                  </p>

                  <p className="mt-1 text-xs text-[#64717D]">
                    Delivery from your selected nearby pharmacy
                  </p>
                </div>
              </div>

              <span className="shrink-0 text-sm font-bold text-[#2EB68F]">
                `Within ${estimatedDeliveryTime} mins`
              </span>
            </div>

            <div className="mt-5">
              <label
                htmlFor="instructions"
                className="text-sm font-bold text-[#17212B]"
              >
                Delivery instructions
              </label>

              <textarea
                id="instructions"
                value={deliveryInstructions}
                onChange={(event) =>
                  setDeliveryInstructions(event.target.value)
                }
                placeholder="Example: Call me when you arrive"
                rows={3}
                className="mt-3 w-full resize-none rounded-xl border border-[#DDE5E2] bg-[#F8FAFA] p-4 text-sm text-[#17212B] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#45C9A5] focus:bg-white focus:ring-4 focus:ring-[#45C9A5]/10"
              />
            </div>
          </section>

          {/* ================= PRESCRIPTION ================= */}

          {hasPrescriptionProducts && (
            <section className="rounded-3xl border border-[#F1D7A7] bg-[#FFF9EE] p-5 sm:p-6">
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#B86B00]">
                  <FileText size={20} />
                </div>

                <div className="flex-1">
                  <h2 className="text-lg font-bold text-[#17212B]">
                    Prescription required
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-[#7A6542]">
                    Your cart contains medicine that requires a valid
                    prescription. Upload a prescription before placing your
                    order.
                  </p>

                  <button
                    type="button"
                    className="mt-4 flex h-11 items-center justify-center rounded-xl bg-[#B86B00] px-5 text-sm font-bold text-white transition hover:bg-[#995800]"
                  >
                    Upload prescription
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* ================= PAYMENT ================= */}

          <section className="rounded-3xl border border-[#E5EAE8] bg-white p-5 sm:p-6">
            <h2 className="text-lg font-bold text-[#17212B]">Payment method</h2>

            <p className="mt-1 text-xs text-[#8B949E]">
              Choose how you want to pay
            </p>

            <div className="mt-6 space-y-3">
              {[
                {
                  id: "upi" as PaymentMethod,
                  name: "UPI",
                  description: "Pay using any UPI application",
                  icon: Smartphone,
                },
                {
                  id: "card" as PaymentMethod,
                  name: "Credit / Debit Card",
                  description: "Pay securely using your card",
                  icon: CreditCard,
                },
                {
                  id: "cod" as PaymentMethod,
                  name: "Cash on Delivery",
                  description: "Pay when your order arrives",
                  icon: Banknote,
                },
              ].map((method) => {
                const Icon = method.icon;

                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${
                      paymentMethod === method.id
                        ? "border-[#45C9A5] bg-[#F4FCF9]"
                        : "border-[#E5EAE8] hover:border-[#C9D6D1]"
                    }`}
                  >
                    <Icon size={21} className="shrink-0 text-[#2EB68F]" />

                    <div className="flex-1">
                      <p className="text-sm font-bold text-[#17212B]">
                        {method.name}
                      </p>

                      <p className="mt-1 text-xs text-[#8B949E]">
                        {method.description}
                      </p>
                    </div>

                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        paymentMethod === method.id
                          ? "border-[6px] border-[#45C9A5]"
                          : "border-2 border-[#DDE5E2]"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* ================= ORDER SUMMARY ================= */}

        <aside className="lg:sticky lg:top-[105px]">
          <div className="rounded-3xl border border-[#E5EAE8] bg-white p-5 shadow-[0_20px_60px_rgba(23,33,43,0.06)] sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#17212B]">
                Order summary
              </h2>

              <Link href="/cart" className="text-xs font-bold text-[#2EB68F]">
                Edit cart
              </Link>
            </div>

            {/* PRODUCTS */}

            <div className="mt-6 max-h-[350px] space-y-5 overflow-y-auto">
              {items.map((item) => (
                <div
                  key={`${item.product.id}-${item.pharmacy?.id ?? "default"}`}
                  className="border-b border-[#EDF0EF] pb-5 last:border-b-0 last:pb-0"
                >
                  <div className="flex gap-3">
                    <ProductThumbnail
                      src={item.product.image}
                      alt={item.product.name}
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[#17212B]">
                        {item.product.name}
                      </p>

                      <p className="mt-1 text-xs text-[#8B949E]">
                        Qty: {item.quantity}
                      </p>
                    </div>

                    <p className="shrink-0 text-sm font-bold text-[#17212B]">
                      Rs. {item.unitPrice * item.quantity}
                    </p>
                  </div>

                  {item.pharmacy && (
                    <div className="mt-3 flex items-start gap-2 pl-[68px]">
                      <Store
                        size={13}
                        className="mt-0.5 shrink-0 text-[#2EB68F]"
                      />

                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-semibold text-[#64717D]">
                          {item.pharmacy.name}
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px] text-[#8B949E]">
                          <span className="flex items-center gap-1">
                            <Clock3 size={11} />
                            {item.pharmacy.deliveryTime === null ? "Delivery estimate pending" : `${item.pharmacy.deliveryTime} mins`}
                          </span>

                          <span className="flex items-center gap-1">
                            <MapPin size={11} />
                            {item.pharmacy.distance === null ? "Distance unavailable" : `${item.pharmacy.distance} km`}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* PRICE DETAILS */}

            <div className="mt-6 border-t border-[#EDF0EF] pt-5">
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-[#64717D]">Total MRP</span>

                  <span className="font-semibold text-[#17212B]">
                    Rs. {totalMRP}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-[#64717D]">Product discount</span>

                  <span className="font-semibold text-[#2EB68F]">
                    - Rs. {savings}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-[#64717D]">Delivery fee</span>

                  <span className="font-semibold text-[#2EB68F]">FREE</span>
                </div>
              </div>

              <div className="my-5 border-t border-[#EDF0EF]" />

              <div className="flex items-center justify-between">
                <span className="font-bold text-[#17212B]">Amount payable</span>

                <span className="text-2xl font-bold text-[#17212B]">
                  Rs. {totalAmount}
                </span>
              </div>

              {savings > 0 && (
                <div className="mt-4 rounded-xl bg-[#EAFAF5] px-4 py-3 text-center text-xs font-bold text-[#2EB68F]">
                  You save Rs. {savings} on this order
                </div>
              )}
            </div>

            {orderError && (
              <div
                className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3"
                role="alert"
              >
                <p className="text-[11px] leading-5 text-red-700">
                  {orderError}
                </p>
              </div>
            )}
            {/* VALIDATION WARNINGS */}

            {hasStockIssue && (
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#FFF9EE] p-3">
                <AlertCircle
                  size={16}
                  className="mt-0.5 shrink-0 text-[#B86B00]"
                />

                <p className="text-[11px] leading-5 text-[#7A6542]">
                  One or more products exceed the available pharmacy stock.
                  Please update your cart.
                </p>
              </div>
            )}

            {hasMissingPharmacy && (
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#FFF9EE] p-3">
                <AlertCircle
                  size={16}
                  className="mt-0.5 shrink-0 text-[#B86B00]"
                />

                <p className="text-[11px] leading-5 text-[#7A6542]">
                  Pharmacy availability is missing for one or more products.
                  Please update your cart.
                </p>
              </div>
            )}

            {/* PLACE ORDER */}

            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={!canPlaceOrder}
              className="mt-6 flex h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-[#45C9A5] text-sm font-bold text-[#17212B] transition hover:bg-[#2EB68F] hover:text-white disabled:cursor-not-allowed disabled:bg-[#DDE5E2] disabled:text-[#8B949E]"
            >
              {isPlacingOrder ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  Placing order...
                </>
              ) : (
                <>
                  {!selectedAddress
                    ? "Add delivery address"
                    : hasStockIssue
                      ? "Update cart quantities"
                      : hasMissingPharmacy
                        ? "Update cart"
                        : paymentMethod !== "cod" && !isRazorpayReady
                          ? "Loading secure payment..."
                          : paymentMethod === "cod"
                            ? "Place order"
                            : "Pay securely"}

                  <ChevronRight size={18} />
                </>
              )}
            </button>

            {/* SECURITY */}

            <div className="mt-5 flex items-start gap-2">
              <ShieldCheck
                size={17}
                className="mt-0.5 shrink-0 text-[#2EB68F]"
              />

              <p className="text-[11px] leading-5 text-[#8B949E]">
                Your payment and personal information are handled securely.
              </p>
            </div>

            {/* PRESCRIPTION WARNING */}

            {hasPrescriptionProducts && (
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#FFF9EE] p-3">
                <AlertCircle
                  size={16}
                  className="mt-0.5 shrink-0 text-[#B86B00]"
                />

                <p className="text-[11px] leading-5 text-[#7A6542]">
                  Prescription verification is required before this order can be
                  processed.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ================= LOCATION MODAL ================= */}

      <LocationModal
        open={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
      />
    </>
  );
}


