import type { Metadata } from "next";
import Header from "@/src/components/layout/Header";
import AuthProvider from "@/src/components/auth/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Pharma2u", template: "%s | Pharma2u" },
  description:
    "Search medicines from nearby pharmacies and get them delivered fast.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Header />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
