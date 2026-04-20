import Link from "next/link";
import type { BlogPostPreview, Locale } from "@/types/content";

interface HighlightsSidebarProps {
  posts: BlogPostPreview[];
  locale: Locale;
  /** Non-navigable cards (e.g. draft preview) — same look as live blog. */
  decorative?: boolean;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function HighlightsSidebar({ posts, locale, decorative }: HighlightsSidebarProps) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <aside className="sidebar-desktop" aria-label="Blog highlights">
      <h2 className="sidebar__heading">Highlights</h2>
      <ul className="highlight-list">
        {posts.map((post) => (
          <li key={post.slug}>
            {decorative ? (
              <div className="highlight-card highlight-card--decorative" aria-hidden="true">
                <div className="highlight-card__thumb">
                  {post.coverImageUrl ? <img src={post.coverImageUrl} alt="" loading="lazy" /> : null}
                </div>
                <div className="highlight-card__body">
                  <p className="highlight-card__title">{post.title}</p>
                  <time className="highlight-card__date" dateTime={post.publishedAt}>
                    {formatDate(post.publishedAt)}
                  </time>
                </div>
              </div>
            ) : (
              <Link href={`/${locale}/blog/${post.slug}`} className="highlight-card">
                <div className="highlight-card__thumb" aria-hidden="true">
                  {post.coverImageUrl && (
                    <img src={post.coverImageUrl} alt="" loading="lazy" />
                  )}
                </div>
                <div className="highlight-card__body">
                  <p className="highlight-card__title">{post.title}</p>
                  <time className="highlight-card__date" dateTime={post.publishedAt}>
                    {formatDate(post.publishedAt)}
                  </time>
                </div>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}
