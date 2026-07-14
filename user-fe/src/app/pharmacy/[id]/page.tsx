import Link from "next/link";
import { notFound } from "next/navigation";
import { pharmacies } from "@/src/data/pharmacies";

export default async function PharmacyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pharmacy = pharmacies.find((item) => item.id === id);
  if (!pharmacy) notFound();

  return (
    <main className="min-h-screen bg-[#F8FBFA]">
      <div className="container-custom py-10">
        <Link href="/pharmacies" className="text-sm font-semibold text-[#2EB68F]">? All pharmacies</Link>
        <h1 className="mt-4 text-3xl font-bold text-[#17212B]">{pharmacy.name}</h1>
        <p className="mt-3 text-[#64717D]">{pharmacy.address}, {pharmacy.city}</p>
        <p className="mt-4 font-semibold text-[#2EB68F]">{pharmacy.deliveryTime} min delivery · {pharmacy.rating} rating</p>
        <Link href="/products" className="mt-8 inline-flex rounded-xl bg-[#45C9A5] px-5 py-3 text-sm font-bold text-[#17212B]">Browse available products</Link>
      </div>
    </main>
  );
}