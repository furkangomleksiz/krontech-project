export type Locale = "tr" | "en";

export interface SeoFields {
  title: string;
  description: string;
  canonicalPath: string;
  noIndex?: boolean;
  ogImage?: string;
}

export interface NavItem {
  label: string;
  href: string;
}

/* ── Page model (generic pages via API) ─────────────────────── */

export interface HeroBlock {
  eyebrow?: string;
  title: string;
  description: string;
  cta?: NavItem;
  cta2?: NavItem;
  imageUrl?: string;
}

export interface CardItem {
  id: string;
  title: string;
  description: string;
  href?: string;
  imageUrl?: string;
}

export interface PublicPageModel {
  locale: Locale;
  slug: string;
  seo: SeoFields;
  hero?: HeroBlock;
  sections: Array<{
    id: string;
    type:
      | "feature-grid"
      | "stats-row"
      | "split-cta"
      | "article-list"
      | "resource-grid"
      | "office-list"
      | "faq";
    heading?: string;
    items?: CardItem[];
  }>;
}

/* ── Blog ───────────────────────────────────────────────────── */

export interface BlogPostPreview {
  slug: string;
  locale: Locale;
  title: string;
  excerpt: string;
  coverImageUrl?: string;
  category?: string;
  tags?: string;
  readTimeMinutes?: number;
  publishedAt: string;
}

export interface BlogPostDetail extends BlogPostPreview {
  content: string[];
  faq: Array<{ question: string; answer: string }>;
}

/* ── Product features (product detail page) ─────────────────── */

export interface ProductFeature {
  id: string;
  /** Title may contain a <mark>…</mark> span for the highlighted word. */
  title: string;
  titleHighlight?: string; // the word to mark in blue
  description: string;
  imageUrl?: string;
  reverse?: boolean; // true = image on left, text on right
}

/* ── Datasheets / Resources ──────────────────────────────────── */

export interface Datasheet {
  id: string;
  title: string;
  coverImageUrl?: string;
  downloadUrl: string;
}

/* ── Stats ───────────────────────────────────────────────────── */

export interface StatItem {
  id: string;
  number: string;
  label: string;
}

/* ── Office locations ────────────────────────────────────────── */

export interface OfficeLocation {
  id: string;
  name: string;
  email: string;
  phone: string;
  fax?: string;
  address: string;
  imageUrl?: string;
  reverse?: boolean;
}

/* ── Award badges ────────────────────────────────────────────── */

export interface AwardBadge {
  id: string;
  name: string;
  category: string;
  abbrev: string;
}
