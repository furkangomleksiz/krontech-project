import Image from "next/image";
import Link from "next/link";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import type { Locale } from "@/types/content";

interface SiteHeaderProps {
  locale: Locale;
}

const navItems = [
  { label: "Products",   hasDropdown: true },
  { label: "Solutions",  hasDropdown: true },
  { label: "Partners",   hasDropdown: true },
  { label: "Resources",  hasDropdown: true },
  { label: "About Us",   hasDropdown: true },
  { label: "Contact",    hasDropdown: false },
];

export function SiteHeader({ locale }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <div className="nav-shell">
        {/* Logo */}
        <Link href={`/${locale}`} className="brand" aria-label="Kron Technologies home">
          <Image
            src="/kron-banner-logo.png"
            alt=""
            width={256}
            height={120}
            className="brand__logo"
            priority
            sizes="(max-width: 640px) 160px, 200px"
          />
        </Link>

        {/* Primary nav */}
        <nav className="nav-primary" aria-label="Primary navigation">
          <ul className="nav-primary__list">
            {navItems.map(({ label, hasDropdown }) => {
              const href =
                label === "Contact"
                  ? `/${locale}/contact`
                  : label === "Resources"
                  ? `/${locale}/resources`
                  : label === "Products"
                  ? `/${locale}/products`
                  : "#";
              return (
                <li key={label}>
                  <Link href={href} className="nav-primary__link">
                    {label}
                    {hasDropdown && (
                      <svg className="nav-chevron" viewBox="0 0 10 10" aria-hidden="true">
                        <polyline points="2,3 5,7 8,3" />
                      </svg>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Right actions */}
        <div className="nav-actions">
          {/* Search */}
          <button className="nav-icon-btn" aria-label="Search">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <circle cx="7" cy="7" r="4.5" />
              <line x1="10.5" y1="10.5" x2="14" y2="14" />
            </svg>
          </button>

          {/* Locale switcher */}
          <LocaleSwitcher locale={locale} />

          {/* Mobile hamburger */}
          <button className="mobile-menu-btn nav-icon-btn" aria-label="Open navigation menu" aria-expanded="false">
            <svg width="18" height="14" viewBox="0 0 18 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <line x1="0" y1="1" x2="18" y2="1" />
              <line x1="0" y1="7" x2="18" y2="7" />
              <line x1="0" y1="13" x2="18" y2="13" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
