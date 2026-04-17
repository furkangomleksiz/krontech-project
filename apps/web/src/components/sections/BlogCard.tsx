import Link from "next/link";
import type { BlogPostPreview, Locale } from "@/types/content";

interface BlogCardProps {
  post: BlogPostPreview;
  locale: Locale;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function BlogCard({ post, locale }: BlogCardProps) {
  const href = `/${locale}/blog/${post.slug}`;
  return (
    <article className="blog-card">
      <Link href={href} aria-label={`Read: ${post.title}`} tabIndex={-1}>
        <div className="blog-card__image">
          {post.coverImageUrl ? (
            <img src={post.coverImageUrl} alt={post.title} loading="lazy" />
          ) : (
            <div className="blog-card__img-placeholder" aria-hidden="true" />
          )}
        </div>
      </Link>

      <div className="blog-card__body">
        <div className="blog-card__meta">
          {post.category && (
            <span className="badge">{post.category}</span>
          )}
          <time className="blog-card__date" dateTime={post.publishedAt}>
            {formatDate(post.publishedAt)}
          </time>
        </div>
        <h2 className="blog-card__title">
          <Link href={href}>{post.title}</Link>
        </h2>
        <p className="blog-card__excerpt">{post.excerpt}</p>
        <Link href={href} className="blog-card__link" aria-label={`Read more about ${post.title}`}>
          Read More &rsaquo;
        </Link>
      </div>
    </article>
  );
}
