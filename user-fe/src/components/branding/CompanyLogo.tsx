"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type Brand = { name: string; logoDataUrl: string | null };
const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export function CompanyLogo({
  className,
  width,
  height,
  priority = false,
}: {
  className?: string;
  width: number;
  height: number;
  priority?: boolean;
}) {
  const [brand, setBrand] = useState<Brand>({
    name: "Pharma2U",
    logoDataUrl: null,
  });

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch(`${apiBase}/branding`, {
          cache: "no-store",
        });
        if (!response.ok) return;
        const next = (await response.json()) as Brand;
        if (active && typeof next.name === "string") setBrand(next);
      } catch {
        // Keep the built-in logo when branding is temporarily unavailable.
      }
    };
    void load();
    const refresh = window.setInterval(() => void load(), 30_000);
    return () => {
      active = false;
      window.clearInterval(refresh);
    };
  }, []);

  return (
    <Image
      unoptimized
      src={brand.logoDataUrl || "/images/logo/logo.png"}
      alt={brand.name}
      width={width}
      height={height}
      priority={priority}
      className={className}
    />
  );
}
