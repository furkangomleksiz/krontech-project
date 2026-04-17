import Link from "next/link";
import { SectionTitle } from "@/components/ui/SectionTitle";
import type { BlogPostPreview, Locale } from "@/types/content";

interface BlogHighlightsSectionProps {
  posts: BlogPostPreview[];
  locale: Locale;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function BlogHighlightsSection({ posts, locale }: BlogHighlightsSectionProps) {
  const title = locale === "tr" ? "Güncel Kal" : "Keep up to Date";
  const sub =
    locale === "tr"
      ? "Siber güvenlik ve ayrıcalıklı erişim alanındaki son gelişmeleri takip edin."
      : "Stay updated on the latest in cybersecurity and privileged access management.";

  return (
    <section className="blog-highlights-section section-pad" aria-label="Latest blog posts">
      <div className="container">
        <SectionTitle title={title} subtitle={sub} center />
        <div className="blog-highlights-grid">
          {posts.slice(0, 3).map((post) => {
            const href = `/${locale}/blog/${post.slug}`;
            return (
              <article className="blog-highlight-strip" key={post.slug}>
                <Link href={href} tabIndex={-1} aria-hidden="true">
                  <div className="blog-highlight-strip__image">
                    {post.coverImageUrl && (
                      <img src={post.coverImageUrl} alt="" loading="lazy" />
                    )}
                  </div>
                </Link>
                <div className="blog-highlight-strip__body">
                  <div className="blog-highlight-strip__meta">
                    {post.category && <span className="badge">{post.category}</span>}
                    <time className="blog-card__date" dateTime={post.publishedAt}>
                      {formatDate(post.publishedAt)}
                    </time>
                  </div>
                  <h3 className="blog-highlight-strip__title">
                    <Link href={href}>{post.title}</Link>
                  </h3>
                  <Link href={href} className="blog-highlight-strip__link">
                    Read More &rsaquo;
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
