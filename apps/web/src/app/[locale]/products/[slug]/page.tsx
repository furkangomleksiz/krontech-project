import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FeatureRow } from "@/components/sections/FeatureRow";
import { PageHero } from "@/components/sections/PageHero";
import { ProductTabNav } from "@/components/sections/ProductTabNav";
import { JsonLd } from "@/components/seo/JsonLd";
import { getPublicPage } from "@/lib/api/public-content";
import { mockProductFeatures } from "@/lib/api/mock-content";
import { buildMetadata } from "@/lib/seo";
import { softwareProductSchema, breadcrumbSchema } from "@/lib/schema";
import { isValidLocale, canonicalUrl } from "@/lib/i18n";
import type { Locale } from "@/types/content";

interface ProductDetailProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: ProductDetailProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) return {};
  const page = await getPublicPage(locale as Locale, slug);
  return buildMetadata(page.seo, locale as Locale);
}

export default async function ProductDetailPage({ params }: ProductDetailProps) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) notFound();

  const l = locale as Locale;
  const page = await getPublicPage(l, slug);

  const productName = page.hero?.title ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const productDescription = page.hero?.description ?? page.seo.description;
  const productUrl = canonicalUrl(l, `/products/${slug}`);

  const breadcrumbs = [
    { label: "Home", href: `/${l}` },
    { label: "Products", href: "#" },
    { label: productName },
  ];

  return (
    <>
      <JsonLd
        data={[
          softwareProductSchema(productName, productDescription, productUrl),
          breadcrumbSchema(breadcrumbs),
        ]}
      />

      <PageHero
        title={productName}
        subtitle={page.hero?.description}
        breadcrumbs={breadcrumbs}
        ctaPrimary={{ label: "Download Datasheet", href: `/${l}/resources` }}
        ctaSecondary={{ label: "Request a Demo", href: `/${l}/contact` }}
      />

      <ProductTabNav activeTab="solutions" />

      <section className="feature-rows section-pad" aria-label="Product features">
        <div className="container">
          {mockProductFeatures.map((feature) => (
            <FeatureRow key={feature.id} feature={feature} />
          ))}
        </div>
      </section>
    </>
  );
}
