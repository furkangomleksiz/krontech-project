import { ProductsCatalogCarousel } from "@/components/sections/ProductsCatalogCarousel";
import { SectionTitle } from "@/components/ui/SectionTitle";
import type { Locale, ProductListItem } from "@/types/content";

interface ProductCardsSectionProps {
  locale: Locale;
  products: ProductListItem[];
}

const HOME_PRODUCTS_HEADING_ID = "home-products-heading";

export function ProductCardsSection({ locale, products }: ProductCardsSectionProps) {
  const heading = locale === "tr" ? "Kron Ürünleri" : "Kron Products";
  const sub =
    locale === "tr"
      ? "Kron, siber güvenlik alanında öne çıkan yazılım ürünleri sunmaktadır."
      : "Kron offers leading-edge cybersecurity and access security software products.";
  const empty =
    locale === "tr"
      ? "Bu dil için yayınlanmış ürün bulunmuyor."
      : "No published products for this locale yet.";
  const learnMore = locale === "tr" ? "Daha fazla bilgi" : "Learn More";
  const prevLabel = locale === "tr" ? "Önceki ürünler" : "Previous products";
  const nextLabel = locale === "tr" ? "Sonraki ürünler" : "Next products";
  const regionLabel = locale === "tr" ? "Ürün listesi" : "Product list";

  const items = products.filter((p) => p.slug.trim().length > 0 && p.title.trim().length > 0);

  return (
    <section className="product-cards-section section-pad" aria-labelledby={HOME_PRODUCTS_HEADING_ID}>
      <div className="container">
        <SectionTitle
          headingId={HOME_PRODUCTS_HEADING_ID}
          title={heading}
          subtitle={sub}
          center
        />
        {items.length === 0 ? (
          <p className="products-catalog-empty text-muted">{empty}</p>
        ) : (
          <ProductsCatalogCarousel
            locale={locale}
            products={items}
            learnMoreLabel={learnMore}
            prevLabel={prevLabel}
            nextLabel={nextLabel}
            regionLabel={regionLabel}
            labelledBy={HOME_PRODUCTS_HEADING_ID}
          />
        )}
      </div>
    </section>
  );
}
