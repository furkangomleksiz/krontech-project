import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import "@/app/globals.css";
import { siteUrl } from "@/lib/i18n";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: { default: "Kron Technologies", template: "%s | Kron Technologies" },
  description: "Enterprise-grade privileged access management and cybersecurity solutions.",
  metadataBase: new URL(siteUrl),
  icons: { icon: "/favicon.ico" },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const headersList = await headers();
  // x-locale is set by middleware.ts for every request
  const locale = headersList.get("x-locale") ?? "en";

  return (
    <html lang={locale} className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
