"use client";

import Image from "next/image";
import { useBrand } from "./BrandContext";

export function CompanyLogo({ className, width, height, priority = false }: { className?: string; width: number; height: number; priority?: boolean }) {
  const brand = useBrand();
  if (!brand.logoDataUrl) {
    return <span className={`flex items-center justify-center font-bold tracking-[0.12em] text-slate-900 ${className ?? ""}`} style={{ width, height }}>{brand.name}</span>;
  }
  return <Image unoptimized src={brand.logoDataUrl} alt={brand.name} width={width} height={height} priority={priority} className={`object-cover object-center ${className ?? ""}`} />;
}