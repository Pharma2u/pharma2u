import Link from "next/link";
import { pharmacies } from "@/src/data/pharmacies";

export default function PharmaciesPage() {
  return (
    <main className="min-h-screen bg-[#F8FBFA]">
      <div className="container-custom py-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2EB68F]">Local fulfilment</p>
        <h1 className="mt-2 text-3xl font-bold text-[#17212B]">Nearby pharmacies</h1>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pharmacies.map((pharmacy) => (
            <Link key={pharmacy.id} href={`/pharmacy/${pharmacy.id}`} className="rounded-2xl border border-[#E5EAE8] bg-white p-5 transition hover:border-[#45C9A5]">
              <h2 className="font-bold text-[#17212B]">{pharmacy.name}</h2>
              <p className="mt-2 text-sm text-[#64717D]">{pharmacy.address}</p>
              <p className="mt-3 text-sm font-semibold text-[#2EB68F]">{pharmacy.deliveryTime} min delivery</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}