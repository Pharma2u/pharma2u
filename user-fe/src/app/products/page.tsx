import SearchResults from "@/src/components/search/SearchResults";
import { getPublicProducts } from "@/src/lib/products";

export default async function ProductsPage() {
  const products = await getPublicProducts();

  return (
    <main className="min-h-screen bg-[#F8FBFA]">
      <div className="container-custom py-8 sm:py-10 lg:py-12">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2EB68F]">Pharmacy catalogue</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#17212B] sm:text-3xl">All available products</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B7280] sm:text-base">Products currently in stock at registered pharmacies.</p>
        <div className="mt-8"><SearchResults query="" products={products} /></div>
      </div>
    </main>
  );
}