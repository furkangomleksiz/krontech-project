import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/types/content";

interface ResourcesHubSectionProps {
  locale: Locale;
}

export function ResourcesHubSection({ locale }: ResourcesHubSectionProps) {
  const t =
    locale === "tr"
      ? {
          caseStudies: {
            title: "VAKA ÇALIŞMALARI",
            desc: "Kron'un Ayrıcalıklı Erişim Yönetimi vaka çalışmalarıyla hassas verilerinizi ve kritik sistemlerinizi nasıl koruyabileceğinizi öğrenin.",
            cta: "Daha fazlasını keşfedin",
          },
          datasheets: {
            title: "VERİ SAYFALARI",
            desc: "Dünya çapında önde gelen Ayrıcalıklı Erişim Yönetimi paketi Single Connect'in veri sayfalarını inceleyin.",
            cta: "Daha fazlasını keşfedin",
          },
          blog: {
            title: "BLOG",
            desc: "Bilgi teknolojilerindeki son haberler, siber güvenlik trendleri, erişim ve veri güvenliği konularında güncel içerikler Kron Blog'da.",
            cta: "Daha fazlasını keşfedin",
          },
        }
      : {
          caseStudies: {
            title: "CASE STUDIES",
            desc: "Find out how to protect your sensitive data and critical systems with Kron's Privileged Access Management case studies.",
            cta: "Discover More",
          },
          datasheets: {
            title: "DATASHEETS",
            desc: "Uncover the datasheets of Kron's world-leading Privileged Access Management suite Single Connect.",
            cta: "Discover More",
          },
          blog: {
            title: "BLOG",
            desc: "Details on latest news in information technologies, trends in cyber security, access and data security are on the Kron Blog in its most up-to-date form.",
            cta: "Discover More",
          },
        };

  const cards = [
    {
      key: "case-studies",
      imageSrc: "/case-studies-card-image.jpg",
      ...t.caseStudies,
      href: `/${locale}/resources/case-studies`,
    },
    {
      key: "datasheets",
      imageSrc: "/datasheets-card-image.jpg",
      ...t.datasheets,
      href: `/${locale}/resources/datasheets`,
    },
    {
      key: "blog",
      imageSrc: "/blog-card-image.jpg",
      ...t.blog,
      href: `/${locale}/blog`,
    },
  ] as const;

  return (
    <section className="resources-hub section-pad bg-white" aria-label="Resource categories">
      <div className="container">
        <div className="resources-hub__grid">
          {cards.map((card) => (
            <article key={card.key} className="resource-hub-card">
              <div className="resource-hub-card__image">
                <Image
                  src={card.imageSrc}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="resource-hub-card__photo"
                  priority={card.key === "case-studies"}
                />
              </div>
              <div className="resource-hub-card__body">
                <h2 className="resource-hub-card__title">{card.title}</h2>
                <p className="resource-hub-card__desc">{card.desc}</p>
                <Link href={card.href} className="btn btn-outline-blue btn-sm resource-hub-card__cta">
                  {card.cta}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
