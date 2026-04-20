import type { ProductDetailTabId, ProductDetailTabSection, ProductTabCardPublic } from "@/types/content";

const TAB_IDS: ProductDetailTabId[] = ["solution", "how_it_works", "key_benefits", "resources"];

/**
 * Ensures four tab sections exist and each card has the fields the UI expects.
 * Prevents crashes when the API omits `detailTabs` or returns a partial payload.
 */
export function normalizeDetailTabs(
  raw: ProductDetailTabSection[] | null | undefined,
): ProductDetailTabSection[] {
  const byTab = new Map<ProductDetailTabId, ProductDetailTabSection>();
  if (Array.isArray(raw)) {
    for (const s of raw) {
      if (!s?.tab || !TAB_IDS.includes(s.tab)) continue;
      const cards: ProductTabCardPublic[] = Array.isArray(s.cards)
        ? s.cards.map((c, i) => ({
            sortOrder: typeof c?.sortOrder === "number" ? c.sortOrder : i,
            title: typeof c?.title === "string" ? c.title : "",
            body: typeof c?.body === "string" ? c.body : "",
            imageUrl: c?.imageUrl ?? null,
            imageAlt: c?.imageAlt ?? null,
          }))
        : [];
      byTab.set(s.tab, { tab: s.tab, cards });
    }
  }
  return TAB_IDS.map((tab) => byTab.get(tab) ?? { tab, cards: [] });
}

/** Labels and icons aligned with product-detail screenshots (four fixed tabs). */
export const PRODUCT_DETAIL_TAB_NAV: ReadonlyArray<{
  id: ProductDetailTabId;
  label: string;
  icon: string;
}> = [
  { id: "solution", label: "Solution", icon: "▦" },
  { id: "how_it_works", label: "How It Works?", icon: "⚙" },
  { id: "key_benefits", label: "Key Benefits", icon: "▤" },
  { id: "resources", label: "Resources", icon: "📋" },
];
