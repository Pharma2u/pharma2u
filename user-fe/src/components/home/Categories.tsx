import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { categories } from "@/src/data/categories";

export default function Categories() {
  return (
    <section className="bg-white py-12 sm:py-14 lg:py-16">
      <div className="container-custom">

        {/* SECTION HEADER */}

        <div className="flex items-end justify-between gap-4">

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2EB68F]">
              Healthcare essentials
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#17212B] sm:text-3xl">
              Shop by category
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#6B7280] sm:text-base">
              Find medicines and healthcare essentials for your everyday needs.
            </p>
          </div>


          {/* DESKTOP VIEW ALL */}

          <Link
            href="/categories"
            className="hidden shrink-0 items-center gap-2 text-sm font-semibold text-[#2EB68F] transition hover:text-[#17212B] sm:flex"
          >
            View all

            <ArrowRight size={17} />
          </Link>

        </div>


        {/* CATEGORIES GRID */}

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-8">

          {categories.map((category) => {
            const Icon = category.icon;

            return (
              <Link
                key={category.id}
                href={category.href}
                className="group flex min-h-[155px] flex-col items-center justify-center rounded-2xl border border-[#E8ECEF] bg-white px-3 py-5 text-center transition duration-200 hover:-translate-y-1 hover:border-[#45C9A5] hover:shadow-[0_12px_35px_rgba(23,33,43,0.08)]"
              >

                {/* ICON */}

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAFAF5] text-[#2EB68F] transition duration-200 group-hover:bg-[#45C9A5] group-hover:text-[#17212B]">

                  <Icon size={25} strokeWidth={1.8} />

                </div>


                {/* CATEGORY NAME */}

                <h3 className="mt-4 text-sm font-bold text-[#17212B]">
                  {category.name}
                </h3>


                {/* DESCRIPTION */}

                <p className="mt-1 text-[11px] leading-4 text-[#8B949E]">
                  {category.description}
                </p>

              </Link>
            );
          })}

        </div>


        {/* MOBILE VIEW ALL */}

        <div className="mt-6 sm:hidden">

          <Link
            href="/categories"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#DDE5E2] text-sm font-semibold text-[#17212B] transition hover:border-[#45C9A5] hover:bg-[#EAFAF5]"
          >
            View all categories

            <ArrowRight size={17} />
          </Link>

        </div>

      </div>
    </section>
  );
}