import Link from "next/link";
import type { Locale } from "@/types/content";

interface HomeHeroProps {
  locale: Locale;
}

export function HomeHero({ locale }: HomeHeroProps) {
  const t =
    locale === "tr"
      ? {
          label: "KuppingerCole Analistleri",
          title: "Kron, KuppingerCole Analistleri Tarafından 3 Kategoride Lider ve 1 Kategoride Challenger Olarak Tanındı!",
          sub: "Kron, dünya genelinde ayrıcalıklı erişim güvenliği, kimlik yönetimi ve siber güvenlik alanlarındaki üstün performansı ile tanınmaktadır.",
          cta: "Raporları İnceleyin",
          badge: "LİDERLİK PUSULASI 2025",
        }
      : {
          label: "KuppingerCole Analysts",
          title: "Kron Recognized as a Leader in 3 Categories and a Challenger in 1 Category by KuppingerCole Analysts!",
          sub: "Kron has achieved success referenced by being recognized by one of the world's leading analyst firms. Kuppingeercole has recognized Kron as an Overall Leader, Innovation Leader, Product Leader in Non-Human Identity Management.",
          cta: "Get The Reports Now",
          badge: "LEADERSHIP COMPASS 2025",
        };

  return (
    <section className="home-hero" aria-label="Homepage hero">
      <div className="home-hero__inner">
        <div className="home-hero__content">
          <p className="home-hero__label">{t.label}</p>
          <h1 className="home-hero__title">{t.title}</h1>
          <p className="home-hero__sub">{t.sub}</p>
          <Link href={`/${locale}/resources`} className="btn btn-primary btn-lg">
            {t.cta}
          </Link>
        </div>
        <div className="home-hero__badge" aria-hidden="true">
          <p className="home-hero__badge-title">{t.badge}</p>
          <div className="home-hero__badge-icon">K</div>
          <p className="home-hero__badge-name">Kron</p>
        </div>
      </div>
    </section>
  );
}
