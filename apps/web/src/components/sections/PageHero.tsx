import Link from "next/link";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

interface PageHeroProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  ctaPrimary?: { label: string; href: string };
  ctaSecondary?: { label: string; href: string };
  centered?: boolean;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function PageHero({
  title,
  subtitle,
  eyebrow,
  ctaPrimary,
  ctaSecondary,
  centered,
  breadcrumbs,
}: PageHeroProps) {
  return (
    <section className={`page-hero${centered ? " page-hero--centered" : ""}`} aria-label={`${title} hero`}>
      <div className="page-hero__inner">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Breadcrumb items={breadcrumbs} dark />
          </div>
        )}
        {eyebrow && <p className="page-hero__eyebrow">{eyebrow}</p>}
        <h1 className="page-hero__title">{title}</h1>
        {subtitle && <p className="page-hero__sub">{subtitle}</p>}
        {(ctaPrimary || ctaSecondary) && (
          <div className="page-hero__actions">
            {ctaPrimary && (
              <Link href={ctaPrimary.href} className="btn btn-primary btn-lg">
                {ctaPrimary.label}
              </Link>
            )}
            {ctaSecondary && (
              <Link href={ctaSecondary.href} className="btn btn-outline btn-lg">
                {ctaSecondary.label}
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
