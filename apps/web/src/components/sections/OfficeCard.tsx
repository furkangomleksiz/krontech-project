import type { OfficeLocation } from "@/types/content";

interface OfficeCardProps {
  office: OfficeLocation;
}

function MailIcon() {
  return (
    <svg className="office-detail__icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="2" y="4" width="16" height="12" rx="2" />
      <polyline points="2,5 10,11 18,5" />
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg className="office-detail__icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M6 2h3l1.5 3.5-2 1.5a10 10 0 0 0 4.5 4.5l1.5-2L18 11v3c0 1.1-.9 2-2 2A14 14 0 0 1 4 4c0-1.1.9-2 2-2z" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg className="office-detail__icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M10 2a6 6 0 0 1 6 6c0 4-6 10-6 10S4 12 4 8a6 6 0 0 1 6-6z" />
      <circle cx="10" cy="8" r="2" />
    </svg>
  );
}

export function OfficeCard({ office }: OfficeCardProps) {
  return (
    <article className={`office-row${office.reverse ? " office-row--reverse" : ""}`}>
      <div className="office-row__info">
        <h2 className="office-row__city">{office.name}</h2>
        <dl className="office-details">
          <div className="office-detail">
            <MailIcon />
            <div>
              <span className="office-detail__label">E-Mail</span>
              <a href={`mailto:${office.email}`}>{office.email}</a>
            </div>
          </div>
          <div className="office-detail">
            <PhoneIcon />
            <div>
              <span className="office-detail__label">Phone</span>
              <a href={`tel:${office.phone}`}>{office.phone}</a>
            </div>
          </div>
          {office.fax && (
            <div className="office-detail">
              <PhoneIcon />
              <div>
                <span className="office-detail__label">Fax</span>
                <span>{office.fax}</span>
              </div>
            </div>
          )}
          <div className="office-detail">
            <PinIcon />
            <div>
              <span className="office-detail__label">Address</span>
              <address style={{ fontStyle: "normal" }}>{office.address}</address>
            </div>
          </div>
        </dl>
      </div>
      <div className="office-row__image" aria-hidden="true">
        {office.imageUrl && <img src={office.imageUrl} alt={office.name} loading="lazy" />}
      </div>
    </article>
  );
}
