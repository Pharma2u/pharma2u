import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Clock3,
  MapPin,
  PackageSearch,
  ShieldCheck,
  Store,
} from "lucide-react";
import ProductCard from "@/src/components/medicine/ProductCard";
import { getPublicProducts } from "@/src/lib/products";
import { getPublicPharmacy } from "@/src/lib/pharmacy";

const titleCase = (value: string) =>
  value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export default async function PharmacyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [pharmacy, products] = await Promise.all([
    getPublicPharmacy(id),
    getPublicProducts(id),
  ]);

  if (!pharmacy) notFound();

  const categories = Array.from(
    new Set(products.map((product) => product.category).filter(Boolean)),
  );

  return (
    <main className="min-h-screen bg-[#FAF9FD]">
      <div className="mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-6 sm:py-9">
        <Link
          href="/pharmacies"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#6238E4]"
        >
          <ArrowLeft size={16} /> All nearby pharmacies
        </Link>

        <section className="mt-5 overflow-hidden rounded-3xl border border-[#E6E1ED] bg-white shadow-[0_18px_50px_rgba(42,29,85,0.06)]">
          <div className="relative overflow-hidden bg-gradient-to-r from-[#21173F] via-[#43258E] to-[#6B3CE8] p-6 text-white sm:p-9">
            {pharmacy.bannerPath && <img src={pharmacy.bannerPath} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />}
            <div className="absolute inset-0 bg-[#21173F]/45" />
            <div className="relative">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-[#DDFCEF]">
                  <ShieldCheck size={15} /> Verified pharmacy
                </span>
                <div className="mt-4 flex items-center gap-3">
                  {pharmacy.logoPath && <img src={pharmacy.logoPath} alt={`${pharmacy.name} logo`} className="h-12 w-12 rounded-xl border border-white/30 object-cover" />}
                  <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{pharmacy.name}</h1>
                </div>
                <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-white/80">
                  <MapPin size={17} className="mt-0.5 shrink-0" />
                  {pharmacy.address}
                </p>
              </div>
              <span
                className={`w-fit rounded-full px-4 py-2 text-xs font-extrabold ${
                  pharmacy.isOpen
                    ? "bg-[#DDFCEF] text-[#087552]"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {pharmacy.isOpen ? "Open now" : "Currently closed"}
              </span>
            </div>
          </div>
          </div>

          <div className="grid gap-4 p-5 text-sm sm:grid-cols-3 sm:p-6">
            <span className="flex items-center gap-3 font-semibold text-[#262238]">
              <Clock3 className="text-[#6238E4]" size={19} />
              {pharmacy.deliveryTime !== null
                ? `${pharmacy.deliveryTime} min delivery`
                : "Delivery estimate pending"}
            </span>
            <span className="flex items-center gap-3 font-semibold text-[#262238]">
              <Store className="text-[#13A17A]" size={19} />
              {pharmacy.availableProducts} live products
            </span>
            <span className="flex items-center gap-3 font-semibold text-[#262238]">
              <Clock3 className="text-[#6238E4]" size={19} />
              {pharmacy.openingTime && pharmacy.closingTime
                ? `${pharmacy.openingTime} â€“ ${pharmacy.closingTime}`
                : "Store hours not provided"}
            </span>
          </div>
        </section>

        {categories.length > 1 && (
          <nav className="sticky top-[106px] z-30 mt-7 flex gap-2 overflow-x-auto rounded-2xl border border-[#E9E5F0] bg-white/95 p-2 shadow-sm backdrop-blur [scrollbar-width:none]">
            {categories.map((category) => (
              <a
                key={category}
                href={`#${category.replaceAll(" ", "-")}`}
                className="shrink-0 rounded-xl px-4 py-2.5 text-xs font-bold text-[#5F596C] transition hover:bg-[#F1EDFF] hover:text-[#6238E4]"
              >
                {titleCase(category)}
              </a>
            ))}
          </nav>
        )}

        {products.length ? (
          <div className="pb-10">
            {categories.map((category) => {
              const categoryProducts = products.filter(
                (product) => product.category === category,
              );
              return (
                <section
                  id={category.replaceAll(" ", "-")}
                  key={category}
                  className="scroll-mt-44 pt-9"
                >
                  <div className="mb-5">
                    <h2 className="text-2xl font-black tracking-tight text-[#211D34]">
                      {titleCase(category)}
                    </h2>
                    <p className="mt-1 text-xs text-[#777386]">
                      {categoryProducts.length} products available from this store
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {categoryProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="mt-8 flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-[#DDD7E8] bg-white px-6 text-center">
            <PackageSearch size={34} className="text-[#6238E4]" />
            <h2 className="mt-4 text-base font-bold text-[#28243A]">
              No products are currently available
            </h2>
            <p className="mt-1 text-xs text-[#777386]">
              This pharmacy&apos;s live catalogue will appear when stock is added.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

