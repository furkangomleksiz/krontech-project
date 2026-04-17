import type { BlogPostDetail, BlogPostPreview, Locale, PublicPageModel } from "@/types/content";
import { apiFetch } from "@/lib/api/client";
import { mockBlogDetail, mockBlogList, mockPages } from "@/lib/api/mock-content";

function key(locale: Locale, slug: string): string {
  return `${locale}:${slug}`;
}

// ISR TTLs — matched to content update cadence
const PAGE_TTL = 3600;      // Generic pages: 1 h
const BLOG_LIST_TTL = 3600; // Blog list: 1 h
const BLOG_POST_TTL = 3600; // Blog detail: 1 h

export async function getPublicPage(locale: Locale, slug: string): Promise<PublicPageModel> {
  try {
    return await apiFetch<PublicPageModel>(`/public/pages/${slug}?locale=${locale}`, {
      revalidateSeconds: PAGE_TTL,
    });
  } catch {
    return mockPages[key(locale, slug)] ?? mockPages[key(locale, "home")];
  }
}

export async function getBlogList(locale: Locale): Promise<BlogPostPreview[]> {
  try {
    return await apiFetch<BlogPostPreview[]>(`/public/blog?locale=${locale}`, {
      revalidateSeconds: BLOG_LIST_TTL,
    });
  } catch {
    return mockBlogList.filter((post) => post.locale === locale);
  }
}

export async function getBlogPost(locale: Locale, slug: string): Promise<BlogPostDetail> {
  try {
    return await apiFetch<BlogPostDetail>(`/public/blog/${slug}?locale=${locale}`, {
      revalidateSeconds: BLOG_POST_TTL,
    });
  } catch {
    return { ...mockBlogDetail, locale, slug };
  }
}
