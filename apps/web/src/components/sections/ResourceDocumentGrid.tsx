import type { Locale, PublicResourceItem } from "@/types/content";

interface ResourceDocumentGridProps {
  locale: Locale;
  items: PublicResourceItem[];
  emptyMessage: string;
  /** When true, omits outer section padding (e.g. nested inside product detail tabs). */
  embedded?: boolean;
}

export function ResourceDocumentGrid({ locale, items, emptyMessage, embedded }: ResourceDocumentGridProps) {
  const downloadLabel = locale === "tr" ? "İndir" : "Download";

  const innerEmpty = (
    <div className="container">
      <p className="resource-doc-empty">{emptyMessage}</p>
    </div>
  );

  const innerGrid = (
    <div className="container">
      <ul className="resource-doc-grid">
        {items.map((item) => {
          const thumbSrc = item.heroImageUrl ?? item.previewImageUrl;
          return (
            <li key={`${item.slug}-${item.locale}`}>
              <article className="resource-doc-card">
                <div className="resource-doc-card__thumb" aria-hidden="true">
                  {thumbSrc ? (
                    <img src={thumbSrc} alt="" loading="lazy" />
                  ) : null}
                </div>
                <div className="resource-doc-card__body">
                  <h2 className="resource-doc-card__title">{item.title}</h2>
                  {item.summary ? <p className="resource-doc-card__desc">{item.summary}</p> : null}
                  <a
                    href={item.downloadUrl}
                    className="btn btn-outline-blue btn-sm resource-doc-card__cta"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {downloadLabel}
                  </a>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );

  if (embedded) {
    if (items.length === 0) {
      return (
        <div className="resource-doc-section resource-doc-section--embedded" aria-label="Documents">
          {innerEmpty}
        </div>
      );
    }
    return (
      <div className="resource-doc-section resource-doc-section--embedded bg-white" aria-label="Documents">
        {innerGrid}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <section className="section-pad bg-white resource-doc-section" aria-label="Documents">
        {innerEmpty}
      </section>
    );
  }

  return (
    <section className="section-pad bg-white resource-doc-section" aria-label="Documents">
      {innerGrid}
    </section>
  );
}
