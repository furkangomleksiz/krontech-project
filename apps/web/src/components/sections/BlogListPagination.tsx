import Link from "next/link";
import type { Locale } from "@/types/content";

interface BlogListPaginationProps {
  locale: Locale;
  /** 1-based current page. */
  currentPage: number;
  totalPages: number;
}

type PageEntry = number | "ellipsis";

function visiblePageIndicators(current: number, total: number): PageEntry[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis", total];
  }
  if (current >= total - 3) {
    return [1, "ellipsis", total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, "ellipsis", current - 1, current, current + 1, "ellipsis", total];
}

export function BlogListPagination({ locale, currentPage, totalPages }: BlogListPaginationProps) {
  if (totalPages <= 1) return null;

  const base = `/${locale}/blog`;
  const href = (p: number) => (p <= 1 ? base : `${base}?page=${p}`);
  const indicators = visiblePageIndicators(currentPage, totalPages);

  return (
    <nav className="pagination" aria-label="Blog pagination">
      {currentPage > 1 ? (
        <Link href={href(currentPage - 1)} className="page-btn" aria-label="Previous page">
          ‹
        </Link>
      ) : (
        <span className="page-btn page-btn--disabled" aria-disabled="true">
          ‹
        </span>
      )}

      {indicators.map((item, i) =>
        item === "ellipsis" ? (
          <span key={`e-${i}`} className="pagination__ellipsis" aria-hidden>
            …
          </span>
        ) : (
          <Link
            key={item}
            href={href(item)}
            className={`page-btn${item === currentPage ? " page-btn--active" : ""}`}
            {...(item === currentPage ? ({ "aria-current": "page" } as const) : {})}
            aria-label={`Page ${item}`}
          >
            {item}
          </Link>
        ),
      )}

      {currentPage < totalPages ? (
        <Link href={href(currentPage + 1)} className="page-btn" aria-label="Next page">
          ›
        </Link>
      ) : (
        <span className="page-btn page-btn--disabled" aria-disabled="true">
          ›
        </span>
      )}
    </nav>
  );
}
