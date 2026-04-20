import Link from "next/link";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

interface PageHeroProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  /** Full-bleed photo behind the navy overlay (e.g. product hero from CMS). */
  backgroundImageUrl?: string;
  /** CSS `background-position` when `backgroundImageUrl` is set (e.g. `center right` for wide banners). */
  backgroundPosition?: string;
  /**
   * With `backgroundImageUrl`:
   * - `overlay` — heading sits on the image with a neutral (non-blue) scrim for contrast.
   * - `stack` — image-only strip, then breadcrumbs + heading on a white band (original Products/Resources layout).
   */
  photoLayout?: "overlay" | "stack";
  /** `light` = white background and dark text (e.g. resource document listings). */
  variant?: "dark" | "light";
  ctaPrimary?: { label: string; href: string };
  ctaSecondary?: { label: string; href: string };
  /** When true, CTAs look like buttons but are not links (e.g. draft preview). */
  decorativeActions?: boolean;
  centered?: boolean;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

/** Neutral bottom scrim so white type stays readable without a brand-blue wash. */
const PHOTO_OVERLAY_SCRIM =
  "linear-gradient(to top, rgba(8, 10, 14, 0.55) 0%, rgba(8, 10, 14, 0.12) 40%, transparent 70%)";

export function PageHero({
  title,
  subtitle,
  eyebrow,
  backgroundImageUrl,
  backgroundPosition = "center",
  photoLayout = "overlay",
  variant = "dark",
  ctaPrimary,
  ctaSecondary,
  decorativeActions,
  centered,
  breadcrumbs,
}: PageHeroProps) {
  const isLight = variant === "light" && !backgroundImageUrl;
  const useStack = Boolean(backgroundImageUrl && photoLayout === "stack");
  const lastCrumb = breadcrumbs?.length ? breadcrumbs[breadcrumbs.length - 1] : undefined;
  const heroAriaLabel = title.trim()
    ? `${title} hero`
    : lastCrumb?.label
      ? `${lastCrumb.label} hero`
      : "Page hero";

  if (useStack && backgroundImageUrl) {
    return (
      <section
        className={`page-hero page-hero--stack${centered ? " page-hero--centered" : ""}`}
        aria-label={heroAriaLabel}
      >
        <div
          className="page-hero__banner-strip"
          aria-hidden="true"
          style={{
            backgroundImage: `url(${backgroundImageUrl})`,
            backgroundSize: "cover",
            backgroundPosition,
          }}
        />
        <div className="page-hero__inner page-hero__inner--stack">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className="page-hero__stack-breadcrumbs">
              <Breadcrumb items={breadcrumbs} dark={false} />
            </div>
          )}
          {eyebrow && <p className="page-hero__eyebrow">{eyebrow}</p>}
          {title ? <h1 className="page-hero__title">{title}</h1> : null}
          {subtitle ? <p className="page-hero__sub">{subtitle}</p> : null}
          {(ctaPrimary || ctaSecondary) && (
            <div
              className="page-hero__actions"
              {...(decorativeActions
                ? { "aria-label": "Preview only — these buttons are not linked" }
                : {})}
            >
              {ctaPrimary &&
                (decorativeActions ? (
                  <span className="btn btn-primary btn-lg" style={{ cursor: "default" }}>
                    {ctaPrimary.label}
                  </span>
                ) : (
                  <Link href={ctaPrimary.href} className="btn btn-primary btn-lg">
                    {ctaPrimary.label}
                  </Link>
                ))}
              {ctaSecondary &&
                (decorativeActions ? (
                  <span className="btn btn-outline btn-lg" style={{ cursor: "default" }}>
                    {ctaSecondary.label}
                  </span>
                ) : (
                  <Link href={ctaSecondary.href} className="btn btn-outline btn-lg">
                    {ctaSecondary.label}
                  </Link>
                ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  const breadcrumbDark = Boolean(backgroundImageUrl) || !isLight;

  return (
    <section
      className={`page-hero${centered ? " page-hero--centered" : ""}${backgroundImageUrl ? " page-hero--with-photo" : ""}${isLight ? " page-hero--light" : ""}`}
      aria-label={heroAriaLabel}
      style={
        backgroundImageUrl
          ? {
              backgroundImage: `${PHOTO_OVERLAY_SCRIM}, url(${backgroundImageUrl})`,
              backgroundSize: "cover",
              backgroundPosition,
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
        {title ? <h1 className="page-hero__title">{title}</h1> : null}
        {subtitle ? <p className="page-hero__sub">{subtitle}</p> : null}
        {(ctaPrimary || ctaSecondary) && (
          <div
            className="page-hero__actions"
            {...(decorativeActions
              ? { "aria-label": "Preview only — these buttons are not linked" }
              : {})}
          >
            {ctaPrimary &&
              (decorativeActions ? (
                <span className="btn btn-primary btn-lg" style={{ cursor: "default" }}>
                  {ctaPrimary.label}
                </span>
              ) : (
                <Link href={ctaPrimary.href} className="btn btn-primary btn-lg">
                  {ctaPrimary.label}
                </Link>
              ))}
            {ctaSecondary &&
              (decorativeActions ? (
                <span className="btn btn-outline btn-lg" style={{ cursor: "default" }}>
                  {ctaSecondary.label}
                </span>
              ) : (
                <Link href={ctaSecondary.href} className="btn btn-outline btn-lg">
                  {ctaSecondary.label}
                </Link>
              ))}
          </div>
        )}
      </div>
    </section>
  );
}
