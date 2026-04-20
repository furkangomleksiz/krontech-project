import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  dark?: boolean;
}

export function Breadcrumb({ items, dark }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={dark ? "breadcrumb-dark" : ""}>
      <ol className="breadcrumb">
        {items.map((item, i) => (
          <li key={item.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {i > 0 && <span className="breadcrumb__sep" aria-hidden="true">&gt;</span>}
            {item.href && i < items.length - 1 ? (
              <Link href={item.href}>{item.label}</Link>
            ) : i < items.length - 1 ? (
              <span className="breadcrumb__ghost">{item.label}</span>
            ) : (
              <span className="breadcrumb__current">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
