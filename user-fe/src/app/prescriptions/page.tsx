import Link from "next/link";

export default function PrescriptionsPage() {
  return (
    <main className="min-h-screen bg-[#F8FBFA]">
      <div className="container-custom py-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2EB68F]">Prescription medicines</p>
        <h1 className="mt-2 text-3xl font-bold text-[#17212B]">Prescription verification</h1>
        <p className="mt-3 max-w-2xl text-[#64717D]">For medicines that require a prescription, choose the product first. You will be asked to provide a valid prescription before the order is confirmed.</p>
        <Link href="/products" className="mt-8 inline-flex rounded-xl bg-[#45C9A5] px-5 py-3 text-sm font-bold text-[#17212B]">Browse products</Link>
      </div>
    </main>
  );
}