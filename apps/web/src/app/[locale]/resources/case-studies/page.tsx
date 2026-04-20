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
  const title = l === "tr" ? "Vaka Çalışmaları | Kron" : "Case Studies | Kron";
  const description =
    l === "tr"
      ? "Ayrıcalıklı Erişim Yönetimi vaka çalışmaları — PDF kaynakları indirin."
      : "Privileged Access Management case studies — download PDF resources.";
  return { title, description };
}

export default async function CaseStudiesPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const l = locale as Locale;
  const home = l === "tr" ? "Ana Sayfa" : "Home";
  const resources = l === "tr" ? "Kaynaklar" : "Resources";

  const title =
    l === "tr"
      ? "Ayrıcalıklı Erişim Yönetimi Vaka Çalışmaları"
      : "Privileged Access Management Case Studies";
  const subtitle =
    l === "tr"
      ? "Başarılı Ayrıcalıklı Erişim Yönetimi (PAM) vaka çalışmalarıyla hassas verilerinizi ve kritik sistemlerinizi nasıl koruyabileceğinizi keşfedin."
      : "Find out how to protect your sensitive data and critical systems with successful Privileged Access Management (PAM) case studies.";

  const items = await getPublicResources(l, "CASE_STUDY");
  const emptyMessage =
    l === "tr"
      ? "Henüz yayınlanmış vaka çalışması yok. Yakında burada listelenecek."
      : "No published case studies yet. Check back soon.";

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { label: home, href: `/${l}` },
          { label: resources, href: `/${l}/resources` },
          { label: l === "tr" ? "Vaka Çalışmaları" : "Case Studies" },
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
          { label: l === "tr" ? "Vaka Çalışmaları" : "Case Studies" },
        ]}
      />
      <ResourceDocumentGrid locale={l} items={items} emptyMessage={emptyMessage} />
    </>
  );
}
