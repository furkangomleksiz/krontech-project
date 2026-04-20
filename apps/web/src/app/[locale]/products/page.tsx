import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/sections/PageHero";
import { ProductsCatalogSection } from "@/components/sections/ProductsCatalogSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { getPublicProductList } from "@/lib/api/public-content";
import { breadcrumbSchema } from "@/lib/schema";
import { isValidLocale } from "@/lib/i18n";
import type { Locale } from "@/types/content";

interface ProductsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ProductsPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const l = locale as Locale;
  const title = l === "tr" ? "Ürünler | Kron" : "Products | Kron";
  const description =
    l === "tr"
      ? "Kron'un ayrıcalıklı erişim yönetimi ve siber güvenlik yazılım ürünlerini keşfedin."
      : "Explore Kron's privileged access management and cybersecurity software products.";
  return { title, description };
}

export default async function ProductsPage({ params }: ProductsPageProps) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const l = locale as Locale;
  const products = await getPublicProductList(l);

  const title = l === "tr" ? "Ürünler" : "Products";
  const subtitle =
    l === "tr"
      ? "Telekom ve siber güvenlik alanında kurumsal yazılım çözümlerimizi keşfedin."
      : "Explore Kron Technologies' enterprise software products for telecom and cybersecurity.";

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { label: "Home", href: `/${l}` },
          { label: l === "tr" ? "Ürünler" : "Products" },
        ])}
      />
      <PageHero
        title={title}
        subtitle={subtitle}
        centered
        breadcrumbs={[
          { label: "Home", href: `/${l}` },
          { label: l === "tr" ? "Ürünler" : "Products" },
        ]}
      />
      <ProductsCatalogSection locale={l} products={products} />
    </>
  );
}
