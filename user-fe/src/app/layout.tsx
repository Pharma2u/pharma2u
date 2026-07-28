import type { Metadata } from "next";
import Header from "@/src/components/layout/Header";
import AuthProvider from "@/src/components/auth/AuthProvider";
import { getCompanyBranding } from "@/src/lib/branding";
import "./globals.css";
import "mapbox-gl/dist/mapbox-gl.css";

export const metadata: Metadata = {
  title: { default: "Pharma2u", template: "%s | Pharma2u" },
  description:
    "Search medicines from nearby pharmacies and get them delivered fast.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const brand = await getCompanyBranding();

  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Header brand={brand} />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
