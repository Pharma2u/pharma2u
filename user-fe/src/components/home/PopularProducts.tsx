import Link from "next/link";

import { ArrowRight } from "lucide-react";

import ProductCard from "@/src/components/medicine/ProductCard";
import { products } from "@/src/data/products";

export default function PopularProducts() {
  return (
    <section className="bg-white py-12 sm:py-14 lg:py-16">
      <div className="container-custom">

        {/* SECTION HEADER */}

        <div className="flex items-end justify-between gap-4">

          <div>

            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2EB68F]">
              Popular near you
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#17212B] sm:text-3xl">
              Popular medicines & products
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#6B7280] sm:text-base">
              Frequently ordered medicines and healthcare essentials
              available near your location.
            </p>

          </div>


          {/* DESKTOP VIEW ALL */}

          <Link
            href="/products"
            className="hidden shrink-0 items-center gap-2 text-sm font-semibold text-[#2EB68F] transition hover:text-[#17212B] sm:flex"
          >
            View all products

            <ArrowRight size={17} />
          </Link>

        </div>


        {/* PRODUCT GRID */}

        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">

          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}

        </div>


        {/* MOBILE VIEW ALL */}

        <div className="mt-6 sm:hidden">

          <Link
            href="/products"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#DDE5E2] text-sm font-semibold text-[#17212B] transition hover:border-[#45C9A5] hover:bg-[#EAFAF5]"
          >
            View all products

            <ArrowRight size={17} />
          </Link>

        </div>

      </div>
    </section>
  );
}