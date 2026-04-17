import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogCard } from "@/components/sections/BlogCard";
import { HighlightsSidebar } from "@/components/sections/HighlightsSidebar";
import { PageHero } from "@/components/sections/PageHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { getBlogList } from "@/lib/api/public-content";
import { mockBlogHighlights } from "@/lib/api/mock-content";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbSchema } from "@/lib/schema";
import { isValidLocale } from "@/lib/i18n";
import type { Locale } from "@/types/content";

interface BlogListPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: BlogListPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  return buildMetadata(
    { title: "Blog", description: "Security insights, product updates, and industry news from Kron.", canonicalPath: "/blog" },
    locale as Locale
  );
}

export default async function BlogListPage({ params }: BlogListPageProps) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const l = locale as Locale;
  const posts = await getBlogList(l);

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { label: "Home", href: `/${l}` },
          { label: "Blog" },
        ])}
      />
      <PageHero title="Blog" centered />

      <section className="section-pad bg-gray" aria-label="Blog posts">
        <div className="container">
          <div className="blog-layout">
            {/* Main column */}
            <div>
              <ul className="blog-list" role="list">
                {posts.map((post) => (
                  <li key={post.slug}>
                    <BlogCard post={post} locale={l} />
                  </li>
                ))}
              </ul>

              {/* Pagination */}
              <nav className="pagination" aria-label="Blog pagination">
                <button className="page-btn page-btn--active" aria-current="page" aria-label="Page 1">1</button>
                <button className="page-btn" aria-label="Page 2">2</button>
                <button className="page-btn" aria-label="Page 3">3</button>
                <button className="page-btn" aria-label="Next page">›</button>
              </nav>
            </div>

            {/* Sidebar */}
            <HighlightsSidebar posts={mockBlogHighlights} locale={l} />
          </div>
        </div>
      </section>
    </>
  );
}
