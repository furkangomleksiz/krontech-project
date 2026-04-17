import Link from "next/link";

interface ProductCardProps {
  abbrev: string;
  tag: string;
  title: string;
  description: string;
  bullets: string[];
  href: string;
}

export function ProductCard({ abbrev, tag, title, description, bullets, href }: ProductCardProps) {
  return (
    <article className="product-card">
      <div className="product-card__header">
        <div className="product-card__icon" aria-hidden="true">{abbrev}</div>
        <span className="product-card__tag">{tag}</span>
      </div>
      <div className="product-card__body">
        <h3 className="product-card__title">{title}</h3>
        <p className="product-card__desc">{description}</p>
        <ul className="product-card__bullets">
          {bullets.map((b) => <li key={b}>{b}</li>)}
        </ul>
        <Link href={href} className="product-card__link">
          Learn More →
        </Link>
      </div>
    </article>
  );
}
