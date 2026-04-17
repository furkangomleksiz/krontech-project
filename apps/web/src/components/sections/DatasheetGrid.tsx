import { DatasheetCard } from "@/components/sections/DatasheetCard";
import { SectionTitle } from "@/components/ui/SectionTitle";
import type { Datasheet, Locale } from "@/types/content";

interface DatasheetGridProps {
  datasheets: Datasheet[];
  locale: Locale;
  title?: string;
}

export function DatasheetGrid({ datasheets, locale, title }: DatasheetGridProps) {
  const downloadLabel = locale === "tr" ? "İndir" : "Download";
  const heading = title ?? (locale === "tr" ? "İndirilebilir Kaynaklar" : "Downloadable Resources");

  return (
    <section className="section-pad bg-gray" aria-label="Downloadable datasheets">
      <div className="container">
        <SectionTitle title={heading} center />
        <div className="datasheet-grid">
          {datasheets.map((ds) => (
            <DatasheetCard key={ds.id} datasheet={ds} downloadLabel={downloadLabel} />
          ))}
        </div>
      </div>
    </section>
  );
}
