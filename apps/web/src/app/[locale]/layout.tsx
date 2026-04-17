import { notFound } from "next/navigation";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { ContactBand } from "@/components/layout/ContactBand";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { JsonLd } from "@/components/seo/JsonLd";
import { isValidLocale, getSupportedLocales } from "@/lib/i18n";
import { organizationSchema } from "@/lib/schema";
import type { Locale } from "@/types/content";

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

// Pre-render both locale variants at build time
export function generateStaticParams() {
  return getSupportedLocales().map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  if (!isValidLocale(locale)) {
    notFound();
  }

  const l = locale as Locale;

  return (
    <>
      {/*
        Organization schema is injected at the layout level so every page
        carries company identity data — required for GEO (LLM discovery)
        and for search engines to attribute content to Kron Technologies.
      */}
      <JsonLd data={organizationSchema()} />
      <AnnouncementBar locale={l} />
      <SiteHeader locale={l} />
      <main id="main-content">{children}</main>
      <ContactBand locale={l} />
      <SiteFooter locale={l} />
    </>
  );
}
