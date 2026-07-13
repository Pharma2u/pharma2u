import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "./providers";
export const metadata: Metadata = {
  title: "Pharma2u Rider",
  description: "Rider application and delivery portal",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
