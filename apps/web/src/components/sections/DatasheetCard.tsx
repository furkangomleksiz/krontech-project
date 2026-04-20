import type { Datasheet } from "@/types/content";

interface DatasheetCardProps {
  datasheet: Datasheet;
  downloadLabel?: string;
}

export function DatasheetCard({ datasheet, downloadLabel = "Download" }: DatasheetCardProps) {
  return (
    <article className="datasheet-card">
      <div className="datasheet-card__cover" aria-hidden="true">
        {datasheet.coverImageUrl ? (
          <img src={datasheet.coverImageUrl} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        ) : (
          <div className="datasheet-card__cover-inner">
            <div className="datasheet-card__logo">K</div>
            <div className="datasheet-card__lines">
              <div className="datasheet-card__line" />
              <div className="datasheet-card__line" />
              <div className="datasheet-card__line" />
            </div>
          </div>
        )}
      </div>
      <div className="datasheet-card__body">
        <h3 className="datasheet-card__title">{datasheet.title}</h3>
        <a
          href={datasheet.downloadUrl}
          className="btn btn-outline-blue btn-sm"
          download={datasheet.downloadUrl !== "#"}
          aria-label={`Download ${datasheet.title} datasheet`}
        >
          {downloadLabel}
        </a>
      </div>
    </article>
  );
}
