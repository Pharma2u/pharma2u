import Link from "next/link";
import {
  ArrowRight,
  FileUp,
  PackageSearch,
} from "lucide-react";
import ProductCard from "@/src/components/medicine/ProductCard";
import NearbyPharmaciesSection from "@/src/components/home/NearbyPharmaciesSection";
import { getPublicProducts } from "@/src/lib/products";
import { getHomepageBanners } from "@/src/lib/homepageBanners";
import HomepageBannerCarousel from "@/src/components/home/HomepageBannerCarousel";
import type { Product } from "@/src/data/products";

const categoryLabel = (value: string) =>
  value.split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-[#DCD6EC] bg-[#FAF9FE] px-6 text-center">
      <PackageSearch className="mb-3 text-[#6A3EE6]" size={30} />
      <p className="text-sm font-semibold text-[#28243A]">{message}</p>
      <p className="mt-1 text-xs text-[#777386]">
        Inventory will appear here when pharmacies add available stock.
      </p>
    </div>
  );
}

function ProductShelf({
  title,
  subtitle,
  products,
}: {
  title: string;
  subtitle: string;
  products: Product[];
}) {
  if (!products.length) return null;

  return (
    <section className="mt-11">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-[#201C35] sm:text-2xl">
            {title}
          </h2>
          <p className="mt-1 text-xs text-[#777386]">{subtitle}</p>
        </div>
        <Link
          href="/products"
          className="flex shrink-0 items-center gap-1 text-xs font-bold text-[#6238E4]"
        >
          See all <ArrowRight size={15} />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {products.slice(0, 6).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

export default async function LandingPage() {
  const [products, banners] = await Promise.all([getPublicProducts(), getHomepageBanners()]);

  const categories = Array.from(
    new Set(products.map((product) => product.category).filter(Boolean)),
  );
  const categoryGroups = categories.map((category) => ({
    category,
    products: products.filter((product) => product.category === category),
  }));

  return (
    <main className="bg-white text-[#201C35]">
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6">
        <HomepageBannerCarousel banners={banners} />
        <section className="mt-10">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">
                Shop by category
              </h2>
              <p className="mt-1 text-xs text-[#777386]">
                Categories currently stocked by pharmacies
              </p>
            </div>
            <Link href="/categories" className="flex items-center gap-1 text-xs font-bold text-[#6238E4]">
              See all <ArrowRight size={15} />
            </Link>
          </div>
          {categories.length ? (
            <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none]">
              {categories.map((category) => (
                <Link
                  key={category}
                  href={`/products?category=${encodeURIComponent(category)}`}
                  className="flex min-w-32 flex-col items-center justify-center rounded-2xl border border-[#EAE5F3] bg-gradient-to-br from-[#F4F0FF] to-[#FBFAFF] px-4 py-6 text-center transition hover:-translate-y-1 hover:border-[#CFC1F7]"
                >
                  <PackageSearch size={28} className="text-[#6238E4]" />
                  <b className="mt-3 text-xs">{categoryLabel(category)}</b>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState message="No product categories are available yet." />
          )}
        </section>

        <NearbyPharmaciesSection />

        <ProductShelf
          title="Available now"
          subtitle="Live products currently in stock"
          products={products}
        />

        {categoryGroups.map(({ category, products: categoryProducts }) => (
          <ProductShelf
            key={category}
            title={categoryLabel(category)}
            subtitle={`Available from participating pharmacies`}
            products={categoryProducts}
          />
        ))}

        {!products.length && (
          <section className="mt-11">
            <EmptyState message="No products are currently in stock." />
          </section>
        )}

        <section className="my-12 flex flex-col items-start justify-between gap-5 rounded-2xl border border-[#DDD3F8] bg-[#F2EDFF] p-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white text-[#6238E4]">
              <FileUp size={25} />
            </span>
            <div>
              <h2 className="text-lg font-extrabold">Have a prescription?</h2>
              <p className="mt-1 text-xs leading-5 text-[#6E697B]">
                Upload it and let a pharmacy review your medicine request.
              </p>
            </div>
          </div>
          <Link
            href="/prescriptions"
            className="flex items-center gap-2 rounded-xl bg-[#6238E4] px-5 py-3 text-xs font-bold text-white"
          >
            Upload prescription <ArrowRight size={15} />
          </Link>
        </section>
      </div>
      <footer className="border-t border-[#ECE8F1] py-7">
        <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-4 px-4 text-xs text-[#777386] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div><b className="text-lg text-[#6238E4]">Pharma2U</b><p>Medicines delivered from real local inventory.</p></div>
          <div className="flex flex-wrap gap-5"><Link href="/pharmacies">Pharmacies</Link><Link href="/orders">Orders</Link><Link href="/prescriptions">Prescriptions</Link><Link href="/profile">Account</Link></div>
          <p>Ã‚Â© 2026 Pharma2U</p>
        </div>
      </footer>
    </main>
  );
}



