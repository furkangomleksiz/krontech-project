import { ProductCatalogCard } from "@/components/sections/ProductCatalogCard";
import type { Locale, ProductListItem } from "@/types/content";

interface ProductsCatalogSectionProps {
  locale: Locale;
  products: ProductListItem[];
}

export function ProductsCatalogSection({ locale, products }: ProductsCatalogSectionProps) {
  const empty =
    locale === "tr"
      ? "Bu dil için yayınlanmış ürün bulunmuyor."
      : "No published products for this locale yet.";
  const learnMore = locale === "tr" ? "Daha fazla bilgi" : "Learn More";

  return (
    <section className="products-catalog-section section-pad bg-white" aria-label="Products">
      <div className="container">
        {products.length === 0 ? (
          <p className="products-catalog-empty text-muted">{empty}</p>
        ) : (
          <div className="products-catalog-grid">
            {products.map((p) => (
              <ProductCatalogCard
                key={p.slug || p.title}
                locale={locale}
                product={p}
                learnMoreLabel={learnMore}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
