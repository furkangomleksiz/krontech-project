import Link from "next/link";
import { HorizontalCarousel } from "@/components/ui/HorizontalCarousel";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { publicPageDetailHref } from "@/lib/public-page-href";
import type { Locale, PublicPageListItem } from "@/types/content";

interface CmsPagesHighlightsSectionProps {
  locale: Locale;
  pages: PublicPageListItem[];
}

const SECTION_HEADING_ID = "home-cms-pages-heading";

function formatPublishedDate(iso: string | null, locale: Locale) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function pageTypeChip(pageType: string, locale: Locale): string | null {
  const raw = pageType.trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (lower === "generic" || lower === "homepage") return null;
  const label =
    lower === "blog-post"
      ? locale === "tr"
        ? "Blog"
        : "Blog"
      : lower === "product"
        ? locale === "tr"
          ? "Ürün"
          : "Product"
        : raw.replace(/[-_]/g, " ");
  return label.length > 28 ? `${label.slice(0, 25)}…` : label;
}

export function CmsPagesHighlightsSection({ locale, pages }: CmsPagesHighlightsSectionProps) {
  const title = locale === "tr" ? "Güncel Kal" : "Keep up to Date";
  const sub =
    locale === "tr"
      ? "Siber güvenlik ve ayrıcalıklı erişim alanındaki son gelişmeleri takip edin."
      : "Stay updated on the latest in cybersecurity and privileged access management.";
  const empty =
    locale === "tr"
      ? "Bu dil için yayınlanmış sayfa bulunmuyor."
      : "No published pages for this locale yet.";
  const readMore = locale === "tr" ? "Devamını oku" : "Read more";
  const prevLabel = locale === "tr" ? "Önceki sayfalar" : "Previous pages";
  const nextLabel = locale === "tr" ? "Sonraki sayfalar" : "Next pages";
  const regionLabel = locale === "tr" ? "Son yayınlanan sayfalar" : "Latest published pages";
  const ctaLabel = locale === "tr" ? "Kaynaklara göz at" : "Browse resources";
  const ctaHref = `/${locale}/resources`;

  const items = pages.filter(
    (p) => p.slug.trim().length > 0 && p.title.trim().length > 0 && p.locale === locale,
  );

  return (
    <section
      className="blog-highlights-section section-pad"
      aria-labelledby={SECTION_HEADING_ID}
    >
      <div className="container">
        <SectionTitle headingId={SECTION_HEADING_ID} title={title} subtitle={sub} center />
        {items.length === 0 ? (
          <p className="products-catalog-empty text-muted">{empty}</p>
        ) : (
          <HorizontalCarousel
            depKey={items.map((p) => p.slug).join("|")}
            prevLabel={prevLabel}
            nextLabel={nextLabel}
            regionLabel={regionLabel}
            labelledBy={SECTION_HEADING_ID}
          >
            {items.map((p) => {
              const href = publicPageDetailHref(locale, p.pageType, p.slug);
              const dateStr = formatPublishedDate(p.publishedAt, locale);
              const chip = pageTypeChip(p.pageType, locale);
              const docThumb =
                p.pageType.trim().toLowerCase().replace(/_/g, "-") === "resource";
              const thumbSrc = p.heroImageUrl ?? p.previewImageUrl;
              return (
                <article className="blog-highlight-strip" key={p.slug}>
                  <Link href={href} tabIndex={-1} aria-hidden="true">
                    <div className="blog-highlight-strip__image">
                      {thumbSrc ? (
                        <img
                          src={thumbSrc}
                          alt=""
                          loading="lazy"
                          className={docThumb ? "blog-highlight-strip__img--doc" : undefined}
                        />
                      ) : null}
                    </div>
                  </Link>
                  <div className="blog-highlight-strip__body">
                    {chip || dateStr ? (
                      <div className="blog-highlight-strip__meta">
                        {chip ? <span className="badge">{chip}</span> : null}
                        {dateStr ? (
                          <time className="blog-card__date" dateTime={p.publishedAt ?? undefined}>
                            {dateStr}
                          </time>
                        ) : null}
                      </div>
                    ) : null}
                    <h3 className="blog-highlight-strip__title">
                      <Link href={href}>{p.title}</Link>
                    </h3>
                    <Link href={href} className="blog-highlight-strip__link">
                      {readMore} &rsaquo;
                    </Link>
                  </div>
                </article>
              );
            })}
          </HorizontalCarousel>
        )}
        <p className="blog-highlights__cta-wrap">
          <Link href={ctaHref} className="btn btn-outline-blue btn-lg blog-highlights__discover">
            {ctaLabel}
          </Link>
        </p>
      </div>
    </section>
  );
}
