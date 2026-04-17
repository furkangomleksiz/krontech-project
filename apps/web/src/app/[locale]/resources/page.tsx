import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DatasheetGrid } from "@/components/sections/DatasheetGrid";
import { PageHero } from "@/components/sections/PageHero";
import { ProductTabNav } from "@/components/sections/ProductTabNav";
import { JsonLd } from "@/components/seo/JsonLd";
import { getPublicPage } from "@/lib/api/public-content";
import { mockDatasheets } from "@/lib/api/mock-content";
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

  const title = l === "tr" ? "Kron PAM" : "Kron PAM";
  const subtitle =
    l === "tr"
      ? "Esnek, merkezi ve katmanlı savunma güvenliği mimarisiyle Ayrıcalıklı Erişim Yönetimi platformunu keşfedin."
      : "Establish a flexible, centrally managed and layered defense security architecture against insider threats with the world-leading Privileged Access Management platform.";

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { label: "Home", href: `/${l}` },
          { label: "Identity & Access Management" },
          { label: "Resources" },
        ])}
      />
      <PageHero
        title={title}
        subtitle={subtitle}
        breadcrumbs={[
          { label: "Home", href: `/${l}` },
          { label: "Identity & Access Management", href: "#" },
          { label: "Resources" },
        ]}
        ctaPrimary={{ label: "Download Datasheet", href: "#" }}
        ctaSecondary={{ label: "Request a Demo", href: `/${l}/contact` }}
      />

      <ProductTabNav activeTab="resources" />

      {/* Resources intro */}
      <section className="resources-intro section-pad" aria-label="Resources overview">
        <div className="container">
          <div className="resources-intro__inner">
            <div>
              <h2 className="resources-intro__title">
                {l === "tr"
                  ? "Üstün Ayrıcalıklı Erişim Yönetimi için Kaynaklar"
                  : "Resources for the Ultimate Privileged Access Management"}
              </h2>
              <p className="resources-intro__desc">
                {l === "tr"
                  ? "Kron PAM'ın özelliklerini öğrenin ve dünyanın önde gelen PAM çözümünü detaylandıran veri sayfalarını indirin."
                  : "Learn more about privileged access management and find Kron PAM's features. Download the datasheets detailing Kron's world-leading PAM solution."}
              </p>
            </div>
            <div className="resources-intro__image" aria-hidden="true" />
          </div>
        </div>
      </section>

      <DatasheetGrid datasheets={mockDatasheets} locale={l} />
    </>
  );
}
