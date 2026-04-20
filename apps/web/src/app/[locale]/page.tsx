import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CmsPagesHighlightsSection } from "@/components/sections/CmsPagesHighlightsSection";
import { HomeHero } from "@/components/sections/HomeHero";
import { ProductCardsSection } from "@/components/sections/ProductCardsSection";
import { StatsSection } from "@/components/sections/StatsSection";
import { WhyKronSection } from "@/components/sections/WhyKronSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { getPublicPage, getPublicProductList, getPublicPublishedPageList } from "@/lib/api/public-content";
import { mockAwards, mockStats } from "@/lib/api/mock-content";
import { buildMetadata } from "@/lib/seo";
import { websiteSchema } from "@/lib/schema";
import { isValidLocale } from "@/lib/i18n";
import type { Locale } from "@/types/content";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const page = await getPublicPage(locale as Locale, "home");
  return buildMetadata(page.seo, locale as Locale);
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const l = locale as Locale;
  const [cmsPages, products] = await Promise.all([
    getPublicPublishedPageList(l, { limit: 24 }),
    getPublicProductList(l),
  ]);

  return (
    <>
      {/*
        WebSite schema placed on the homepage only — includes SearchAction
        for potential sitelinks search box. Organization schema is already
        injected by the locale layout.
      */}
      <JsonLd data={websiteSchema(l)} />
      <HomeHero locale={l} />
      <ProductCardsSection locale={l} products={products} />
      <WhyKronSection locale={l} awards={mockAwards} />
      <StatsSection locale={l} stats={mockStats} />
      <CmsPagesHighlightsSection locale={l} pages={cmsPages} />
    </>
  );
}
