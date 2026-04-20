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

/** Row from GET /api/v1/public/pages?locale=… (published CMS pages, admin Pages tab). */
export interface PublicPageListItem {
  slug: string;
  locale: string;
  title: string;
  summary: string;
  heroImageUrl: string | null;
  pageType: string;
  publishedAt: string | null;
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

/** Paginated blog listing; aligns with GET /api/v1/public/blog. */
export interface BlogListResult {
  posts: BlogPostPreview[];
  /** Zero-based page index (API shape). */
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface BlogPostDetail extends BlogPostPreview {
  content: string[];
  faq: Array<{ question: string; answer: string }>;
}

/* ── Product listing (CMS / public API) ──────────────────────── */

export interface ProductListItem {
  slug: string;
  title: string;
  summary: string;
  heroImageUrl?: string | null;
  featureBullets: string[];
}

/** Public API tab ids for product detail (`/public/products/{slug}`). */
export type ProductDetailTabId =
  | "solution"
  | "how_it_works"
  | "key_benefits"
  | "resources";

export interface ProductTabCardPublic {
  sortOrder: number;
  title: string;
  body: string;
  imageUrl: string | null;
  imageAlt: string | null;
}

export interface ProductDetailTabSection {
  tab: ProductDetailTabId;
  cards: ProductTabCardPublic[];
}

/** Wide intro card on the product Resources tab (CMS). */
export interface ProductResourcesIntro {
  title: string | null;
  body: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
}

/** SEO block returned inside public product API responses. */
export interface ProductPublicSeo {
  title: string;
  description: string;
  canonicalPath: string;
  noIndex: boolean;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImageUrl: string | null;
  structuredDataJson: string | null;
}

/** Full product detail from `GET /public/products/{slug}`. */
export interface ProductDetail {
  slug: string;
  locale: Locale;
  title: string;
  summary: string;
  highlights: string;
  heroImageUrl: string | null;
  seo: ProductPublicSeo;
  detailTabs: ProductDetailTabSection[];
  /** When set (non-empty), replaces legacy Resources tab cards with intro + linked documents. */
  resourcesIntro: ProductResourcesIntro | null;
  linkedResources: PublicResourceItem[];
}

/* ── Product features (product detail page) ─────────────────── */

export interface ProductFeature {
  id: string;
  /** Title may contain a <mark>…</mark> span for the highlighted word. */
  title: string;
  titleHighlight?: string; // the word to mark in blue
  description: string;
  imageUrl?: string;
  imageAlt?: string;
  reverse?: boolean; // true = image on left, text on right
}

/* ── Datasheets / Resources ──────────────────────────────────── */

export interface Datasheet {
  id: string;
  title: string;
  coverImageUrl?: string;
  downloadUrl: string;
}

/** Row from `GET /api/v1/public/resources` (published resources). */
export interface PublicResourceItem {
  slug: string;
  locale: string;
  title: string;
  summary: string;
  resourceType: string;
  heroImageUrl: string | null;
  /** First-page JPEG from the API when the file is a PDF; shown when heroImageUrl is absent. */
  previewImageUrl: string | null;
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
