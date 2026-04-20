"use client";

import { useCallback, useEffect, useState } from "react";
import { listMedia, type MediaAdminItem } from "@/lib/api/admin";

export type MediaPickerVariant = "image" | "pdf";

interface MediaPickerProps {
  /** Current value of the field (an S3 object key). */
  value: string;
  onChange: (key: string) => void;
  label?: string;
  placeholder?: string;
  /** `pdf` lists `application/pdf` uploads for document fields. */
  variant?: MediaPickerVariant;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaPicker({
  value,
  onChange,
  label = "Image key",
  placeholder = "media/image.jpg",
  variant = "image",
}: MediaPickerProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<MediaAdminItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const mimePrefix = variant === "pdf" ? "application/pdf" : "image/";

  const fetchMedia = useCallback(
    async (p = 0) => {
      setLoading(true);
      setError("");
      try {
        const res = await listMedia({ page: p, size: 20, mimeType: mimePrefix });
        setItems(res.content);
        setTotalPages(res.totalPages);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load media.");
      } finally {
        setLoading(false);
      }
    },
    [mimePrefix],
  );

  useEffect(() => {
    if (open) {
      setPage(0);
      fetchMedia(0);
    }
  }, [open, fetchMedia]);

  return (
    <>
      <div className="admin-field">
        <label className="admin-label">{label}</label>
        <div className="admin-media-picker-row">
          <input
            type="text"
            className="admin-input"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
          <button
            type="button"
            className="admin-btn admin-btn--secondary"
            onClick={() => setOpen(true)}
          >
            Browse
          </button>
        </div>
        {value && (
          <div style={{ marginTop: 6, fontSize: 12, color: "var(--a-text-muted)" }}>
            Key: <code style={{ fontFamily: "monospace" }}>{value}</code>
          </div>
        )}
      </div>

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.5)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
          onClick={() => setOpen(false)}
        >
          <div
            className="admin-card"
            style={{ width: "100%", maxWidth: 680, maxHeight: "85vh", display: "flex", flexDirection: "column" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-card-header">
              <p className="admin-card-title">
                {variant === "pdf" ? "Media Library — select a PDF" : "Media Library — select an image"}
              </p>
              <button
                className="admin-btn admin-btn--ghost admin-btn--sm"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>

            <div style={{ overflowY: "auto", flex: 1, padding: 16 }}>
              {error && (
                <div className="admin-error-banner" style={{ marginBottom: 12 }}>
                  {error}
                </div>
              )}
              {loading ? (
                <div className="admin-loading">
                  <span className="admin-spinner" />
                </div>
              ) : items.length === 0 ? (
                <p style={{ color: "var(--a-text-muted)", textAlign: "center", padding: 24 }}>
                  {variant === "pdf"
                    ? "No PDFs in the media library yet. Upload a PDF first."
                    : "No images in the media library yet. Upload assets first."}
                </p>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                    gap: 10,
                  }}
                >
                  {items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onChange(item.objectKey);
                        setOpen(false);
                      }}
                      style={{
                        border: `2px solid ${value === item.objectKey ? "var(--a-accent)" : "var(--a-border)"}`,
                        borderRadius: 6,
                        overflow: "hidden",
                        background: "none",
                        cursor: "pointer",
                        padding: 0,
                        textAlign: "left",
                        transition: "border-color 0.15s",
                      }}
                    >
                      {variant === "pdf" ? (
                        <div
                          style={{
                            height: 100,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "#f3f4f6",
                            fontSize: 36,
                          }}
                          aria-hidden
                        >
                          PDF
                        </div>
                      ) : (
                        <img
                          src={item.publicUrl}
                          alt={item.altText ?? item.fileName}
                          style={{
                            width: "100%",
                            height: 100,
                            objectFit: "cover",
                            display: "block",
                            background: "#f3f4f6",
                          }}
                        />
                      )}
                      <div style={{ padding: "6px 8px" }}>
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 500,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            color: "var(--a-text)",
                          }}
                          title={item.fileName}
                        >
                          {item.fileName}
                        </div>
                        <div style={{ fontSize: 10, color: "var(--a-text-muted)" }}>
                          {formatBytes(item.sizeBytes)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                style={{
                  padding: "10px 16px",
                  borderTop: "1px solid var(--a-border)",
                  display: "flex",
                  gap: 8,
                  justifyContent: "flex-end",
                }}
              >
                <button
                  className="admin-btn admin-btn--secondary admin-btn--sm"
                  disabled={page === 0}
                  onClick={() => { setPage(page - 1); fetchMedia(page - 1); }}
                >
                  ← Prev
                </button>
                <span style={{ fontSize: 13, alignSelf: "center", color: "var(--a-text-muted)" }}>
                  {page + 1} / {totalPages}
                </span>
                <button
                  className="admin-btn admin-btn--secondary admin-btn--sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => { setPage(page + 1); fetchMedia(page + 1); }}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
