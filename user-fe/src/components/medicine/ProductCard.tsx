"use client";

import { useState } from "react";

import Image from "next/image";
import Link from "next/link";

import {
  Check,
  Clock3,
  Heart,
  ImageIcon,
  Plus,
} from "lucide-react";

import type { Product } from "@/src/data/products";
import { useCartStore } from "@/src/store/cartStore";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({
  product,
}: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);

  const [justAdded, setJustAdded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const handleAddToCart = () => {
    addItem(product);

    setJustAdded(true);

    window.setTimeout(() => {
      setJustAdded(false);
    }, 1200);
  };

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#E5EAE8] bg-white transition duration-200 hover:-translate-y-1 hover:border-[#45C9A5] hover:shadow-[0_16px_45px_rgba(23,33,43,0.08)]">

      {/* PRODUCT IMAGE */}

      <Link
        href={`/medicine/${product.id}`}
        className="relative flex h-[180px] items-center justify-center overflow-hidden bg-[#F7FAF9]"
      >
        {product.discount > 0 && (
          <span className="absolute left-3 top-3 rounded-lg bg-[#EAFAF5] px-2.5 py-1.5 text-[11px] font-bold text-[#2EB68F]">
            {product.discount}% OFF
          </span>
        )}

        <button
          type="button"
          aria-label="Add to favorites"
          onClick={(event) => {
            event.preventDefault();
          }}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-[#E8ECEF] bg-white text-[#64717D] shadow-sm transition hover:border-[#45C9A5] hover:text-[#2EB68F]"
        >
          <Heart size={17} />
        </button>

        {product.image && !imageFailed ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            unoptimized
            sizes="(max-width: 640px) 50vw, 280px"
            onError={() => setImageFailed(true)}
            className="object-contain p-4"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#EAFAF5]">
            <ImageIcon size={30} strokeWidth={1.5} className="text-[#2EB68F]" />
          </div>
        )}
      </Link>

      {/* CONTENT */}

      <div className="flex flex-1 flex-col p-4">

        <div className="flex items-center gap-1.5 text-[#2EB68F]">
          <Clock3 size={13} />

          <span className="text-[11px] font-bold">
            Delivery in {product.deliveryTime}
          </span>
        </div>

        <Link href={`/medicine/${product.id}`}>
          <h3 className="mt-3 line-clamp-2 min-h-[40px] text-sm font-bold leading-5 text-[#17212B] transition group-hover:text-[#2EB68F]">
            {product.name}
          </h3>
        </Link>

        <p className="mt-1 truncate text-xs text-[#8B949E]">
          {product.manufacturer}
        </p>

        <p className="mt-1 text-xs text-[#64717D]">
          {product.packSize}
        </p>

        {product.prescriptionRequired && (
          <span className="mt-3 w-fit rounded-md bg-[#FFF5E6] px-2 py-1 text-[10px] font-bold text-[#B86B00]">
            Prescription required
          </span>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">

          {/* PRICE */}

          <div>
            <p className="text-base font-bold text-[#17212B]">
              ₹{product.price}
            </p>

            {product.mrp > product.price && (
              <p className="mt-0.5 text-xs text-[#9CA3AF] line-through">
                MRP ₹{product.mrp}
              </p>
            )}
          </div>

          {/* ADD BUTTON */}

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className={`flex h-10 min-w-[78px] items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-bold transition ${
              justAdded
                ? "bg-[#45C9A5] text-[#17212B]"
                : "border border-[#45C9A5] text-[#2EB68F] hover:bg-[#45C9A5] hover:text-[#17212B]"
            }`}
          >
            {justAdded ? (
              <>
                <Check size={15} />
                Added
              </>
            ) : (
              <>
                <Plus size={15} />
                Add
              </>
            )}
          </button>

        </div>
      </div>
    </div>
  );
}