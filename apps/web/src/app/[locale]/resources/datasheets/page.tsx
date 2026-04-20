import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/sections/PageHero";
import { ResourceDocumentGrid } from "@/components/sections/ResourceDocumentGrid";
import { JsonLd } from "@/components/seo/JsonLd";
import { getPublicResources } from "@/lib/api/public-resources";
import { breadcrumbSchema } from "@/lib/schema";
import { isValidLocale } from "@/lib/i18n";
import type { Locale } from "@/types/content";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const l = locale as Locale;
  const title = l === "tr" ? "Veri Sayfaları | Kron" : "Datasheets | Kron";
  const description =
    l === "tr"
      ? "Single Connect ve Kron ürün veri sayfaları — PDF olarak indirin."
      : "Single Connect and Kron product datasheets — download as PDF.";
  return { title, description };
}

export default async function DatasheetsListingPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const l = locale as Locale;
  const home = l === "tr" ? "Ana Sayfa" : "Home";
  const resources = l === "tr" ? "Kaynaklar" : "Resources";

  const title = l === "tr" ? "Ürün Veri Sayfaları" : "Product Datasheets";
  const subtitle =
    l === "tr"
      ? "Dünya çapında önde gelen Ayrıcalıklı Erişim Yönetimi paketi Single Connect ve diğer çözümlerimizin veri sayfalarını inceleyin."
      : "Review datasheets for Single Connect and our world-leading Privileged Access Management solutions.";

  const items = await getPublicResources(l, "DATASHEET");
  const emptyMessage =
    l === "tr"
      ? "Henüz yayınlanmış veri sayfası yok. Yakında burada listelenecek."
      : "No published datasheets yet. Check back soon.";

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { label: home, href: `/${l}` },
          { label: resources, href: `/${l}/resources` },
          { label: l === "tr" ? "Veri Sayfaları" : "Datasheets" },
        ])}
      />
      <PageHero
        variant="light"
        title={title}
        subtitle={subtitle}
        centered
        breadcrumbs={[
          { label: home, href: `/${l}` },
          { label: resources, href: `/${l}/resources` },
          { label: l === "tr" ? "Veri Sayfaları" : "Datasheets" },
        ]}
      />
      <ResourceDocumentGrid locale={l} items={items} emptyMessage={emptyMessage} />
    </>
  );
}
