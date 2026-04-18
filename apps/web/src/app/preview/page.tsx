"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1").replace(/\/$/, "");

interface BlockItem {
  blockType: string;
  sortOrder: number;
  payloadJson: string;
}

interface SeoMeta {
  metaTitle?: string;
  metaDescription?: string;
}

interface PreviewPage {
  slug: string;
  locale: string;
  title: string;
  summary?: string;
  heroImageUrl?: string;
  seo?: SeoMeta;
  blocks: BlockItem[];
}

function BlockPreview({ block, index }: { block: BlockItem; index: number }) {
  // Using a string-valued map avoids `unknown` rendering issues in JSX.
  let p: Record<string, string> = {};
  try {
    const raw = JSON.parse(block.payloadJson) as Record<string, unknown>;
    p = Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [k, typeof v === "string" ? v : JSON.stringify(v)])
    );
  } catch {
    // ignore malformed JSON
  }

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: 16,
        background: "#fff",
        marginBottom: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            background: "#f3f4f6",
            border: "1px solid #e5e7eb",
            borderRadius: 4,
            padding: "1px 8px",
            fontFamily: "monospace",
            color: "#6b7280",
          }}
        >
          #{index + 1} · {block.blockType}
        </span>
      </div>

      {block.blockType === "hero" && (
        <div>
          {p.eyebrow && (
            <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {p.eyebrow}
            </p>
          )}
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 8px", color: "#111827" }}>
            {p.title}
          </h2>
          {p.description && (
            <p style={{ color: "#374151", margin: "0 0 12px", lineHeight: 1.6 }}>{p.description}</p>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            {p.ctaLabel && (
              <span style={{ background: "#4f46e5", color: "#fff", padding: "6px 14px", borderRadius: 4, fontSize: 13, fontWeight: 500 }}>
                {p.ctaLabel}
              </span>
            )}
            {p.cta2Label && (
              <span style={{ border: "1px solid #e5e7eb", padding: "6px 14px", borderRadius: 4, fontSize: 13 }}>
                {p.cta2Label}
              </span>
            )}
          </div>
        </div>
      )}

      {block.blockType === "text" && (
        <div>
          {p.heading && <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px", color: "#111827" }}>{p.heading}</h3>}
          {p.body && <p style={{ color: "#374151", margin: 0, lineHeight: 1.6 }}>{p.body}</p>}
        </div>
      )}

      {block.blockType === "split-cta" && (
        <div>
          {p.heading && <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>{p.heading}</h3>}
          {p.description && <p style={{ color: "#374151", margin: "0 0 10px" }}>{p.description}</p>}
          {p.ctaLabel && (
            <span style={{ background: "#4f46e5", color: "#fff", padding: "5px 12px", borderRadius: 4, fontSize: 13, fontWeight: 500 }}>
              {p.ctaLabel}
            </span>
          )}
        </div>
      )}

      {!["hero", "text", "split-cta"].includes(block.blockType) && (
        <details>
          <summary style={{ fontSize: 12, color: "#6b7280", cursor: "pointer", marginBottom: 8 }}>Payload JSON</summary>
          <pre
            style={{
              fontSize: 11, fontFamily: "monospace", background: "#f9fafb",
              border: "1px solid #e5e7eb", borderRadius: 4, padding: "8px 10px",
              overflow: "auto", margin: 0,
            }}
          >
            {block.payloadJson}
          </pre>
        </details>
      )}
    </div>
  );
}

export default function PreviewPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [page, setPage] = useState<PreviewPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("No preview token provided.");
      setLoading(false);
      return;
    }
    fetch(`${API_BASE}/preview?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (!res.ok) {
          const msg = await res.text().catch(() => `HTTP ${res.status}`);
          throw new Error(msg || `HTTP ${res.status}`);
        }
        return res.json() as Promise<PreviewPage>;
      })
      .then((data) => setPage(data))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load preview."))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Preview mode banner */}
      <div
        style={{
          background: "#4f46e5",
          color: "#fff",
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        <span>
          🔍 <strong>Preview mode</strong> — this content is not yet published
        </span>
        {page && (
          <span style={{ opacity: 0.8, fontSize: 12 }}>
            {page.locale.toUpperCase()} · /{page.locale}/{page.slug}
          </span>
        )}
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 24px" }}>
        {loading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 60,
              gap: 12,
              color: "#6b7280",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 20,
                height: 20,
                border: "2px solid #e5e7eb",
                borderTopColor: "#4f46e5",
                borderRadius: "50%",
                animation: "spin 0.6s linear infinite",
              }}
            />
            Loading preview…
          </div>
        )}

        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fca5a5",
              borderRadius: 8,
              padding: "14px 18px",
              color: "#dc2626",
            }}
          >
            <strong>Preview unavailable:</strong> {error}
          </div>
        )}

        {page && (
          <>
            {/* Page header */}
            <div style={{ marginBottom: 28 }}>
              {page.heroImageUrl && (
                <img
                  src={page.heroImageUrl}
                  alt={page.title}
                  style={{
                    width: "100%",
                    height: 240,
                    objectFit: "cover",
                    borderRadius: 8,
                    marginBottom: 20,
                    display: "block",
                  }}
                />
              )}
              <h1
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: "#111827",
                  margin: "0 0 10px",
                }}
              >
                {page.title}
              </h1>
              {page.summary && (
                <p style={{ fontSize: 16, color: "#374151", margin: "0 0 8px", lineHeight: 1.6 }}>
                  {page.summary}
                </p>
              )}
              {page.seo?.metaDescription && (
                <p
                  style={{
                    fontSize: 13,
                    color: "#6b7280",
                    margin: 0,
                    borderLeft: "3px solid #e5e7eb",
                    paddingLeft: 12,
                  }}
                >
                  SEO: {page.seo.metaDescription}
                </p>
              )}
            </div>

            {/* Content blocks */}
            {page.blocks.length > 0 && (
              <>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "#9ca3af",
                    marginBottom: 12,
                  }}
                >
                  Content blocks ({page.blocks.length})
                </div>
                {page.blocks
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((block, i) => (
                    <BlockPreview key={i} block={block} index={i} />
                  ))}
              </>
            )}

            {page.blocks.length === 0 && (
              <div
                style={{
                  padding: "24px",
                  textAlign: "center",
                  color: "#6b7280",
                  background: "#fff",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                }}
              >
                No content blocks defined for this page.
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
