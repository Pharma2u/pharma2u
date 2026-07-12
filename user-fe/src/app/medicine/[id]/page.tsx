import Link from "next/link";
import { notFound } from "next/navigation";

import { ChevronRight, Home } from "lucide-react";

import MedicineDetails from "@/src/components/medicine/MedicineDetails";
import { products } from "@/src/data/products";

interface MedicinePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function MedicinePage({
  params,
}: MedicinePageProps) {
  const { id } = await params;

  const productId = Number(id);

  const product = products.find(
    (item) => item.id === productId
  );

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#F8FBFA]">
      <div className="container-custom py-6 sm:py-8 lg:py-10">
        {/* BREADCRUMBS */}

        <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs text-[#8B949E]">
          <Link
            href="/"
            aria-label="Home"
            className="transition hover:text-[#2EB68F]"
          >
            <Home size={14} />
          </Link>

          <ChevronRight size={13} />

          <Link
            href="/search"
            className="transition hover:text-[#2EB68F]"
          >
            Products
          </Link>

          <ChevronRight size={13} />

          <span className="max-w-[220px] truncate font-medium text-[#17212B] sm:max-w-none">
            {product.name}
          </span>
        </nav>

        {/* MEDICINE DETAILS */}

        <MedicineDetails product={product} />
      </div>
    </main>
  );
}