import { SectionTitle } from "@/components/ui/SectionTitle";
import type { Locale, StatItem } from "@/types/content";

interface StatsSectionProps {
  locale: Locale;
  stats: StatItem[];
}

export function StatsSection({ locale, stats }: StatsSectionProps) {
  const title = locale === "tr" ? "Rakamlarla Kron" : "Kron in Numbers";
  const sub =
    locale === "tr"
      ? "Dünya genelindeki müşterilerimiz ve iş ortaklarımızla gurur duyuyoruz."
      : "We take pride in our growing global footprint of clients, partners, and deployments.";

  return (
    <section className="stats-section section-pad" aria-label="Kron statistics">
      <div className="container">
        <SectionTitle title={title} subtitle={sub} center />
        <div className="stats-grid" role="list">
          {stats.map((s) => (
            <div className="stat-item" key={s.id} role="listitem">
              <div className="stat-item__number">{s.number}</div>
              <div className="stat-item__label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
