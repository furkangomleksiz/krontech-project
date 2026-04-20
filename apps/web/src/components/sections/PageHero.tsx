import Link from "next/link";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

interface PageHeroProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  /** Full-bleed photo behind the navy overlay (e.g. product hero from CMS). */
  backgroundImageUrl?: string;
  /** `light` = white background and dark text (e.g. resource document listings). */
  variant?: "dark" | "light";
  ctaPrimary?: { label: string; href: string };
  ctaSecondary?: { label: string; href: string };
  centered?: boolean;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function PageHero({
  title,
  subtitle,
  eyebrow,
  backgroundImageUrl,
  variant = "dark",
  ctaPrimary,
  ctaSecondary,
  centered,
  breadcrumbs,
}: PageHeroProps) {
  const isLight = variant === "light" && !backgroundImageUrl;
  const breadcrumbDark = Boolean(backgroundImageUrl) || !isLight;

  return (
    <section
      className={`page-hero${centered ? " page-hero--centered" : ""}${backgroundImageUrl ? " page-hero--with-photo" : ""}${isLight ? " page-hero--light" : ""}`}
      aria-label={`${title} hero`}
      style={
        backgroundImageUrl
          ? {
              backgroundImage: `linear-gradient(105deg, rgba(6, 18, 48, 0.94) 0%, rgba(6, 22, 58, 0.78) 42%, rgba(8, 28, 72, 0.55) 100%), url(${backgroundImageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      <div className="page-hero__inner">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Breadcrumb items={breadcrumbs} dark={breadcrumbDark} />
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
