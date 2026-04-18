/**
 * Locale layout loading state — shown while any [locale]/* page is streaming.
 *
 * React Suspense + Next.js App Router display this component while a Server Component
 * in the [locale] segment is fetching data (e.g. getPublicPage, getBlogList).
 * It appears within the existing locale layout shell (header, footer are already rendered).
 */

export default function LocaleLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading page content"
      style={{
        minHeight: "60vh",
        padding: "48px 24px",
        maxWidth: 900,
        margin: "0 auto",
      }}
    >
      {/* Hero skeleton */}
      <div
        style={{
          height: 260,
          background: "linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)",
          backgroundSize: "200% 100%",
          animation: "skeleton-shimmer 1.4s infinite",
          borderRadius: 8,
          marginBottom: 32,
        }}
      />

      {/* Content rows skeleton */}
      {[100, 80, 90, 60].map((width, i) => (
        <div
          key={i}
          style={{
            height: 18,
            width: `${width}%`,
            background: "linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)",
            backgroundSize: "200% 100%",
            animation: "skeleton-shimmer 1.4s infinite",
            borderRadius: 4,
            marginBottom: 14,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}

      <style>{`
        @keyframes skeleton-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
