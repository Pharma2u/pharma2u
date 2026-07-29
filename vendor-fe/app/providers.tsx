"use client";

import { Provider } from "react-redux";
import { store } from "@/store/store";
import { ActionToastProvider } from "@/components/ui/ActionToasts";
import { BrandProvider, type Brand } from "@/components/branding/BrandContext";

export function AppProviders({ children, brand }: { children: React.ReactNode; brand: Brand }) {
  return <Provider store={store}><BrandProvider brand={brand}><ActionToastProvider>{children}</ActionToastProvider></BrandProvider></Provider>;
}