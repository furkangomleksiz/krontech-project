import Link from "next/link";
import type { AwardBadge, Locale } from "@/types/content";

interface WhyKronSectionProps {
  locale: Locale;
  awards: AwardBadge[];
}

export function WhyKronSection({ locale, awards }: WhyKronSectionProps) {
  const t =
    locale === "tr"
      ? { title: "Neden Kron?", desc: "Kron PAM, kurumunuzu güvende tutmak için en son ayrıcalıklı erişim güvenliği teknolojilerini, gerçek zamanlı analitik ve güçlü otomasyon özellikleriyle birleştiriyor.", cta: "Daha Fazla Bilgi" }
      : { title: "Why Kron?", desc: "Kron PAM brings together the latest privileged access security technologies with real-time analytics and powerful automation capabilities to keep your enterprise secure and compliant across any environment.", cta: "Learn More" };

  return (
    <section className="why-kron section-pad" aria-label="Why Kron?">
      <div className="container">
        <div className="why-kron__inner">
          <div className="why-kron__text">
            <h2 className="why-kron__title">{t.title}</h2>
            <p className="why-kron__desc">{t.desc}</p>
            <Link href={`/${locale}/products/kron-pam`} className="btn btn-outline">
              {t.cta}
            </Link>
          </div>
          <div className="why-kron__awards" aria-label="Awards and recognition">
            {awards.map((a) => (
              <div className="award-badge" key={a.id}>
                <div className="award-badge__icon" aria-hidden="true">{a.abbrev}</div>
                <div className="award-badge__text">
                  <p className="award-badge__name">{a.name}</p>
                  <p className="award-badge__sub">{a.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
