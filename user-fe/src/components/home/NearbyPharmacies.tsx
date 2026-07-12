import Link from "next/link";

import {
  ArrowRight,
  Clock3,
  MapPin,
  Star,
  Store,
} from "lucide-react";

import { pharmacies } from "@/src/data/pharmacies";

export default function NearbyPharmacies() {
  return (
    <section className="bg-[#F8FBFA] py-12 sm:py-14 lg:py-16">
      <div className="container-custom">

        {/* SECTION HEADER */}

        <div className="flex items-end justify-between gap-4">

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2EB68F]">
              Fast delivery near you
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#17212B] sm:text-3xl">
              Nearby pharmacies
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#6B7280] sm:text-base">
              Discover trusted pharmacies near your location and get your
              medicines delivered quickly.
            </p>
          </div>

          {/* DESKTOP VIEW ALL */}

          <Link
            href="/pharmacies"
            className="hidden shrink-0 items-center gap-2 text-sm font-semibold text-[#2EB68F] transition hover:text-[#17212B] sm:flex"
          >
            View all pharmacies

            <ArrowRight size={17} />
          </Link>

        </div>


        {/* PHARMACY GRID */}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {pharmacies.map((pharmacy) => (
            <Link
              key={pharmacy.id}
              href={`/pharmacy/${pharmacy.id}`}
              className="group overflow-hidden rounded-2xl border border-[#E5EAE8] bg-white transition duration-200 hover:-translate-y-1 hover:border-[#45C9A5] hover:shadow-[0_16px_45px_rgba(23,33,43,0.08)]"
            >

              {/* PHARMACY VISUAL */}

              <div className="relative flex h-[150px] items-center justify-center overflow-hidden bg-[#EAFAF5]">

                {/* PLACEHOLDER ICON */}

                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm">

                  <Store
                    size={34}
                    strokeWidth={1.6}
                    className="text-[#2EB68F]"
                  />

                </div>


                {/* OPEN STATUS */}

                <div className="absolute left-3 top-3">

                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-[#16A34A] shadow-sm">

                    <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />

                    Open now

                  </span>

                </div>


                {/* DELIVERY TIME */}

                <div className="absolute bottom-3 right-3">

                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#17212B] px-3 py-1.5 text-xs font-bold text-white shadow-sm">

                    <Clock3 size={13} />

                    {pharmacy.deliveryTime}

                  </span>

                </div>

              </div>


              {/* CARD CONTENT */}

              <div className="p-4">

                {/* PHARMACY NAME */}

                <h3 className="truncate text-base font-bold text-[#17212B] transition group-hover:text-[#2EB68F]">
                  {pharmacy.name}
                </h3>


                {/* ADDRESS */}

                <div className="mt-2 flex items-center gap-1.5 text-[#7B858E]">

                  <MapPin
                    size={14}
                    className="shrink-0"
                  />

                  <p className="truncate text-xs">
                    {pharmacy.address}
                  </p>

                </div>


                {/* INFORMATION */}

                <div className="mt-4 flex items-center justify-between">

                  {/* RATING */}

                  <div className="flex items-center gap-1">

                    <Star
                      size={15}
                      className="fill-[#F5B942] text-[#F5B942]"
                    />

                    <span className="text-sm font-bold text-[#17212B]">
                      {pharmacy.rating}
                    </span>

                    <span className="text-xs text-[#8B949E]">
                      ({pharmacy.reviews})
                    </span>

                  </div>


                  {/* DISTANCE */}

                  <span className="text-xs font-semibold text-[#64717D]">
                    {pharmacy.distance}
                  </span>

                </div>


                {/* MEDICINE AVAILABILITY */}

                <div className="mt-4 border-t border-[#EDF0EF] pt-4">

                  <div className="flex items-center justify-between">

                    <span className="text-xs text-[#8B949E]">
                      Medicines available
                    </span>

                    <span className="text-xs font-bold text-[#2EB68F]">
                      {pharmacy.availableMedicines}+
                    </span>

                  </div>

                </div>

              </div>

            </Link>
          ))}

        </div>


        {/* MOBILE VIEW ALL */}

        <div className="mt-6 sm:hidden">

          <Link
            href="/pharmacies"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#DDE5E2] bg-white text-sm font-semibold text-[#17212B] transition hover:border-[#45C9A5] hover:bg-[#EAFAF5]"
          >
            View all pharmacies

            <ArrowRight size={17} />
          </Link>

        </div>

      </div>
    </section>
  );
}