"use client";

import { ProductCatalogCard } from "@/components/sections/ProductCatalogCard";
import { HorizontalCarousel } from "@/components/ui/HorizontalCarousel";
import type { Locale, ProductListItem } from "@/types/content";

interface ProductsCatalogCarouselProps {
  locale: Locale;
  products: ProductListItem[];
  learnMoreLabel: string;
  prevLabel: string;
  nextLabel: string;
  /** For the scrollable track (`role="region"`). */
  regionLabel: string;
  /** Optional `aria-labelledby` pointing at the section heading id. */
  labelledBy?: string;
}

export function ProductsCatalogCarousel({
  locale,
  products,
  learnMoreLabel,
  prevLabel,
  nextLabel,
  regionLabel,
  labelledBy,
}: ProductsCatalogCarouselProps) {
  return (
    <HorizontalCarousel
      depKey={products.map((p) => p.slug).join("|")}
      prevLabel={prevLabel}
      nextLabel={nextLabel}
      regionLabel={regionLabel}
      labelledBy={labelledBy}
    >
      {products.map((p) => (
        <ProductCatalogCard
          key={p.slug}
          locale={locale}
          product={p}
          learnMoreLabel={learnMoreLabel}
        />
      ))}
    </HorizontalCarousel>
  );
}
