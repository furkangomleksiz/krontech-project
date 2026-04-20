import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { BlogCard } from "@/components/sections/BlogCard";
import { BlogListPagination } from "@/components/sections/BlogListPagination";
import { HighlightsSidebar } from "@/components/sections/HighlightsSidebar";
import { PageHero } from "@/components/sections/PageHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { getBlogHighlights, getBlogList } from "@/lib/api/public-content";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbSchema } from "@/lib/schema";
import { isValidLocale } from "@/lib/i18n";
import type { Locale } from "@/types/content";

function parseUserBlogPage(raw: string | string[] | undefined): number {
  const s = Array.isArray(raw) ? raw[0] : raw;
  const n = parseInt(s ?? "1", 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

interface BlogListPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}

export async function generateMetadata({ params }: BlogListPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  return buildMetadata(
    { title: "Blog", description: "Security insights, product updates, and industry news from Kron.", canonicalPath: "/blog" },
    locale as Locale
  );
}

export default async function BlogListPage({ params, searchParams }: BlogListPageProps) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const l = locale as Locale;
  const sp = await searchParams;
  const userPage = parseUserBlogPage(sp?.page);
  const [{ posts, totalPages }, highlights] = await Promise.all([
    getBlogList(l, { page: userPage - 1 }),
    getBlogHighlights(l),
  ]);

  if (totalPages === 0 && userPage > 1) {
    redirect(`/${l}/blog`);
  }
  if (totalPages > 0 && userPage > totalPages) {
    redirect(`/${l}/blog${totalPages > 1 ? `?page=${totalPages}` : ""}`);
  }

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { label: "Home", href: `/${l}` },
          { label: "Blog" },
        ])}
      />
      <PageHero title="Blog" centered backgroundImageUrl="/blog-banner.jpg" />

      <section className="section-pad bg-gray" aria-label="Blog posts">
        <div className="container">
          <div
            className={`blog-layout${highlights.length === 0 ? " blog-layout--single" : ""}`}
          >
            {/* Main column */}
            <div>
              <ul className="blog-list" role="list">
                {posts.map((post) => (
                  <li key={post.slug}>
                    <BlogCard post={post} locale={l} />
                  </li>
                ))}
              </ul>

              <BlogListPagination locale={l} currentPage={userPage} totalPages={totalPages} />
            </div>

            {/* Sidebar */}
            <HighlightsSidebar posts={highlights} locale={l} />
          </div>
        </div>
      </section>
    </>
  );
}
