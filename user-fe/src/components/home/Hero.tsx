import Link from "next/link";

import {
  ArrowRight,
  Clock3,
  FileText,
  ShieldCheck,
  Upload,
} from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#F4FCF9]">
      {/* DECORATIVE BACKGROUND */}

      <div className="pointer-events-none absolute -right-24 -top-24 h-[320px] w-[320px] rounded-full bg-[#45C9A5]/10 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-32 -left-24 h-[320px] w-[320px] rounded-full bg-[#45C9A5]/10 blur-3xl" />

      <div className="container-custom relative">
        <div className="grid min-h-[560px] items-center gap-10 py-12 lg:grid-cols-2 lg:py-16">
          {/* ================= LEFT CONTENT ================= */}

          <div className="max-w-[680px]">
            {/* DELIVERY BADGE */}

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#45C9A5]/30 bg-white px-4 py-2 shadow-sm">
              <Clock3
                size={16}
                className="text-[#2EB68F]"
              />

              <span className="text-xs font-semibold text-[#17212B] sm:text-sm">
                Fast medicine delivery near you
              </span>
            </div>

            {/* HEADING */}

            <h1 className="max-w-[650px] text-[42px] font-bold leading-[1.08] tracking-[-0.04em] text-[#17212B] sm:text-5xl lg:text-[64px]">
              Medicines delivered within{" "}
              <span className="text-[#45C9A5]">
                25 minutes.
              </span>
            </h1>

            {/* DESCRIPTION */}

            <p className="mt-5 max-w-[570px] text-base leading-7 text-[#64717D] sm:text-lg">
              Search medicines and healthcare products from pharmacies
              near you and get them delivered quickly to your doorstep.
            </p>

            {/* CTA BUTTONS */}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/search"
                className="inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-[#45C9A5] px-6 text-sm font-bold text-[#17212B] transition duration-200 hover:bg-[#2EB68F] hover:text-white"
              >
                Order Medicines

                <ArrowRight size={18} />
              </Link>

              <Link
                href="/prescriptions"
                className="inline-flex h-13 items-center justify-center gap-2 rounded-xl border border-[#DDE5E2] bg-white px-6 text-sm font-semibold text-[#17212B] transition duration-200 hover:border-[#45C9A5] hover:bg-[#EAFAF5]"
              >
                <Upload
                  size={18}
                  className="text-[#2EB68F]"
                />

                Upload Prescription
              </Link>
            </div>

            {/* TRUST POINTS */}

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck
                  size={17}
                  className="text-[#2EB68F]"
                />

                <span className="text-xs font-medium text-[#64717D] sm:text-sm">
                  Trusted pharmacies
                </span>
              </div>

              <div className="flex items-center gap-2">
                <FileText
                  size={17}
                  className="text-[#2EB68F]"
                />

                <span className="text-xs font-medium text-[#64717D] sm:text-sm">
                  Easy prescription upload
                </span>
              </div>
            </div>
          </div>

          {/* ================= RIGHT VISUAL ================= */}

          <div className="relative hidden min-h-[450px] items-center justify-center lg:flex">
            {/* LARGE CIRCLE */}

            <div className="absolute h-[420px] w-[420px] rounded-full bg-[#DDF8EF]" />

            <div className="relative w-full max-w-[470px]">
              {/* MAIN CARD */}

              <div className="relative mx-auto w-[330px] rounded-[32px] border border-white/80 bg-white p-5 shadow-[0_25px_70px_rgba(23,33,43,0.12)]">
                {/* CARD TOP */}

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#8B949E]">
                      Delivery time
                    </p>

                    <p className="mt-1 text-lg font-bold text-[#17212B]">
                      10 minutes
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EAFAF5]">
                    <Clock3
                      size={21}
                      className="text-[#2EB68F]"
                    />
                  </div>
                </div>

                {/* DELIVERY PROGRESS */}

                <div className="mt-6 rounded-2xl bg-[#F6FAF8] p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#64717D]">
                      Your medicines
                    </span>

                    <span className="text-xs font-bold text-[#2EB68F]">
                      On the way
                    </span>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#DDEAE5]">
                    <div className="h-full w-[72%] rounded-full bg-[#45C9A5]" />
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
                      <span className="text-2xl">
                        💊
                      </span>
                    </div>

                    <div>
                      <p className="text-sm font-bold text-[#17212B]">
                        Order confirmed
                      </p>

                      <p className="mt-0.5 text-xs text-[#8B949E]">
                        Pharmacy is preparing your order
                      </p>
                    </div>
                  </div>
                </div>

                {/* RIDER */}

                <div className="mt-4 flex items-center justify-between rounded-2xl border border-[#EDF0EF] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#17212B] text-sm text-white">
                      G
                    </div>

                    <div>
                      <p className="text-sm font-bold text-[#17212B]">
                        Delivery partner
                      </p>

                      <p className="text-xs text-[#8B949E]">
                        Arriving soon
                      </p>
                    </div>
                  </div>

                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EAFAF5]">
                    <ArrowRight
                      size={17}
                      className="text-[#2EB68F]"
                    />
                  </div>
                </div>
              </div>

              {/* FLOATING PHARMACY CARD */}

              <div className="absolute -left-2 top-16 rounded-2xl border border-[#EDF0EF] bg-white px-4 py-3 shadow-xl">
                <p className="text-[11px] text-[#8B949E]">
                  Nearby pharmacies
                </p>

                <p className="mt-1 text-sm font-bold text-[#17212B]">
                  12 available
                </p>
              </div>

              {/* FLOATING DELIVERY CARD */}

              <div className="absolute -right-2 bottom-16 flex items-center gap-2 rounded-2xl border border-[#EDF0EF] bg-white px-4 py-3 shadow-xl">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EAFAF5]">
                  <ShieldCheck
                    size={16}
                    className="text-[#2EB68F]"
                  />
                </div>

                <div>
                  <p className="text-[11px] text-[#8B949E]">
                    Safe delivery
                  </p>

                  <p className="text-xs font-bold text-[#17212B]">
                    Verified
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
