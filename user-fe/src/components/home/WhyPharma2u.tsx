import Link from "next/link";
import { ArrowRight, FileText, MapPin, ShieldCheck, Zap } from "lucide-react";

const benefits = [
  {
    title: "Fast local delivery",
    description: "See delivery estimates before you place an order.",
    icon: Zap,
  },
  {
    title: "Verified pharmacies",
    description: "Order from trusted pharmacies around your location.",
    icon: ShieldCheck,
  },
  {
    title: "Easy prescriptions",
    description: "Upload a prescription and let the pharmacy review it.",
    icon: FileText,
  },
];

export default function WhyPharma2u() {
  return (
    <section className="bg-[#F8FBFA] py-12 sm:py-16">
      <div className="container-custom">
        <div className="rounded-[32px] border border-[#E5EAE8] bg-white p-6 shadow-[0_16px_50px_rgba(18,25,52,.06)] sm:p-10">
          <div className="grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-[#2EB68F]">
                Designed around you
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#17212B] sm:text-4xl">
                Healthcare delivery made reassuringly simple.
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-7 text-[#64717D] sm:text-base">
                From finding nearby medicines to watching your order arrive,
                Pharma2u keeps every step clear and easy to follow.
              </p>
              <Link
                href="/pharmacies"
                className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#5B3DF5] transition hover:gap-3"
              >
                Explore nearby pharmacies
                <ArrowRight size={17} />
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {benefits.map(({ title, description, icon: Icon }) => (
                <article
                  key={title}
                  className="card-lift rounded-2xl border border-[#E8ECEF] bg-[#FAFBFF] p-5"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F1EFFF] text-[#5B3DF5]">
                    <Icon size={21} />
                  </div>
                  <h3 className="mt-5 text-sm font-bold text-[#17212B]">
                    {title}
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-[#64717D]">
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-[#EDF0EF] pt-6 text-sm text-[#64717D]">
            <span className="flex items-center gap-2 font-semibold text-[#17212B]">
              <MapPin size={17} className="text-[#14B8A6]" />
              Choose a delivery location to see what is available near you.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
