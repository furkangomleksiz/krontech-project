interface SectionTitleProps {
  label?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
  white?: boolean;
  as?: "h2" | "h1" | "h3";
}

export function SectionTitle({ label, title, subtitle, center, white, as: Tag = "h2" }: SectionTitleProps) {
  const cls = [
    "section-title",
    center ? "section-title--center" : "",
    white ? "section-title--white" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cls}>
      {label && <p className="section-title__label">{label}</p>}
      <Tag className="section-title__heading">{title}</Tag>
      {subtitle && <p className="section-title__sub">{subtitle}</p>}
    </div>
  );
}
