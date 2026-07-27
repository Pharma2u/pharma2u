import SearchResults from "@/src/components/search/SearchResults";
import { getPublicProducts } from "@/src/lib/products";
import { getPublicPharmacies } from "@/src/lib/pharmacy";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const query = slug.replaceAll("-", " ");
  const [products, pharmacies] = await Promise.all([
    getPublicProducts(),
    getPublicPharmacies(),
  ]);

  return (
    <main className="min-h-screen bg-[#F8FBFA]">
      <div className="container-custom py-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2EB68F]">Category</p>
        <h1 className="mt-2 text-3xl font-bold capitalize text-[#17212B]">{query}</h1>
        <div className="mt-8"><SearchResults query={query} products={products} pharmacies={pharmacies} /></div>
      </div>
    </main>
  );
}
