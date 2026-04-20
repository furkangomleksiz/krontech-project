import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/sections/PageHero";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCachedPublicProduct,
  getPublicPage,
  productPublicSeoToSeoFields,
} from "@/lib/api/public-content";
import { mockProductFeatures } from "@/lib/api/mock-content";
import { buildMetadata } from "@/lib/seo";
import { softwareProductSchema, breadcrumbSchema } from "@/lib/schema";
import { isValidLocale, canonicalUrl, getSupportedLocales, productSlugs } from "@/lib/i18n";
import type { Locale, ProductDetailTabSection } from "@/types/content";

const ProductDetailTabs = dynamic(() => import("@/components/sections/ProductDetailTabs"), {
  loading: () => (
    <section className="section-pad" aria-hidden="true">
      <div className="container">
        <p style={{ color: "var(--gray-500)", margin: 0 }}>Loading product sections…</p>
      </div>
    </section>
  ),
});

interface ProductDetailProps {
  params: Promise<{ locale: string; slug: string }>;
}

function fallbackDetailTabs(): ProductDetailTabSection[] {
  const cards = mockProductFeatures.map((f, i) => ({
    sortOrder: i,
    title: f.title,
    body: f.description,
    imageUrl: f.imageUrl ?? null,
    imageAlt: null as string | null,
  }));
  return [
    { tab: "solution", cards },
    { tab: "how_it_works", cards: [] },
    { tab: "key_benefits", cards: [] },
    { tab: "resources", cards: [] },
  ];
}

/**
 * Pre-renders known product slugs at build time per locale.
 * Other slugs are generated on demand (ISR + TTL).
 */
export function generateStaticParams(): Array<{ locale: string; slug: string }> {
  const locales = getSupportedLocales();
  return locales.flatMap((locale) => productSlugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({ params }: ProductDetailProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) return {};

  const product = await getCachedPublicProduct(locale as Locale, slug);
  if (product) {
    return buildMetadata(productPublicSeoToSeoFields(product.seo), locale as Locale);
  }

  const page = await getPublicPage(locale as Locale, slug);
  return buildMetadata(page.seo, locale as Locale);
}

export default async function ProductDetailPage({ params }: ProductDetailProps) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) notFound();

  const l = locale as Locale;
  const product = await getCachedPublicProduct(l, slug);

  if (product) {
    const productName = product.title;
    const productDescription = product.summary || product.seo.description;
    const productUrl = canonicalUrl(l, `/products/${slug}`);

    const breadcrumbs = [
      { label: "Home", href: `/${l}` },
      { label: "Products", href: `/${l}/products` },
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
          subtitle={product.summary}
          backgroundImageUrl={product.heroImageUrl ?? undefined}
          breadcrumbs={breadcrumbs}
          ctaPrimary={{ label: "Download Datasheet", href: `/${l}/resources` }}
          ctaSecondary={{ label: "Request a Demo", href: `/${l}/contact` }}
        />

        <ProductDetailTabs
          detailTabs={product.detailTabs}
          locale={l}
          resourcesIntro={product.resourcesIntro}
          linkedResources={product.linkedResources}
        />
      </>
    );
  }

  /* API unavailable: keep the page usable with generic page SEO + placeholder tab content */
  const page = await getPublicPage(l, slug);
  const productName = page.hero?.title ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const productDescription = page.hero?.description ?? page.seo.description;
  const productUrl = canonicalUrl(l, `/products/${slug}`);

  const breadcrumbs = [
    { label: "Home", href: `/${l}` },
    { label: "Products", href: `/${l}/products` },
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

      <ProductDetailTabs detailTabs={fallbackDetailTabs()} locale={l} />
    </>
  );
}
