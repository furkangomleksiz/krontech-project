/**
 * Blog list loading state — shown while getBlogList() is in flight.
 * Renders card-shaped skeletons that match the BlogCard layout.
 */

export default function BlogListLoading() {
  return (
    <div style={{ padding: "48px 24px", maxWidth: 1100, margin: "0 auto" }} aria-busy="true">
      {/* Page hero skeleton */}
      <div
        style={{
          height: 160,
          background: "linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)",
          backgroundSize: "200% 100%",
          animation: "skeleton-shimmer 1.4s infinite",
          borderRadius: 8,
          marginBottom: 40,
        }}
      />

      {/* Blog card skeletons */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            style={{
              background: "#fff",
              borderRadius: 8,
              padding: 24,
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              animationDelay: `${i * 0.08}s`,
            }}
          >
            <div
              style={{
                height: 22,
                width: "70%",
                background: "linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)",
                backgroundSize: "200% 100%",
                animation: "skeleton-shimmer 1.4s infinite",
                borderRadius: 4,
                marginBottom: 12,
              }}
            />
            <div
              style={{
                height: 14,
                width: "90%",
                background: "linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)",
                backgroundSize: "200% 100%",
                animation: "skeleton-shimmer 1.4s infinite",
                borderRadius: 4,
                marginBottom: 8,
              }}
            />
            <div
              style={{
                height: 14,
                width: "60%",
                background: "linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)",
                backgroundSize: "200% 100%",
                animation: "skeleton-shimmer 1.4s infinite",
                borderRadius: 4,
              }}
            />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes skeleton-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
