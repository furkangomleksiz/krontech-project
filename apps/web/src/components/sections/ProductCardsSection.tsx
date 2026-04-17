import { ProductCard } from "@/components/sections/ProductCard";
import { SectionTitle } from "@/components/ui/SectionTitle";
import type { Locale } from "@/types/content";

interface ProductCardsSectionProps {
  locale: Locale;
}

const products = [
  {
    abbrev: "PAM",
    tag: "Privileged Access",
    title: "Privileged Access Management",
    description: "Identity-first PAM controls for enterprise access governance, integrating with all infrastructure.",
    bullets: ["Session recording & live monitoring", "Dynamic credential vaulting", "Just-in-time privilege elevation"],
    href: "/products/kron-pam",
  },
  {
    abbrev: "AAA",
    tag: "Subscriber Management",
    title: "AAA Solution & Subscriber Management",
    description: "Authentication, authorization, and accounting platform for telecoms and enterprises.",
    bullets: ["Scalable RADIUS/DIAMETER support", "Policy-based access control", "Real-time subscriber analytics"],
    href: "/products/aaa",
  },
  {
    abbrev: "TLP",
    tag: "Observability",
    title: "Telemetry Pipeline",
    description: "Security event observability and high-throughput pipeline management for modern SOCs.",
    bullets: ["Multi-source log aggregation", "Real-time threat correlation", "SIEM/SOAR integration"],
    href: "/products/tlmp",
  },
];

export function ProductCardsSection({ locale }: ProductCardsSectionProps) {
  const heading = locale === "tr" ? "Kron Ürünleri" : "Kron Products";
  const sub =
    locale === "tr"
      ? "Kron, siber güvenlik alanında öne çıkan yazılım ürünleri sunmaktadır."
      : "Kron offers leading-edge cybersecurity and access security software products.";

  return (
    <section className="product-cards-section section-pad" aria-label="Kron Products">
      <div className="container">
        <SectionTitle title={heading} subtitle={sub} center />
        <div className="product-cards-grid">
          {products.map((p) => (
            <ProductCard key={p.abbrev} {...p} href={`/${locale}${p.href}`} />
          ))}
        </div>
      </div>
    </section>
  );
}
