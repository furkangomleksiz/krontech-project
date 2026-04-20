import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/sections/PageHero";
import { ResourcesHubSection } from "@/components/sections/ResourcesHubSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { getPublicPage } from "@/lib/api/public-content";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbSchema } from "@/lib/schema";
import { isValidLocale } from "@/lib/i18n";
import type { Locale } from "@/types/content";

interface ResourcesPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ResourcesPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const page = await getPublicPage(locale as Locale, "resources");
  return buildMetadata(page.seo, locale as Locale);
}

export default async function ResourcesPage({ params }: ResourcesPageProps) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const l = locale as Locale;

  const title = l === "tr" ? "Siber Güvenlik Kaynakları" : "Cybersecurity Resources";
  const subtitle =
    l === "tr"
      ? "Webinarlar, vaka çalışmaları ve veri sayfalarından oluşan siber güvenlik kütüphanemizi keşfederek Kron'un üst düzey Ayrıcalıklı Erişim Yönetimi çözümleri hakkında daha fazla bilgi edinin."
      : "Explore our cybersecurity library of webinars, case studies, and datasheets to learn more about Kron's high-end Privileged Access Management solutions.";

  const resourcesLabel = l === "tr" ? "Kaynaklar" : "Resources";

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { label: "Home", href: `/${l}` },
          { label: resourcesLabel },
        ])}
      />
      <PageHero
        title={title}
        subtitle={subtitle}
        centered
        photoLayout="stack"
        backgroundImageUrl="/resources-banner.jpg"
        breadcrumbs={[
          { label: "Home", href: `/${l}` },
          { label: resourcesLabel },
        ]}
      />

      <ResourcesHubSection locale={l} />
    </>
  );
}
