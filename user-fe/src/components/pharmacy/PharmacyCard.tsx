"use client";

import {
  CheckCircle2,
  Clock3,
  MapPin,
  Star,
  Store,
} from "lucide-react";

import type {
  PharmacyWithInventory,
} from "@/src/lib/pharmacy";

interface PharmacyCardProps {
  pharmacy: PharmacyWithInventory;

  selected: boolean;

  onSelect: (pharmacyId: string) => void;
}

export default function PharmacyCard({
  pharmacy,
  selected,
  onSelect,
}: PharmacyCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(pharmacy.id)}
      className={`w-full rounded-2xl border p-4 text-left transition ${
        selected
          ? "border-[#45C9A5] bg-[#F4FCF9]"
          : "border-[#E5EAE8] bg-white hover:border-[#B8DDD2]"
      }`}
    >
      <div className="flex items-start gap-4">

        {/* ICON */}

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#EAFAF5] text-[#2EB68F]">
          <Store size={22} />
        </div>

        {/* INFORMATION */}

        <div className="min-w-0 flex-1">

          <div className="flex items-start justify-between gap-3">

            <div>

              <div className="flex flex-wrap items-center gap-2">

                <h3 className="font-bold text-[#17212B]">
                  {pharmacy.name}
                </h3>

                {pharmacy.isVerified && (
                  <CheckCircle2
                    size={15}
                    className="text-[#2EB68F]"
                  />
                )}

              </div>

              <p className="mt-1 text-xs text-[#8B949E]">
                {pharmacy.address}
              </p>

            </div>

            {/* SELECTION */}

            <div
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                selected
                  ? "border-[6px] border-[#45C9A5]"
                  : "border-2 border-[#DDE5E2]"
              }`}
            />

          </div>

          {/* DETAILS */}

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">

            <div className="flex items-center gap-1 text-xs text-[#64717D]">

              <Clock3
                size={14}
                className="text-[#2EB68F]"
              />

              {pharmacy.deliveryTime} mins

            </div>

            <div className="flex items-center gap-1 text-xs text-[#64717D]">

              <MapPin
                size={14}
                className="text-[#2EB68F]"
              />

              {pharmacy.distance} km

            </div>

            <div className="flex items-center gap-1 text-xs text-[#64717D]">

              <Star
                size={14}
                className="text-[#F59E0B]"
              />

              {pharmacy.rating}

            </div>

          </div>

          {/* INVENTORY */}

          <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-[#EDF0EF] pt-4">

            <div>

              <p className="text-xs text-[#8B949E]">
                Available stock
              </p>

              <p className="mt-1 text-xs font-bold text-[#16A34A]">
                {pharmacy.inventory.stockQuantity} units available
              </p>

            </div>

            <div className="text-right">

              <p className="text-lg font-bold text-[#17212B]">
                ₹{pharmacy.inventory.sellingPrice}
              </p>

              {pharmacy.inventory.mrp >
                pharmacy.inventory.sellingPrice && (
                <p className="text-xs text-[#9CA3AF] line-through">
                  ₹{pharmacy.inventory.mrp}
                </p>
              )}

            </div>

          </div>

        </div>

      </div>
    </button>
  );
}