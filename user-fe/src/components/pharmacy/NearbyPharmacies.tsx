"use client";

import { useEffect, useState } from "react";

import {
  AlertCircle,
  MapPin,
  Store,
} from "lucide-react";

import PharmacyCard from "@/src/components/pharmacy/PharmacyCard";

import { getPharmaciesForProduct } from "@/src/lib/pharmacy";

import type {
  PharmacyWithInventory,
} from "@/src/lib/pharmacy";

interface NearbyPharmaciesProps {
  productId: string | number;

  onPharmacySelect: (
    pharmacy: PharmacyWithInventory | null
  ) => void;
}

export default function NearbyPharmacies({
  productId,
  onPharmacySelect,
}: NearbyPharmaciesProps) {
  const pharmacies = getPharmaciesForProduct(productId);

  const [selectedPharmacyId, setSelectedPharmacyId] =
    useState<string | null>(null);

  useEffect(() => {
    if (pharmacies.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedPharmacyId(null);
      onPharmacySelect(null);

      return;
    }

    const fastestPharmacy = pharmacies[0];

    setSelectedPharmacyId(fastestPharmacy.id);

    onPharmacySelect(fastestPharmacy);
  }, [productId]);

  const handlePharmacySelect = (pharmacyId: string) => {
    const selectedPharmacy = pharmacies.find(
      (pharmacy) => pharmacy.id === pharmacyId
    );

    if (!selectedPharmacy) {
      return;
    }

    setSelectedPharmacyId(selectedPharmacy.id);

    onPharmacySelect(selectedPharmacy);
  };

  if (pharmacies.length === 0) {
    return (
      <section className="mt-6 rounded-3xl border border-[#E5EAE8] bg-white p-5 sm:p-7">
        <div className="flex flex-col items-center justify-center py-10 text-center">

          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF5E6] text-[#B86B00]">
            <AlertCircle size={24} />
          </div>

          <h2 className="mt-4 text-lg font-bold text-[#17212B]">
            Currently unavailable nearby
          </h2>

          <p className="mt-2 max-w-md text-sm leading-6 text-[#64717D]">
            We could not find this medicine in stock at nearby
            pharmacies.
          </p>

        </div>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-3xl border border-[#E5EAE8] bg-white p-5 sm:p-7">

      <div className="flex items-start justify-between gap-4">

        <div>
          <div className="flex items-center gap-2">

            <Store
              size={20}
              className="text-[#2EB68F]"
            />

            <h2 className="text-xl font-bold text-[#17212B]">
              Available at nearby pharmacies
            </h2>

          </div>

          <p className="mt-2 text-sm text-[#64717D]">
            Select a pharmacy based on delivery time and price.
          </p>
        </div>

        <div className="hidden items-center gap-1 rounded-lg bg-[#EAFAF5] px-3 py-2 text-xs font-bold text-[#2EB68F] sm:flex">

          <MapPin size={14} />

          {pharmacies.length} nearby

        </div>

      </div>

      <div className="mt-6 space-y-3">

        {pharmacies.map((pharmacy) => (
          <PharmacyCard
            key={pharmacy.id}
            pharmacy={pharmacy}
            selected={
              selectedPharmacyId === pharmacy.id
            }
            onSelect={handlePharmacySelect}
          />
        ))}

      </div>

    </section>
  );
}