import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "./providers";
import type { Brand } from "@/components/branding/BrandContext";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export const metadata: Metadata = {
  title: "Pharma2U Admin",
  description: "Pharma2U operations and administration portal",
};

async function getBrand(): Promise<Brand> {
  try {
    const response = await fetch(`${apiBase}/branding`, { cache: "no-store" });
    if (response.ok) {
      const brand = (await response.json()) as Brand;
      if (typeof brand.name === "string") return brand;
    }
  } catch {}
  return { name: "Pharma2U", logoDataUrl: null };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const brand = await getBrand();
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AppProviders brand={brand}>{children}</AppProviders>
      </body>
    </html>
  );
}