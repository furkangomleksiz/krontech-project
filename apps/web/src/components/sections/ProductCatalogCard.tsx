import Link from "next/link";
import type { Locale, ProductListItem } from "@/types/content";

export interface ProductCatalogCardProps {
  locale: Locale;
  product: ProductListItem;
  learnMoreLabel: string;
}

export function ProductCatalogCard({ locale, product: p, learnMoreLabel }: ProductCatalogCardProps) {
  return (
    <article className="product-catalog-card">
      <div className="product-catalog-card__image">
        {p.heroImageUrl ? <img src={p.heroImageUrl} alt={p.title} loading="lazy" /> : null}
      </div>
      <div className="product-catalog-card__body">
        <h3 className="product-catalog-card__title">{p.title}</h3>
        {p.summary ? <p className="product-catalog-card__desc">{p.summary}</p> : null}
        {p.featureBullets.length > 0 && (
          <ul className="product-catalog-card__bullets">
            {p.featureBullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        )}
        <Link
          href={`/${locale}/products/${p.slug}`}
          className="btn btn-outline-blue btn-sm product-catalog-card__cta"
        >
          {learnMoreLabel}
        </Link>
      </div>
    </article>
  );
}
