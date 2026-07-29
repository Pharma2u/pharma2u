"use client";

import { createContext, useContext } from "react";

export type Brand = { name: string; logoDataUrl: string | null };
const BrandContext = createContext<Brand>({ name: "Pharma2U", logoDataUrl: null });

export function BrandProvider({ brand, children }: { brand: Brand; children: React.ReactNode }) {
  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
}

export function useBrand() {
  return useContext(BrandContext);
}