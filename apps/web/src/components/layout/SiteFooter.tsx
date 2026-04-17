import Link from "next/link";
import type { Locale } from "@/types/content";

interface SiteFooterProps {
  locale: Locale;
}

const footerProducts = [
  "Kron PAM", "Network Performance Monitoring", "Authentication",
  "Accounting", "IPAM Logging", "Quality Assurance",
];
const footerPartners = ["Energy", "Finance", "Government", "Telecom"];
const footerAbout = [
  "Management", "Board of Directors", "Human Resources",
  "Newsletter", "Announcements", "Awards",
];

export function SiteFooter({ locale }: SiteFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer" aria-label="Site footer">
      <div className="footer-main">
        {/* Brand */}
        <div className="footer-brand">
          <Link href={`/${locale}`} className="footer-brand__logo" aria-label="Kron home">
            <span className="footer-brand__icon" aria-hidden="true">K</span>
            Kron
          </Link>
          <p className="footer-brand__tagline">Kron Technologies</p>
        </div>

        {/* Products */}
        <div className="footer-col">
          <h3 className="footer-col__heading">Products</h3>
          <ul className="footer-col__list">
            {footerProducts.map((p) => (
              <li key={p}>
                <Link href={`/${locale}/products/kron-pam`} className="footer-col__link">{p}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Partners / Sectors */}
        <div className="footer-col">
          <h3 className="footer-col__heading">Partners</h3>
          <ul className="footer-col__list">
            {footerPartners.map((p) => (
              <li key={p}>
                <Link href="#" className="footer-col__link">{p}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* About Us */}
        <div className="footer-col">
          <h3 className="footer-col__heading">About Us</h3>
          <ul className="footer-col__list">
            {footerAbout.map((item) => (
              <li key={item}>
                <Link href="#" className="footer-col__link">{item}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Social Media */}
        <div className="footer-col">
          <h3 className="footer-col__heading">Social Media</h3>
          <div className="social-icons">
            {[
              { abbrev: "in", label: "LinkedIn",  href: "https://linkedin.com/company/krontech" },
              { abbrev: "tw", label: "Twitter/X",  href: "https://twitter.com/krontechcom" },
              { abbrev: "ig", label: "Instagram",  href: "https://instagram.com/krontech" },
              { abbrev: "yt", label: "YouTube",    href: "https://youtube.com/@krontech" },
            ].map(({ abbrev, label, href }) => (
              <a key={label} href={href} className="social-icon" aria-label={label} target="_blank" rel="noopener noreferrer">
                <span className="social-icon__box" aria-hidden="true">{abbrev}</span>
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span>Copyright © {year} Kron All Rights Reserved</span>
        <nav className="footer-bottom__links" aria-label="Footer legal links">
          <Link href="#" className="footer-bottom__link">Information Security Notice</Link>
          <Link href="#" className="footer-bottom__link">Privacy Policy</Link>
          <Link href="#" className="footer-bottom__link">Cookie Policy</Link>
        </nav>
      </div>
    </footer>
  );
}
