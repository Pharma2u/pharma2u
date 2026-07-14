import Link from "next/link";
import { categories } from "@/src/data/categories";

export default function CategoriesPage() {
  return (
    <main className="min-h-screen bg-[#F8FBFA]">
      <div className="container-custom py-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2EB68F]">Browse</p>
        <h1 className="mt-2 text-3xl font-bold text-[#17212B]">Shop by category</h1>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.filter((category) => category.name !== "More").map((category) => (
            <Link key={category.id} href={category.href} className="rounded-2xl border border-[#E5EAE8] bg-white p-5 font-semibold text-[#17212B] transition hover:border-[#45C9A5] hover:text-[#2EB68F]">
              {category.name}
              <p className="mt-1 text-sm font-normal text-[#64717D]">{category.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}