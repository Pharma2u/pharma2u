import SearchResults from "@/src/components/search/SearchResults";
import { getPublicProducts } from "@/src/lib/products";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() || "";
  const products = await getPublicProducts();

  return (
    <main className="min-h-screen bg-[#F8FBFA]">
      <div className="container-custom py-8 sm:py-10 lg:py-12">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2EB68F]">Find your medicines</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#17212B] sm:text-3xl">
            {query ? `Search results for "${query}"` : "Search medicines & healthcare products"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B7280] sm:text-base">
            Compare currently available products from registered pharmacies.
          </p>
        </div>
        <div className="mt-8"><SearchResults query={query} products={products} /></div>
      </div>
    </main>
  );
}