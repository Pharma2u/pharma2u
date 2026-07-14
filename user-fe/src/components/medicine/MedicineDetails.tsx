"use client";

import { useCallback, useState } from "react";
import Image from "next/image";

import {
  Check,
  CheckCircle2,
  Clock3,
  Heart,
  ImageIcon,
  MapPin,
  Minus,
  PackageCheck,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Store,
  Upload,
} from "lucide-react";

import NearbyPharmacies from "@/src/components/pharmacy/NearbyPharmacies";

import type { Product } from "@/src/data/products";
import { useCartStore } from "@/src/store/cartStore";

import type { PharmacyWithInventory } from "@/src/lib/pharmacy";

interface MedicineDetailsProps {
  product: Product;
}

export default function MedicineDetails({
  product,
}: MedicineDetailsProps) {
  /*
   * QUANTITY
   */

  const [quantity, setQuantity] = useState(1);

  /*
   * ADD TO CART FEEDBACK
   */

  const [justAdded, setJustAdded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  /*
   * SELECTED PHARMACY
   */

  const [selectedPharmacy, setSelectedPharmacy] =
    useState<PharmacyWithInventory | null>(null);

  /*
   * CART
   */

  const addItem = useCartStore((state) => state.addItem);

  /*
   * SELECTED PHARMACY VALUES
   */

  const selectedPrice =
    selectedPharmacy?.inventory.sellingPrice ??
    product.price;

  const selectedMRP =
    selectedPharmacy?.inventory.mrp ??
    product.mrp;

  const selectedDeliveryTime =
    selectedPharmacy?.deliveryTime ??
    product.deliveryTime;

  const availableStock =
    selectedPharmacy?.inventory.stockQuantity ?? 0;

  const savings = selectedMRP - selectedPrice;

  /*
   * QUANTITY CONTROLS
   */

  const increaseQuantity = () => {
    if (!selectedPharmacy) {
      return;
    }

    setQuantity((current) =>
      Math.min(current + 1, availableStock)
    );
  };

  const decreaseQuantity = () => {
    setQuantity((current) =>
      Math.max(1, current - 1)
    );
  };

  /*
   * PHARMACY SELECTION
   */

  const handlePharmacySelect = useCallback(
    (pharmacy: PharmacyWithInventory | null) => {
      setSelectedPharmacy(pharmacy);
      setQuantity(1);
    },
    [],
  );

  /*
   * ADD TO CART
   */

  const handleAddToCart = () => {
    if (!selectedPharmacy) {
      return;
    }

    if (availableStock <= 0) {
      return;
    }

    /*
     * Add the selected quantity.
     *
     * The cart store addItem function adds one unit
     * per call, so we call it based on quantity.
     */

    for (let index = 0; index < quantity; index++) {
      addItem(product, {
        pharmacy: {
          id: selectedPharmacy.id,
          name: selectedPharmacy.name,
          address: selectedPharmacy.address,
          deliveryTime:
            selectedPharmacy.deliveryTime,
          distance: selectedPharmacy.distance,
        },

        unitPrice:
          selectedPharmacy.inventory.sellingPrice,

        availableStock:
          selectedPharmacy.inventory.stockQuantity,
      });
    }

    setJustAdded(true);

    window.setTimeout(() => {
      setJustAdded(false);
    }, 1500);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(380px,480px)]">

      {/* ================= LEFT SECTION ================= */}

      <div>

        {/* ================= PRODUCT MAIN SECTION ================= */}

        <div className="grid gap-6 rounded-3xl border border-[#E5EAE8] bg-white p-5 sm:p-7 md:grid-cols-[280px_minmax(0,1fr)]">

          {/* PRODUCT IMAGE */}

          <div className="relative flex min-h-[280px] items-center justify-center rounded-2xl bg-[#F7FAF9]">

            {product.discount > 0 && (
              <span className="absolute left-4 top-4 rounded-lg bg-[#EAFAF5] px-3 py-1.5 text-xs font-bold text-[#2EB68F]">
                {product.discount}% OFF
              </span>
            )}

            <button
              type="button"
              aria-label="Add to favorites"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-[#E5EAE8] bg-white text-[#64717D] transition hover:border-[#45C9A5] hover:text-[#2EB68F]"
            >
              <Heart size={19} />
            </button>

            {product.image && !imageFailed ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                unoptimized
                sizes="(max-width: 768px) 100vw, 280px"
                onError={() => setImageFailed(true)}
                className="object-contain p-6"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-[#EAFAF5]">
                <ImageIcon size={44} strokeWidth={1.4} className="text-[#2EB68F]" />
              </div>
            )}

          </div>

          {/* PRODUCT INFORMATION */}

          <div className="flex flex-col">

            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2EB68F]">
              {product.category}
            </p>

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-[#17212B] sm:text-3xl">
              {product.name}
            </h1>

            <p className="mt-2 text-sm text-[#6B7280]">
              {product.manufacturer}
            </p>

            <p className="mt-1 text-sm font-medium text-[#64717D]">
              {product.packSize}
            </p>

            {product.saltComposition && (
              <div className="mt-5 rounded-xl bg-[#F7FAF9] p-4">

                <p className="text-xs text-[#8B949E]">
                  Salt composition
                </p>

                <p className="mt-1 text-sm font-semibold text-[#17212B]">
                  {product.saltComposition}
                </p>

              </div>
            )}

            <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-[#2EB68F]">
              <Clock3 size={17} />

              {selectedPharmacy
                ? `Delivery in ${selectedDeliveryTime} mins`
                : "Select a nearby pharmacy"}
            </div>

            <div className="mt-4 flex items-center gap-2">

              {selectedPharmacy ? (
                <>
                  <CheckCircle2
                    size={17}
                    className="text-[#16A34A]"
                  />

                  <span className="text-sm font-semibold text-[#16A34A]">
                    {availableStock} units available nearby
                  </span>
                </>
              ) : (
                <span className="text-sm font-semibold text-[#B86B00]">
                  Checking nearby availability
                </span>
              )}

            </div>

          </div>

        </div>

        {/* ================= DESCRIPTION ================= */}

        <div className="mt-6 rounded-3xl border border-[#E5EAE8] bg-white p-5 sm:p-7">

          <h2 className="text-xl font-bold text-[#17212B]">
            Product information
          </h2>

          <p className="mt-4 text-sm leading-7 text-[#64717D]">
            {product.description}
          </p>

          <div className="mt-6 border-t border-[#EDF0EF] pt-6">

            <h3 className="text-sm font-bold text-[#17212B]">
              Storage instructions
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#64717D]">
              {product.storageInstructions}
            </p>

          </div>

        </div>

        {/* ================= NEARBY PHARMACIES ================= */}

        <NearbyPharmacies
          productId={product.id}
          onPharmacySelect={handlePharmacySelect}
        />

        {/* ================= MEDICAL NOTICE ================= */}

        <div className="mt-6 flex gap-3 rounded-2xl border border-[#DDEAE5] bg-[#F4FCF9] p-5">

          <ShieldCheck
            size={22}
            className="mt-0.5 shrink-0 text-[#2EB68F]"
          />

          <div>

            <h3 className="text-sm font-bold text-[#17212B]">
              Important healthcare information
            </h3>

            <p className="mt-1 text-xs leading-5 text-[#64717D]">
              Product information is provided for general reference.
              Always follow the product label and consult a qualified
              healthcare professional when appropriate.
            </p>

          </div>

        </div>

      </div>

      {/* ================= RIGHT ORDER PANEL ================= */}

      <aside className="lg:sticky lg:top-[105px] lg:self-start">

        <div className="rounded-3xl border border-[#E5EAE8] bg-white p-5 shadow-[0_20px_60px_rgba(23,33,43,0.07)] sm:p-6">

          {/* ================= PRICE ================= */}

          <p className="text-xs text-[#8B949E]">
            {selectedPharmacy
              ? "Selected pharmacy price"
              : "Starting price"}
          </p>

          <div className="mt-2 flex items-end gap-3">

            <span className="text-3xl font-bold text-[#17212B]">
              ₹{selectedPrice}
            </span>

            {selectedMRP > selectedPrice && (
              <span className="pb-1 text-sm text-[#9CA3AF] line-through">
                MRP ₹{selectedMRP}
              </span>
            )}

          </div>

          {savings > 0 && (
            <p className="mt-2 text-xs font-bold text-[#2EB68F]">
              You save ₹{savings}
            </p>
          )}

          {/* ================= DELIVERY ================= */}

          <div className="mt-6 rounded-2xl bg-[#F4FCF9] p-4">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white">

                <Clock3
                  size={20}
                  className="text-[#2EB68F]"
                />

              </div>

              <div>

                <p className="text-xs text-[#8B949E]">
                  Estimated delivery
                </p>

                <p className="mt-0.5 text-sm font-bold text-[#17212B]">
                  {selectedPharmacy
                    ? `${selectedDeliveryTime} mins`
                    : "Select pharmacy"}
                </p>

              </div>

            </div>

          </div>

          {/* ================= LOCATION ================= */}

          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#EDF0EF] p-4">

            <MapPin
              size={19}
              className="mt-0.5 shrink-0 text-[#2EB68F]"
            />

            <div>

              <p className="text-xs text-[#8B949E]">
                Delivering to
              </p>

              <button
                type="button"
                className="mt-1 text-left text-sm font-bold text-[#17212B]"
              >
                Select your location
              </button>

            </div>

          </div>

          {/* ================= PRESCRIPTION ================= */}

          {product.prescriptionRequired && (
            <div className="mt-4 rounded-2xl border border-[#F1D7A7] bg-[#FFF9EE] p-4">

              <div className="flex gap-3">

                <Upload
                  size={19}
                  className="mt-0.5 shrink-0 text-[#B86B00]"
                />

                <div>

                  <p className="text-sm font-bold text-[#17212B]">
                    Prescription required
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#7A6542]">
                    A valid prescription must be verified before this
                    medicine can be supplied.
                  </p>

                  <button
                    type="button"
                    className="mt-3 text-xs font-bold text-[#B86B00]"
                  >
                    Upload prescription
                  </button>

                </div>

              </div>

            </div>
          )}

          {/* ================= QUANTITY ================= */}

          <div className="mt-6">

            <div className="flex items-center justify-between gap-4">

              <p className="text-sm font-bold text-[#17212B]">
                Quantity
              </p>

              {selectedPharmacy && (
                <p className="text-xs text-[#8B949E]">
                  {availableStock} available
                </p>
              )}

            </div>

            <div className="mt-3 flex h-12 w-fit items-center rounded-xl border border-[#DDE5E2]">

              <button
                type="button"
                onClick={decreaseQuantity}
                disabled={quantity === 1}
                aria-label="Decrease quantity"
                className="flex h-full w-12 items-center justify-center text-[#64717D] transition hover:text-[#2EB68F] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Minus size={17} />
              </button>

              <span className="flex w-12 items-center justify-center text-sm font-bold text-[#17212B]">
                {quantity}
              </span>

              <button
                type="button"
                onClick={increaseQuantity}
                disabled={
                  !selectedPharmacy ||
                  quantity >= availableStock
                }
                aria-label="Increase quantity"
                className="flex h-full w-12 items-center justify-center text-[#64717D] transition hover:text-[#2EB68F] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus size={17} />
              </button>

            </div>

          </div>

          {/* ================= ADD TO CART ================= */}

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={
              !selectedPharmacy ||
              availableStock <= 0
            }
            className={`mt-6 flex h-[54px] w-full items-center justify-center gap-2 rounded-xl text-sm font-bold transition disabled:cursor-not-allowed disabled:bg-[#DDE5E2] disabled:text-[#8B949E] ${
              justAdded
                ? "bg-[#2EB68F] text-white"
                : "bg-[#45C9A5] text-[#17212B] hover:bg-[#2EB68F] hover:text-white"
            }`}
          >

            {justAdded ? (
              <>
                <Check size={19} />

                Added to cart
              </>
            ) : selectedPharmacy ? (
              <>
                <ShoppingCart size={19} />

                Add {quantity} to cart
              </>
            ) : (
              <>
                <ShoppingCart size={19} />

                Unavailable nearby
              </>
            )}

          </button>

          {/* ================= PHARMACY INFORMATION ================= */}

          <div className="mt-5 border-t border-[#EDF0EF] pt-5">

            <div className="flex items-center gap-3">

              <Store
                size={18}
                className="text-[#2EB68F]"
              />

              <div>

                <p className="text-xs text-[#8B949E]">
                  Fulfilled by
                </p>

                <p className="mt-0.5 text-sm font-bold text-[#17212B]">
                  {selectedPharmacy
                    ? selectedPharmacy.name
                    : "Select a nearby pharmacy"}
                </p>

                {selectedPharmacy && (
                  <p className="mt-1 text-xs text-[#8B949E]">
                    {selectedPharmacy.distance} km away
                  </p>
                )}

              </div>

            </div>

            <div className="mt-4 flex items-center gap-3">

              <PackageCheck
                size={18}
                className="text-[#2EB68F]"
              />

              <p className="text-xs font-medium text-[#64717D]">
                {selectedPharmacy
                  ? `${availableStock} units currently available`
                  : "Availability verified before order confirmation"}
              </p>

            </div>

          </div>

        </div>

      </aside>

    </div>
  );
}