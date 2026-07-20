import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock3, MapPin, ShieldCheck, Star, Store } from "lucide-react";

import ProductCard from "@/src/components/medicine/ProductCard";
import { pharmacies } from "@/src/data/pharmacies";
import { products } from "@/src/data/products";

export default async function PharmacyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pharmacy = pharmacies.find((item) => item.id === id);

  if (!pharmacy) notFound();

  return (
    <main className="min-h-screen bg-[#F8FBFA]">
      <div className="container-custom py-6 sm:py-10">
        <Link
          href="/pharmacies"
          className="text-sm font-semibold text-[#2EB68F]"
        >
          ← All pharmacies
        </Link>

        <section className="mt-5 overflow-hidden rounded-3xl border border-[#DDE5E2] bg-white shadow-[0_18px_50px_rgba(23,33,43,.06)]">
          <div className="bg-gradient-to-r from-[#101936] via-[#15345C] to-[#5B3DF5] p-6 text-white sm:p-9">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#A9F2DC]">
                  <ShieldCheck size={17} />
                  Verified pharmacy
                </div>
                <h1 className="text-3xl font-bold sm:text-4xl">
                  {pharmacy.name}
                </h1>
                <p className="mt-3 flex items-center gap-2 text-sm text-white/80">
                  <MapPin size={16} />
                  {pharmacy.address}, {pharmacy.city}
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xs text-white/70">Delivery promise</p>
                <p className="mt-1 text-xl font-bold">
                  {pharmacy.deliveryTime} mins
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-5 text-sm sm:grid-cols-3 sm:p-6">
            <span className="flex items-center gap-2 font-semibold text-[#17212B]">
              <Clock3 className="text-[#2EB68F]" size={18} />
              Fast delivery
            </span>
            <span className="flex items-center gap-2 font-semibold text-[#17212B]">
              <Star className="fill-[#F59E0B] text-[#F59E0B]" size={18} />
              {pharmacy.rating} ({pharmacy.reviewCount} reviews)
            </span>
            <span className="flex items-center gap-2 font-semibold text-[#17212B]">
              <Store className="text-[#2EB68F]" size={18} />
              {pharmacy.distance} km away
            </span>
          </div>
        </section>

        <div className="mt-10 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold tracking-[.14em] text-[#2EB68F]">
              STORE CATALOGUE
            </p>
            <h2 className="mt-2 text-2xl font-bold text-[#17212B]">
              Available near you
            </h2>
            <p className="mt-2 text-sm text-[#64717D]">
              Add essentials from this pharmacy to your cart.
            </p>
          </div>
          <span className="hidden rounded-full bg-[#EAFAF5] px-3 py-2 text-xs font-bold text-[#2EB68F] sm:block">
            Open now
          </span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={{
                ...product,
                deliveryTime: `${pharmacy.deliveryTime} mins`,
              }}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
