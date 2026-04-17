# Frontend Decisions — Visual Reference Interpretations

> Written after the first full implementation pass using the six screenshots in `specs/frontend/` as the primary source of truth.

---

## Design Token Derivation

### Color palette

Extracted from the screenshots by sampling dominant regions:

| Token | Value | Source |
|---|---|---|
| `--navy-950` | `#020d1e` | Footer background |
| `--navy-900` | `#031126` | Announcement bar, darkest hero |
| `--navy-800` | `#061d3f` | Hero section background |
| `--navy-700` | `#0c2d60` | "Why Kron?" section |
| `--blue` | `#0049ff` | Primary CTA buttons, active states, links |
| `--blue-dk` | `#003acc` | Hover state for primary blue |
| `--gray-50` | `#f7f8fa` | Alternating section background |
| `--gray-900` | `#0f1520` | Body text |

### Typography

The screenshots use a modern sans-serif that most closely matches **Inter**. Inter is loaded via `next/font/google` in the root layout. Font sizes are scaled using `clamp()` for fluid responsive typography — headings scale from mobile to desktop without breakpoint hacks.

### Spacing rhythm

- Section vertical padding: `80px` desktop, `48px` mobile (via CSS variable `--section-y`)
- Container max-width: `1280px` with fluid horizontal padding via `clamp(16px, 4vw, 40px)`
- Card gaps: `24px` (consistent across all grids)

---

## Layout Decisions

### Announcement bar

The screenshots show a thin strip at the very top (above the sticky header) with webinar/event text on the left and a "Register Now" CTA on the right. Implemented as a non-sticky `<div role="banner">` so it scrolls away naturally, keeping only the header sticky.

### Header stickiness

The header is `position: sticky; top: 0`. The announcement bar is not sticky. The product tab navigation on product/resources pages is also sticky at `top: 64px` (header height) so both remain accessible while scrolling through long pages.

### ContactBand placement

The ContactBand (dark photo-overlay section with the compact inline form) appears on every page immediately before the footer. It is placed in the locale layout (`[locale]/layout.tsx`) so it does not need to be added to individual pages. The contact page itself also has this band at the bottom (via the layout), plus its own more detailed form card.

### Locale switcher

The screenshots show a language dropdown on the top-right of the header with options EN / TR / DE. Decision: German (`DE`) is not included in the supported locales (`tr` and `en` only, per `AGENTS.md`). The switcher links directly to the equivalent locale root (`/tr` or `/en`) rather than attempting to mirror the current slug, since locale slug equivalents require a content group lookup that isn't yet wired.

---

## Page-Specific Decisions

### Homepage

- The hero is a dedicated `HomeHero` component, separate from `PageHero`. The homepage hero shows an announcement/award panel (e.g., "Leader in 3 Categories by KuppingerCole") with a geometric compass badge on the right. This is product-specific content that doesn't generalise to other pages, so it's isolated.
- The "Why Kron?" section uses the `mockAwards` data from mock-content. Award badges are rendered as styled card elements — the actual logos (Gartner, KuppingerCole) are not images; they use a text abbreviation + CSS background. When CMS assets are uploaded, the `AwardBadge.imageUrl` field can replace the abbreviation box.
- The homepage stats section reads from `mockStats`. These are static until the API provides analytics data.
- The blog highlights strip renders the first 3 posts from the blog API list. If the API is unavailable, mock data is used as fallback.

### Product detail

- The product hero shows two CTAs: "Download Datasheet" → `/resources`, "Request a Demo" → `/contact`.
- The horizontal tab navigation (`ProductTabNav`) is rendered visually with the "Solutions" tab active by default. Tab switching to show different content sections is deferred to a later pass. The tabs use `<button>` elements (not `<a>`) since they don't change the URL — this matches the visual behavior shown in the screenshots.
- Feature rows use alternating left/right layout via the `reverse` boolean on `ProductFeature`. The highlighted word in each title is wrapped in a `<mark>` element styled with a blue underline, matching the screenshot style.

### Blog list

- Two-column layout: main list (2/3 width) + highlights sidebar (1/3). The sidebar is hidden on mobile via the `.sidebar-desktop` class.
- Blog cards use a CSS placeholder div (`blog-card__img-placeholder`) when `coverImageUrl` is absent, styled as a dark-navy gradient. Real cover images can be added to mock-content or served from the API.
- Pagination is rendered as a static visual element. Active page navigation is deferred.

### Blog detail

- The same highlights sidebar from the blog list appears here, reusing the same component and data.
- The article body renders an array of paragraphs. The first element of `post.content` is interpreted as a secondary headline based on the screenshot pattern (longer first paragraph in larger text). This is not enforced visually — the body renders all paragraphs in standard body size. If a distinct display heading within the article is needed, the content model should add a `subheading` field to `BlogPostDetail`.
- Social share buttons are rendered as small icon buttons with network abbreviations (in, fb, tw). They are not wired to share APIs in this pass.

### Resources

- The resources page reuses the product hero and tab nav, with "Resources" tab active. This matches the screenshot which shows the same Kron PAM context as the product page, but scoped to downloadable assets.
- Datasheet cards use a CSS-rendered cover (white card with Kron logo mark + line stubs) instead of real PDF thumbnails. Real cover images from uploads can be wired via `datasheet.coverImageUrl`.
- The intro section (text left + image right) has a CSS placeholder for the image area. A real product image can be added to the mock data or API response.

### Contact page

- The short hero at the top has no title text — the screenshot shows a background image of hands/phone communication icons with just the breadcrumb below. The `PageHero` component renders an empty title/subtitle gracefully (no visible text on screen, but the hero background color/pattern still renders for visual continuity).
- The contact form renders as a white card on the light gray section background, matching the screenshot layout.
- Four office locations are shown as alternating image+info rows. Office images are CSS placeholder navy gradients. Real photos can be added to the `OfficeLocation.imageUrl` field.

---

## Ambiguous Visual Interpretations

| Ambiguity | Decision |
|---|---|
| The footer column heading "Partners" shows items that look like sector names (Energy, Finance, etc.) | Interpreted as industry sectors within the Partners section. Rendered as a single column labeled "Partners" with sector links. |
| The homepage hero compass graphic is a complex custom SVG/image | Replaced with a CSS-styled badge box (navy bg, brand color gradient, "K" logomark). The badge conveys the "award" meaning without requiring the actual graphic. |
| Blog cover images are photography from the live Kron website | All cover images set to `undefined` in mock data; components render a dark-navy CSS placeholder. When CMS media is available, `coverImageUrl` on `BlogPostPreview` drives the real image. |
| Product tab nav: clicking tabs should reveal different content | Tabs are visually active (one highlighted) but do not switch content. Full tab behavior requires client-side state and segment-structured content, deferred to a later pass. |
| The blog detail article body mixes headings and paragraphs | `BlogPostDetail.content` is an array of strings. The component renders each as a `<p>`. Subheadings should be a separate array (`subheadings`) added to the content model when a richer article editor is needed. |
| Announcement bar shows "[14 Apr]" — a date that may pass | Hardcoded in `AnnouncementBar.tsx`. A future pass should drive this from a CMS-managed banner field. |
| `next/image` vs `<img>` | All content images use `<img>` with `loading="lazy"`. `next/image` would require listing every external image domain in `next.config.ts`. Since images come from S3/MinIO (domain varies per deployment), plain `<img>` was chosen. This is flagged as a lint warning but not an error. |
| `typedRoutes` Next.js experimental flag | Disabled. It is incompatible with dynamic locale-prefixed route strings (e.g., `/${locale}/contact`). The flag requires every `href` to be a statically-known route pattern, which breaks locale-parameterised navigation. |

---

## Component Structure Summary

```
src/components/
  layout/
    AnnouncementBar.tsx   — thin event strip above header
    SiteHeader.tsx        — sticky white header with nav + locale switcher
    ContactBand.tsx       — dark overlay section with inline form (every page)
    SiteFooter.tsx        — dark 4-column footer
  ui/
    Breadcrumb.tsx        — accessible breadcrumb navigation
    SectionTitle.tsx      — reusable heading block (label + title + subtitle)
  sections/
    PageHero.tsx          — dark navy hero (product, blog, resources, contact)
    HomeHero.tsx          — homepage award/announcement hero
    ProductCard.tsx       — single product summary card
    ProductCardsSection.tsx — 3-col product grid
    WhyKronSection.tsx    — split dark-blue section
    StatsSection.tsx      — 4-stat "Kron in Numbers" grid
    BlogCard.tsx          — large format blog list card
    BlogHighlightsSection.tsx — 3-col blog preview strip (homepage)
    HighlightsSidebar.tsx — sidebar with small blog cards
    FeatureRow.tsx        — alternating image+text feature block
    ProductTabNav.tsx     — horizontal tab nav (product/resources)
    DatasheetCard.tsx     — download card
    DatasheetGrid.tsx     — 3-col datasheet grid
    FaqAccordion.tsx      — expandable FAQ (client)
    OfficeCard.tsx        — office location details
    ContactForm.tsx       — full contact form (client)
```
