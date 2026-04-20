import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/sections/PageHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { getPublicResourceBySlug } from "@/lib/api/public-resources";
import { breadcrumbSchema } from "@/lib/schema";
import { isValidLocale } from "@/lib/i18n";
import type { Locale } from "@/types/content";

interface ResourceDetailPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

function categoryBreadcrumb(
  locale: Locale,
  resourceType: string,
): { label: string; href: string } {
  const resources = locale === "tr" ? "Kaynaklar" : "Resources";
  const base = { label: resources, href: `/${locale}/resources` };
  const t = resourceType.toUpperCase();
  if (t === "CASE_STUDY") {
    return {
      label: locale === "tr" ? "Vaka Çalışmaları" : "Case Studies",
      href: `/${locale}/resources/case-studies`,
    };
  }
  if (t === "DATASHEET") {
    return {
      label: locale === "tr" ? "Veri Sayfaları" : "Datasheets",
      href: `/${locale}/resources/datasheets`,
    };
  }
  return base;
}

export async function generateMetadata({ params }: ResourceDetailPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) return {};
  const l = locale as Locale;
  const resource = await getPublicResourceBySlug(l, slug);
  if (!resource) return { title: locale === "tr" ? "Kaynak" : "Resource" };
  const desc =
    resource.summary.trim().length > 0
      ? resource.summary.trim().slice(0, 160)
      : locale === "tr"
        ? "Kron kaynağını indirin."
        : "Download this Kron resource.";
  return { title: `${resource.title} | Kron`, description: desc };
}

export default async function ResourceDetailPage({ params }: ResourceDetailPageProps) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) notFound();

  const l = locale as Locale;
  const resource = await getPublicResourceBySlug(l, slug);
  if (!resource) notFound();

  const home = l === "tr" ? "Ana Sayfa" : "Home";
  const cat = categoryBreadcrumb(l, resource.resourceType);
  const downloadLabel = l === "tr" ? "İndir" : "Download";
  const backLabel = l === "tr" ? "Tüm kaynaklar" : "All resources";

  const thumbSrc = resource.heroImageUrl ?? resource.previewImageUrl;

  const crumbs = [
    { label: home, href: `/${l}` },
    cat,
    { label: resource.title },
  ];

  return (
    <>
      <JsonLd data={breadcrumbSchema(crumbs)} />
      <PageHero
        variant="light"
        title={resource.title}
        subtitle={resource.summary.trim().length > 0 ? resource.summary : undefined}
        centered
        breadcrumbs={crumbs}
      />
      <section className="section-pad bg-white" aria-label={resource.title}>
        <div className="container">
          <article
            className="resource-doc-card"
            style={{ maxWidth: 560, margin: "0 auto 28px" }}
          >
            <div className="resource-doc-card__thumb" aria-hidden="true">
              {thumbSrc ? <img src={thumbSrc} alt="" loading="eager" /> : null}
            </div>
            <div className="resource-doc-card__body">
              <a
                href={resource.downloadUrl}
                className="btn btn-outline-blue btn-sm resource-doc-card__cta"
                target="_blank"
                rel="noopener noreferrer"
              >
                {downloadLabel}
              </a>
            </div>
          </article>
          <p style={{ textAlign: "center", margin: 0 }}>
            <Link href={cat.href} className="blog-highlight-strip__link">
              {backLabel} &rsaquo;
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
