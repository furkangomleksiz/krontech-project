"use client";

import { useMemo, useState } from "react";
import { FeatureRow } from "@/components/sections/FeatureRow";
import { ResourceDocumentGrid } from "@/components/sections/ResourceDocumentGrid";
import { normalizeDetailTabs, PRODUCT_DETAIL_TAB_NAV } from "@/lib/product-detail-tabs";
import type {
  Locale,
  ProductDetailTabId,
  ProductDetailTabSection,
  ProductResourcesIntro,
  PublicResourceItem,
} from "@/types/content";

interface ProductDetailTabsProps {
  detailTabs: ProductDetailTabSection[] | null | undefined;
  locale: Locale;
  resourcesIntro?: ProductResourcesIntro | null;
  linkedResources?: PublicResourceItem[] | null;
}

function structuredResourcesTab(
  intro: ProductResourcesIntro | null | undefined,
  linked: PublicResourceItem[] | null | undefined,
): boolean {
  if (linked && linked.length > 0) return true;
  if (!intro) return false;
  return Boolean(
    (intro.title && intro.title.trim()) ||
      (intro.body && intro.body.trim()) ||
      (intro.imageUrl && intro.imageUrl.trim()),
  );
}

function hasIntroVisual(intro: ProductResourcesIntro | null | undefined): boolean {
  if (!intro) return false;
  return Boolean(
    (intro.title && intro.title.trim()) ||
      (intro.body && intro.body.trim()) ||
      (intro.imageUrl && intro.imageUrl.trim()),
  );
}

export function ProductDetailTabs({
  detailTabs,
  locale,
  resourcesIntro = null,
  linkedResources: linkedResourcesProp = [],
}: ProductDetailTabsProps) {
  const linkedResources = linkedResourcesProp ?? [];
  const tabs = normalizeDetailTabs(detailTabs);
  const useResourcesDocuments = structuredResourcesTab(resourcesIntro, linkedResources);

  const [active, setActive] = useState<ProductDetailTabId>(tabs[0]?.tab ?? "solution");

  const activeCards = useMemo(() => {
    const section = tabs.find((s) => s.tab === active);
    return section?.cards ?? [];
  }, [tabs, active]);

  const emptyResourcesLinked =
    locale === "tr"
      ? "Bu ürün için henüz indirilebilir kaynak bağlanmadı."
      : "No downloadable resources linked for this product yet.";

  const emptySection =
    locale === "tr" ? "Bu bölüm için henüz içerik eklenmedi." : "No content for this section yet.";

  return (
    <>
      <nav className="product-tab-nav" aria-label="Product sections">
        <div className="product-tab-nav__inner">
          {PRODUCT_DETAIL_TAB_NAV.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`tab-item${tab.id === active ? " tab-item--active" : ""}`}
              aria-current={tab.id === active ? "page" : undefined}
              onClick={() => setActive(tab.id)}
            >
              <span className="tab-item__icon" aria-hidden="true">
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <section className="feature-rows section-pad" aria-label="Product detail">
        <div className="container">
          {active === "resources" && useResourcesDocuments ? (
            <>
              {hasIntroVisual(resourcesIntro) ? (
                <div style={{ marginBottom: linkedResources.length > 0 ? 40 : 0 }}>
                  <FeatureRow
                    feature={{
                      id: "resources-intro",
                      title: resourcesIntro?.title?.trim() || "",
                      description: resourcesIntro?.body?.trim() || "",
                      imageUrl: resourcesIntro?.imageUrl ?? undefined,
                      imageAlt: resourcesIntro?.imageAlt ?? undefined,
                      reverse: false,
                    }}
                  />
                </div>
              ) : null}
              <ResourceDocumentGrid
                locale={locale}
                items={linkedResources}
                emptyMessage={emptyResourcesLinked}
                embedded
              />
            </>
          ) : activeCards.length === 0 ? (
            <p className="text-muted" style={{ textAlign: "center", padding: "48px 0" }}>
              {emptySection}
            </p>
          ) : (
            activeCards.map((card, index) => (
              <FeatureRow
                key={`${active}-${card.sortOrder}-${index}`}
                feature={{
                  id: `${active}-${card.sortOrder}`,
                  title: card.title,
                  description: card.body,
                  imageUrl: card.imageUrl ?? undefined,
                  imageAlt: card.imageAlt ?? undefined,
                  reverse: index % 2 === 1,
                }}
              />
            ))
          )}
        </div>
      </section>
    </>
  );
}

export default ProductDetailTabs;
