import ProductDetailTabs from "@/components/sections/ProductDetailTabs";
import { PageHero } from "@/components/sections/PageHero";
import { HighlightsSidebar } from "@/components/sections/HighlightsSidebar";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { ContactBand } from "@/components/layout/ContactBand";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { mockBlogHighlights } from "@/lib/api/mock-content";
import {
  normalizeProductLinkedResources,
  normalizeProductResourcesIntro,
} from "@/lib/api/public-content";
import { normalizeBlogHeroImageUrl } from "@/lib/blog-hero-image";
import { normalizeDetailTabs } from "@/lib/product-detail-tabs";
import { getApiBaseUrl } from "@/lib/api/base-url";
import { isValidLocale } from "@/lib/i18n";
import type { Locale, ProductDetailTabSection, ProductResourcesIntro, PublicResourceItem } from "@/types/content";

interface BlockItem {
  blockType: string;
  sortOrder: number;
  payloadJson: string;
}

interface SeoMeta {
  metaTitle?: string;
  metaDescription?: string;
}

interface PreviewPage {
  slug: string;
  locale: string;
  title: string;
  summary?: string;
  heroImageUrl?: string;
  seo?: SeoMeta;
  blocks: BlockItem[];
  pageType?: string;
  detailTabs?: ProductDetailTabSection[];
  resourcesIntro?: ProductResourcesIntro | null;
  linkedResources?: PublicResourceItem[];
  body?: string | null;
}

interface PreviewPageProps {
  searchParams: Promise<{ token?: string | string[] }>;
}

function splitBlogBodyToParagraphs(body: string): string[] {
  const t = body.trim();
  if (!t) return [];
  return t
    .split(/\n\s*\n/)
    .map((p) => p.trim().replace(/\s+/g, " "))
    .filter(Boolean);
}

function BlockPreview({ block, index }: { block: BlockItem; index: number }) {
  let p: Record<string, string> = {};
  try {
    const raw = JSON.parse(block.payloadJson) as Record<string, unknown>;
    p = Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [k, typeof v === "string" ? v : JSON.stringify(v)]),
    );
  } catch {
    // ignore malformed JSON
  }

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: 16,
        background: "#fff",
        marginBottom: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            background: "#f3f4f6",
            border: "1px solid #e5e7eb",
            borderRadius: 4,
            padding: "1px 8px",
            fontFamily: "monospace",
            color: "#6b7280",
          }}
        >
          #{index + 1} · {block.blockType}
        </span>
      </div>

      {block.blockType === "hero" && (
        <div>
          {p.eyebrow && (
            <p
              style={{
                fontSize: 12,
                color: "#6b7280",
                margin: "0 0 4px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {p.eyebrow}
            </p>
          )}
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 8px", color: "#111827" }}>{p.title}</h2>
          {p.description && <p style={{ color: "#374151", margin: "0 0 12px", lineHeight: 1.6 }}>{p.description}</p>}
          <div style={{ display: "flex", gap: 8 }}>
            {p.ctaLabel && (
              <span
                style={{
                  background: "#4f46e5",
                  color: "#fff",
                  padding: "6px 14px",
                  borderRadius: 4,
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                {p.ctaLabel}
              </span>
            )}
            {p.cta2Label && (
              <span style={{ border: "1px solid #e5e7eb", padding: "6px 14px", borderRadius: 4, fontSize: 13 }}>
                {p.cta2Label}
              </span>
            )}
          </div>
        </div>
      )}

      {block.blockType === "text" && (
        <div>
          {p.heading && <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px", color: "#111827" }}>{p.heading}</h3>}
          {p.body && <p style={{ color: "#374151", margin: 0, lineHeight: 1.6 }}>{p.body}</p>}
        </div>
      )}

      {block.blockType === "split-cta" && (
        <div>
          {p.heading && <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>{p.heading}</h3>}
          {p.description && <p style={{ color: "#374151", margin: "0 0 10px" }}>{p.description}</p>}
          {p.ctaLabel && (
            <span
              style={{
                background: "#4f46e5",
                color: "#fff",
                padding: "5px 12px",
                borderRadius: 4,
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {p.ctaLabel}
            </span>
          )}
        </div>
      )}

      {!["hero", "text", "split-cta"].includes(block.blockType) && (
        <details>
          <summary style={{ fontSize: 12, color: "#6b7280", cursor: "pointer", marginBottom: 8 }}>Payload JSON</summary>
          <pre
            style={{
              fontSize: 11,
              fontFamily: "monospace",
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: 4,
              padding: "8px 10px",
              overflow: "auto",
              margin: 0,
            }}
          >
            {block.payloadJson}
          </pre>
        </details>
      )}
    </div>
  );
}

function previewLocale(page: PreviewPage): Locale {
  const l = page.locale?.toLowerCase();
  return l === "tr" || l === "en" ? l : "en";
}

async function fetchPreview(token: string): Promise<PreviewPage> {
  const res = await fetch(`${getApiBaseUrl()}/preview?token=${encodeURIComponent(token)}`, { cache: "no-store" });
  if (!res.ok) {
    const msg = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return res.json() as Promise<PreviewPage>;
}

function PreviewBanner({ page }: { page: PreviewPage | null }) {
  return (
    <div
      style={{
        background: "#4f46e5",
        color: "#fff",
        padding: "10px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontSize: 13,
        fontWeight: 500,
      }}
    >
      <span>
        <strong>Preview mode</strong> — this content is not yet published
      </span>
      {page && (
        <span style={{ opacity: 0.85, fontSize: 12 }}>
          {page.locale.toUpperCase()} · /{page.locale}/{page.slug}
        </span>
      )}
    </div>
  );
}

export default async function PreviewPage({ searchParams }: PreviewPageProps) {
  const sp = await searchParams;
  const rawToken = sp.token;
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;

  if (!token) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--gray-50)" }}>
        <PreviewBanner page={null} />
        <div className="container" style={{ padding: "28px 24px" }}>
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fca5a5",
              borderRadius: 8,
              padding: "14px 18px",
              color: "#dc2626",
            }}
          >
            <strong>Preview unavailable:</strong> No preview token provided.
          </div>
        </div>
      </div>
    );
  }

  let page: PreviewPage;
  try {
    page = await fetchPreview(token);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load preview.";
    return (
      <div style={{ minHeight: "100vh", background: "var(--gray-50)" }}>
        <PreviewBanner page={null} />
        <div className="container" style={{ padding: "28px 24px" }}>
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fca5a5",
              borderRadius: 8,
              padding: "14px 18px",
              color: "#dc2626",
            }}
          >
            <strong>Preview unavailable:</strong> {message}
          </div>
        </div>
      </div>
    );
  }

  const l = previewLocale(page);
  const rawLocale = page.locale?.toLowerCase() ?? "en";
  const localeValid: Locale = isValidLocale(rawLocale) ? rawLocale : l;

  const rawRecord = page as unknown as Record<string, unknown>;
  const normalizedDetailTabs = normalizeDetailTabs(page.detailTabs);
  const previewResourcesIntro = normalizeProductResourcesIntro(rawRecord.resourcesIntro ?? rawRecord.resources_intro);
  const previewLinkedResources = normalizeProductLinkedResources(
    rawRecord.linkedResources ?? rawRecord.linked_resources,
  );

  const showProductTabPreview =
    page.pageType === "product" ||
    normalizedDetailTabs.some((s) => s.cards.length > 0) ||
    previewResourcesIntro != null ||
    previewLinkedResources.length > 0 ||
    Boolean(page.detailTabs && page.detailTabs.length > 0);

  const articleParagraphs = splitBlogBodyToParagraphs(typeof page.body === "string" ? page.body : "");
  const hasArticleBody = articleParagraphs.length > 0;
  const isBlogPreview =
    hasArticleBody || page.pageType?.toLowerCase() === "blog" || page.pageType?.toLowerCase() === "blog_post";

  const isProductLayout = !isBlogPreview && showProductTabPreview;

  const coverSrc = normalizeBlogHeroImageUrl(page.heroImageUrl);

  const sortedBlocks = [...page.blocks].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div style={{ minHeight: "100vh", background: "var(--gray-50)" }}>
      <PreviewBanner page={page} />

      <div inert>
        <AnnouncementBar locale={localeValid} />
        <SiteHeader locale={localeValid} />
      </div>

      <main id="main-content">
        {isBlogPreview ? (
          <section className="section-pad bg-gray" aria-label={page.title}>
            <div className="container">
              <Breadcrumb
                items={[{ label: "Home" }, { label: "Blog" }, { label: page.title }]}
              />

              <div className="article-layout" style={{ marginTop: 24 }}>
                <article className="article-body">
                  <h1>{page.title}</h1>

                  {page.summary ? (
                    <p
                      style={{
                        margin: "-8px 0 16px",
                        fontSize: 17,
                        lineHeight: 1.55,
                        color: "var(--gray-600)",
                        fontWeight: 500,
                      }}
                    >
                      {page.summary}
                    </p>
                  ) : null}

                  <div className="article-share" aria-label="Share controls are disabled in preview">
                    <span style={{ fontSize: 13, color: "var(--gray-500)", marginRight: 4 }}>Share:</span>
                    {["in", "fb", "tw"].map((s) => (
                      <span key={s} className="share-btn" aria-hidden="true" style={{ cursor: "default" }}>
                        {s}
                      </span>
                    ))}
                  </div>

                  <div className="article-cover" aria-hidden="true">
                    {coverSrc ? <img src={coverSrc} alt="" /> : null}
                  </div>

                  {hasArticleBody ? (
                    <div className="article-content">
                      {articleParagraphs.map((para, i) => (
                        <p key={i}>{para}</p>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: "var(--gray-500)", fontSize: 15 }}>No article body yet.</p>
                  )}

                  {page.seo?.metaDescription ? (
                    <p
                      style={{
                        marginTop: 20,
                        fontSize: 13,
                        color: "var(--gray-500)",
                        borderLeft: "3px solid var(--border)",
                        paddingLeft: 12,
                      }}
                    >
                      <strong>Meta description:</strong> {page.seo.metaDescription}
                    </p>
                  ) : null}
                </article>

                <HighlightsSidebar posts={mockBlogHighlights} locale={localeValid} decorative />
              </div>
            </div>
          </section>
        ) : isProductLayout ? (
          <>
            <PageHero
              title={page.title}
              subtitle={page.summary}
              backgroundImageUrl={coverSrc}
              breadcrumbs={[{ label: "Home" }, { label: "Products" }, { label: page.title }]}
              ctaPrimary={{ label: "Download Datasheet", href: `/${localeValid}/resources` }}
              ctaSecondary={{ label: "Request a Demo", href: `/${localeValid}/contact` }}
              decorativeActions
            />
            <ProductDetailTabs
              detailTabs={normalizedDetailTabs}
              locale={localeValid}
              resourcesIntro={previewResourcesIntro}
              linkedResources={previewLinkedResources}
            />
            {sortedBlocks.length > 0 && (
              <section className="section-pad bg-gray" aria-label="Additional page blocks">
                <div className="container">
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "#9ca3af",
                      marginBottom: 12,
                    }}
                  >
                    Content blocks ({sortedBlocks.length})
                  </div>
                  {sortedBlocks.map((block, i) => (
                    <BlockPreview key={`${block.blockType}-${block.sortOrder}-${i}`} block={block} index={i} />
                  ))}
                </div>
              </section>
            )}
            {page.seo?.metaDescription ? (
              <section className="section-pad bg-gray" style={{ paddingTop: 0 }}>
                <div className="container">
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--gray-500)",
                      margin: 0,
                      borderLeft: "3px solid var(--border)",
                      paddingLeft: 12,
                    }}
                  >
                    <strong>Meta description:</strong> {page.seo.metaDescription}
                  </p>
                </div>
              </section>
            ) : null}
          </>
        ) : (
          <section className="section-pad bg-gray" aria-label="Page preview">
            <div className="container">
              <div style={{ marginBottom: 24 }}>
                {page.heroImageUrl && (
                  <img
                    src={page.heroImageUrl}
                    alt={page.title}
                    style={{
                      width: "100%",
                      maxHeight: 420,
                      height: "auto",
                      objectFit: "contain",
                      borderRadius: 8,
                      marginBottom: 20,
                      display: "block",
                      background: "#e5e7eb",
                    }}
                  />
                )}
                <h1
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: "#111827",
                    margin: "0 0 10px",
                  }}
                >
                  {page.title}
                </h1>
                {page.summary && (
                  <p style={{ fontSize: 16, color: "#374151", margin: "0 0 8px", lineHeight: 1.6 }}>{page.summary}</p>
                )}
                {page.seo?.metaDescription && (
                  <p
                    style={{
                      fontSize: 13,
                      color: "#6b7280",
                      margin: 0,
                      borderLeft: "3px solid #e5e7eb",
                      paddingLeft: 12,
                    }}
                  >
                    SEO: {page.seo.metaDescription}
                  </p>
                )}
              </div>

              {sortedBlocks.length > 0 && (
                <>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "#9ca3af",
                      marginBottom: 12,
                    }}
                  >
                    Content blocks ({sortedBlocks.length})
                  </div>
                  {sortedBlocks.map((block, i) => (
                    <BlockPreview key={`${block.blockType}-${block.sortOrder}-${i}`} block={block} index={i} />
                  ))}
                </>
              )}

              {sortedBlocks.length === 0 && (
                <div
                  style={{
                    padding: "24px",
                    textAlign: "center",
                    color: "#6b7280",
                    background: "#fff",
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                  }}
                >
                  No content blocks defined for this page.
                </div>
              )}
            </div>
          </section>
        )}

        {isBlogPreview && (showProductTabPreview || sortedBlocks.length > 0) && (
          <section className="section-pad bg-gray" aria-label="Additional draft content">
            <div className="container">
              {showProductTabPreview && (
                <div style={{ marginBottom: sortedBlocks.length > 0 ? 28 : 0 }}>
                  <ProductDetailTabs
                    detailTabs={normalizedDetailTabs}
                    locale={localeValid}
                    resourcesIntro={previewResourcesIntro}
                    linkedResources={previewLinkedResources}
                  />
                </div>
              )}

              {sortedBlocks.length > 0 && (
                <>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "#9ca3af",
                      marginBottom: 12,
                    }}
                  >
                    Content blocks ({sortedBlocks.length})
                  </div>
                  {sortedBlocks.map((block, i) => (
                    <BlockPreview key={`${block.blockType}-${block.sortOrder}-${i}`} block={block} index={i} />
                  ))}
                </>
              )}
            </div>
          </section>
        )}
      </main>

      <div inert>
        <ContactBand locale={localeValid} />
        <SiteFooter locale={localeValid} />
      </div>
    </div>
  );
}
