"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  Crosshair,
  LoaderCircle,
  MapPin,
  PackageSearch,
  Store,
} from "lucide-react";
import LocationModal from "@/src/components/location/LocationModal";
import {
  getNearbyPharmacies,
  type PublicPharmacy,
} from "@/src/lib/pharmacy";
import { useAddressStore } from "@/src/store/addressStore";

export default function NearbyPharmaciesSection({
  fullPage = false,
}: {
  fullPage?: boolean;
}) {
  const [locationOpen, setLocationOpen] = useState(false);
  const [pharmacies, setPharmacies] = useState<PublicPharmacy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addresses = useAddressStore((state) => state.addresses);
  const selectedAddressId = useAddressStore((state) => state.selectedAddressId);
  const selectedAddress = addresses.find(
    (address) => address.id === selectedAddressId,
  );

  useEffect(() => {
    if (
      selectedAddress?.latitude === undefined ||
      selectedAddress.longitude === undefined
    ) {
      return;
    }

    let active = true;

    void (async () => {
      setLoading(true);
      setError("");
      try {
        const items = await getNearbyPharmacies(
          selectedAddress.latitude!,
          selectedAddress.longitude!,
        );
        if (active) setPharmacies(items);
      } catch (reason) {
        if (active) {
          setPharmacies([]);
          setError(
            reason instanceof Error
              ? reason.message
              : "Unable to find nearby pharmacies.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [selectedAddress?.latitude, selectedAddress?.longitude]);

  return (
    <>
      <section className={fullPage ? "" : "mt-11"}>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2
              className={
                fullPage
                  ? "text-3xl font-black tracking-tight text-[#201C35]"
                  : "text-xl font-extrabold tracking-tight text-[#201C35] sm:text-2xl"
              }
            >
              Pharmacies near you
            </h2>
            <p className="mt-1 text-xs text-[#777386]">
              {selectedAddress
                ? `Near ${selectedAddress.fullAddress || selectedAddress.city}`
                : "Select your delivery location to see nearby stores"}
            </p>
          </div>
          {!fullPage && (
            <Link
              href="/pharmacies"
              className="flex shrink-0 items-center gap-1 text-xs font-bold text-[#6238E4]"
            >
              View all <ArrowRight size={15} />
            </Link>
          )}
        </div>

        {!selectedAddress ||
        selectedAddress.latitude === undefined ||
        selectedAddress.longitude === undefined ? (
          <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-[#DCD6EC] bg-[#FAF9FE] px-6 text-center">
            <Crosshair className="mb-3 text-[#6A3EE6]" size={30} />
            <p className="text-sm font-bold text-[#28243A]">
              Choose a precise delivery location
            </p>
            <p className="mt-1 max-w-md text-xs leading-5 text-[#777386]">
              We use your coordinates only to calculate real pharmacy distances
              and show stores within the delivery radius.
            </p>
            <button
              type="button"
              onClick={() => setLocationOpen(true)}
              className="mt-4 rounded-xl bg-[#6238E4] px-5 py-3 text-xs font-bold text-white"
            >
              Select location
            </button>
          </div>
        ) : loading ? (
          <div
            className={
              fullPage
                ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                : "flex gap-4 overflow-hidden"
            }
          >
            {Array.from({ length: fullPage ? 6 : 4 }).map((_, index) => (
              <div
                key={index}
                className="min-w-[250px] flex-1 animate-pulse overflow-hidden rounded-2xl border border-[#ECE8F2]"
              >
                <div className="h-28 bg-[#F0EDF5]" />
                <div className="space-y-3 p-4">
                  <div className="h-4 w-2/3 rounded bg-[#E9E5EE]" />
                  <div className="h-3 w-full rounded bg-[#F0EDF3]" />
                  <div className="h-3 w-1/2 rounded bg-[#F0EDF3]" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex min-h-44 flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50 px-6 text-center">
            <PackageSearch className="mb-3 text-red-500" size={28} />
            <p className="text-sm font-bold text-red-800">{error}</p>
            <button
              type="button"
              onClick={() => setLocationOpen(true)}
              className="mt-3 text-xs font-bold text-[#6238E4]"
            >
              Change location
            </button>
          </div>
        ) : pharmacies.length ? (
          <div
            className={
              fullPage
                ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                : "flex gap-4 overflow-x-auto pb-3 [scrollbar-width:none]"
            }
          >
            {pharmacies.map((pharmacy) => (
              <Link
                href={`/pharmacy/${pharmacy.id}`}
                key={pharmacy.id}
                className="group w-full max-w-[360px] min-w-[250px] flex-none overflow-hidden rounded-2xl border border-[#E9E5F0] bg-white transition hover:-translate-y-1 hover:border-[#CFC2F6] hover:shadow-[0_16px_35px_rgba(52,34,109,0.10)]"
              >
                <div className="relative flex h-28 items-center justify-center bg-gradient-to-br from-[#EAFBF5] to-[#F1EDFF] text-[#6238E4]">
                  {pharmacy.bannerPath ? <img src={pharmacy.bannerPath} alt={`${pharmacy.name} cover`} className="absolute inset-0 h-full w-full object-cover" /> : <Store size={42} strokeWidth={1.7} />}
                  <span className={`absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold shadow-sm ${pharmacy.isOpen ? "text-[#109D70]" : "text-red-700"}`}>
                    {pharmacy.isOpen ? "Open" : "Offline"}
                  </span>
                  {pharmacy.deliveryTime !== null && (
                    <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-lg bg-[#242033] px-2.5 py-1.5 text-[10px] font-bold text-white">
                      <Clock3 size={12} /> {pharmacy.deliveryTime} min
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="truncate text-sm font-bold text-[#211E32]">
                    {pharmacy.name}
                  </h3>
                  <p className="mt-2 flex items-center gap-1 truncate text-[11px] text-[#777386]">
                    <MapPin size={13} className="shrink-0" /> {pharmacy.address}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-[#F0EDF4] pt-3 text-[10px]">
                    <span className="font-semibold text-[#625E6F]">
                      {pharmacy.distance?.toFixed(2)} km away
                    </span>
                    <span className="font-bold text-[#6238E4]">
                      {pharmacy.availableProducts} products
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex min-h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-[#DCD6EC] bg-[#FAF9FE] px-6 text-center">
            <MapPin className="mb-3 text-[#6A3EE6]" size={28} />
            <p className="text-sm font-bold text-[#28243A]">
              No pharmacies within 10 km
            </p>
            <p className="mt-1 text-xs text-[#777386]">
              Try another delivery location or check again later.
            </p>
          </div>
        )}

        {loading && (
          <span className="sr-only">
            <LoaderCircle /> Loading nearby pharmacies
          </span>
        )}
      </section>
      <LocationModal open={locationOpen} onClose={() => setLocationOpen(false)} />
    </>
  );
}


