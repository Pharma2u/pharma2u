import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Header from "@/src/components/layout/Header";
import AuthProvider from "@/src/components/auth/AuthProvider";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "GoCure",
    template: "%s | GoCure",
  },

  description:
    "Search medicines from nearby pharmacies and get them delivered fast with GoCure.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Header />

          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
