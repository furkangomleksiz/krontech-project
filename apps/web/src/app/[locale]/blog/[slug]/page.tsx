import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FaqAccordion } from "@/components/sections/FaqAccordion";
import { HighlightsSidebar } from "@/components/sections/HighlightsSidebar";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { normalizeBlogHeroImageUrl } from "@/lib/blog-hero-image";
import { getBlogPost } from "@/lib/api/public-content";
import { mockBlogHighlights } from "@/lib/api/mock-content";
import { buildBlogMetadata } from "@/lib/seo";
import { articleSchema, breadcrumbSchema, faqSchema } from "@/lib/schema";
import { isValidLocale, canonicalUrl } from "@/lib/i18n";
import type { Locale } from "@/types/content";

interface BlogDetailPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) return {};
  const post = await getBlogPost(locale as Locale, slug);
  // buildBlogMetadata uses OG type "article" with publishedTime, section, tags
  return buildBlogMetadata(post, locale as Locale);
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) notFound();

  const l = locale as Locale;
  const post = await getBlogPost(l, slug);
  const coverSrc = normalizeBlogHeroImageUrl(post.coverImageUrl);
  const postUrl = canonicalUrl(l, `/blog/${slug}`);

  const breadcrumbs = [
    { label: "Home", href: `/${l}` },
    { label: "Blog", href: `/${l}/blog` },
    { label: post.title },
  ];

  const jsonLdSchemas = [
    articleSchema(post, postUrl),
    breadcrumbSchema(breadcrumbs),
    ...((post.faq?.length ?? 0) > 0 ? [faqSchema(post.faq)] : []),
  ];

  return (
    <section className="section-pad bg-gray" aria-label={post.title}>
      <JsonLd data={jsonLdSchemas} />
      <div className="container">
        <Breadcrumb items={breadcrumbs} />

        <div className="article-layout" style={{ marginTop: 24 }}>
          {/* Article */}
          <article
            className="article-body"
            itemScope
            itemType="https://schema.org/BlogPosting"
          >
            <meta itemProp="headline" content={post.title} />
            <meta itemProp="datePublished" content={post.publishedAt} />
            <meta itemProp="author" content="Kron Technologies" />

            <h1 itemProp="name">{post.title}</h1>

            {/* Social share */}
            <div className="article-share" aria-label="Share this article">
              <span style={{ fontSize: 13, color: "var(--gray-500)", marginRight: 4 }}>Share:</span>
              {["in", "fb", "tw"].map((s) => (
                <button key={s} className="share-btn" aria-label={`Share on ${s}`}>{s}</button>
              ))}
            </div>

            {/* Cover image */}
            <div className="article-cover" aria-hidden="true">
              {coverSrc ? (
                <img src={coverSrc} alt={post.title} itemProp="image" />
              ) : null}
            </div>

            {/* Body */}
            <div className="article-content" itemProp="articleBody">
              {post.content.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </article>

          {/* Sidebar */}
          <HighlightsSidebar posts={mockBlogHighlights} locale={l} />
        </div>

        {/* FAQs — rendered as visible text (not hidden) for GEO */}
        {(post.faq?.length ?? 0) > 0 && (
          <section aria-label="Frequently asked questions">
            <FaqAccordion items={post.faq} />
          </section>
        )}
      </div>
    </section>
  );
}
