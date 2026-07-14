"use client";

import { useEffect, useState } from "react";
import { AlertCircle, MapPin, Store } from "lucide-react";
import PharmacyCard from "@/src/components/pharmacy/PharmacyCard";
import {
  getPharmaciesForProduct,
  type PharmacyWithInventory,
} from "@/src/lib/pharmacy";

interface NearbyPharmaciesProps {
  productId: string | number;
  onPharmacySelect: (pharmacy: PharmacyWithInventory | null) => void;
}

export default function NearbyPharmacies({
  productId,
  onPharmacySelect,
}: NearbyPharmaciesProps) {
  const [pharmacies, setPharmacies] = useState<PharmacyWithInventory[]>([]);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadAvailability() {
      setLoading(true);
      setError("");
      setSelectedPharmacyId(null);
      onPharmacySelect(null);

      try {
        const availablePharmacies = await getPharmaciesForProduct(productId);
        if (!active) return;

        setPharmacies(availablePharmacies);
        const defaultPharmacy = availablePharmacies[0] ?? null;
        setSelectedPharmacyId(defaultPharmacy?.id ?? null);
        onPharmacySelect(defaultPharmacy);
      } catch (caught) {
        if (!active) return;
        setPharmacies([]);
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load pharmacy availability.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadAvailability();
    return () => {
      active = false;
    };
  }, [productId, onPharmacySelect]);

  function handlePharmacySelect(pharmacyId: string) {
    const pharmacy = pharmacies.find((item) => item.id === pharmacyId);
    if (!pharmacy) return;

    setSelectedPharmacyId(pharmacy.id);
    onPharmacySelect(pharmacy);
  }

  if (loading) {
    return (
      <section className="mt-6 rounded-3xl border border-[#E5EAE8] bg-white p-5 text-center text-sm text-[#64717D] sm:p-7">
        Checking pharmacy availability...
      </section>
    );
  }

  if (pharmacies.length === 0) {
    return (
      <section className="mt-6 rounded-3xl border border-[#E5EAE8] bg-white p-5 sm:p-7">
        <div className="flex flex-col items-center py-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF5E6] text-[#B86B00]">
            <AlertCircle size={24} />
          </div>
          <h2 className="mt-4 text-lg font-bold text-[#17212B]">
            Currently unavailable nearby
          </h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-[#64717D]">
            {error || "We could not find this medicine in stock at nearby pharmacies."}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-3xl border border-[#E5EAE8] bg-white p-5 sm:p-7">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EAFAF5] text-[#2EB68F]">
          <Store size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#17212B]">Available pharmacies</h2>
          <p className="mt-1 text-sm text-[#64717D]">
            Select the pharmacy that will fulfil this medicine.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {pharmacies.map((pharmacy) => (
          <PharmacyCard
            key={pharmacy.id}
            pharmacy={pharmacy}
            selected={selectedPharmacyId === pharmacy.id}
            onSelect={handlePharmacySelect}
          />
        ))}
      </div>

      <p className="mt-4 flex items-center gap-2 text-xs text-[#8B949E]">
        <MapPin size={14} /> Availability and stock are loaded from the pharmacy catalogue.
      </p>
    </section>
  );
}