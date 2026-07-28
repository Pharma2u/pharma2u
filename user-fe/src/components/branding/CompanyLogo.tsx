import Image from "next/image";
import type { CompanyBrand } from "@/src/lib/branding";

export function CompanyLogo({
  brand,
  className,
  width,
  height,
  priority = false,
}: {
  brand: CompanyBrand;
  className?: string;
  width: number;
  height: number;
  priority?: boolean;
}) {
  return (
    <Image
      unoptimized
      src={brand.logoUrl || "/images/logo/logo.png"}
      alt={brand.name}
      width={width}
      height={height}
      priority={priority}
      className={`object-contain ${className ?? ""}`}
    />
  );
}
