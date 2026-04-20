"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadMedia, AdminApiError } from "@/lib/api/admin";
import { ErrorBanner, SuccessBanner } from "@/components/admin/ui";

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaUploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [altText, setAltText] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) {
      setFile(null);
      setPreview(null);
      return;
    }
    setFile(f);
    setError("");
    if (f.type.startsWith("image/")) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (!f) return;
    setFile(f);
    setError("");
    if (f.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please select a file.");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");
    setProgress(10);

    try {
      // Simulate progress while the upload is in flight.
      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + 15, 85));
      }, 400);

      const asset = await uploadMedia(file, altText || undefined);
      clearInterval(progressInterval);
      setProgress(100);
      setSuccess(`"${asset.fileName}" uploaded successfully.`);

      setTimeout(() => router.push(`/admin/media/${asset.id}`), 900);
    } catch (err) {
      setProgress(0);
      if (err instanceof AdminApiError && err.status === 503) {
        setError(
          "Object storage is unavailable. Make sure MinIO is running: docker compose up -d"
        );
      } else if (err instanceof AdminApiError && err.status === 415) {
        setError("That file type is not allowed. Supported: images, PDF, Office documents, video, audio.");
      } else {
        setError(err instanceof Error ? err.message : "Upload failed.");
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <Link href="/admin/media" className="admin-back-link">
        ← Media Library
      </Link>

      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Upload Media</h1>
          <p className="admin-page-subtitle">
            Files are stored in S3-compatible object storage (MinIO in local dev)
          </p>
        </div>
      </div>

      <div className="admin-card" style={{ maxWidth: 580 }}>
        <div className="admin-card-body">
          <form onSubmit={handleSubmit} className="admin-form">
            {error && <ErrorBanner message={error} />}
            {success && <SuccessBanner message={success} />}

            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => inputRef.current?.click()}
              style={{
                border: `2px dashed ${file ? "var(--a-accent)" : "var(--a-border)"}`,
                borderRadius: "var(--a-r)",
                padding: "28px 20px",
                textAlign: "center",
                cursor: "pointer",
                background: file ? "var(--a-accent-light)" : "var(--a-bg)",
                transition: "border-color 0.15s, background 0.15s",
              }}
            >
              {file ? (
                <div>
                  {preview ? (
                    <img
                      src={preview}
                      alt="Preview"
                      style={{
                        maxHeight: 200,
                        maxWidth: "100%",
                        objectFit: "contain",
                        marginBottom: 10,
                        borderRadius: 4,
                        display: "block",
                        marginLeft: "auto",
                        marginRight: "auto",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        fontSize: 40,
                        marginBottom: 10,
                        lineHeight: 1,
                      }}
                    >
                      📄
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: "var(--a-text)",
                    }}
                  >
                    {file.name}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--a-text-muted)",
                      marginTop: 2,
                    }}
                  >
                    {formatBytes(file.size)} · {file.type || "unknown type"}
                  </div>
                  <button
                    type="button"
                    className="admin-btn admin-btn--ghost admin-btn--sm"
                    style={{ marginTop: 10 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setPreview(null);
                      if (inputRef.current) inputRef.current.value = "";
                    }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  <div
                    style={{
                      fontSize: 32,
                      marginBottom: 8,
                      lineHeight: 1,
                      opacity: 0.5,
                    }}
                  >
                    ☁️
                  </div>
                  <p
                    style={{
                      margin: "0 0 4px",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--a-text)",
                    }}
                  >
                    Drop a file here, or click to browse
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      color: "var(--a-text-muted)",
                    }}
                  >
                    Images, PDF, Office documents, video, audio · Max 20 MB
                  </p>
                </div>
              )}
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,video/*,audio/*,.csv,.txt"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />

            <div className="admin-field">
              <label className="admin-label">
                Alt text{" "}
                <span className="admin-label-hint">
                  (accessibility description for images)
                </span>
              </label>
              <input
                type="text"
                className="admin-input"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Descriptive text for screen readers"
                maxLength={500}
              />
            </div>

            {/* Upload progress bar */}
            {uploading && (
              <div>
                <div
                  style={{
                    height: 4,
                    background: "var(--a-border)",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${progress}%`,
                      background: "var(--a-accent)",
                      transition: "width 0.4s ease",
                      borderRadius: 2,
                    }}
                  />
                </div>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--a-text-muted)",
                    marginTop: 4,
                  }}
                >
                  Uploading to MinIO…
                </p>
              </div>
            )}

            <div
              style={{
                background: "#f8f9ff",
                border: "1px solid #e0e7ff",
                borderRadius: "var(--a-r)",
                padding: "10px 14px",
                fontSize: 12,
                color: "#4338ca",
                lineHeight: 1.5,
              }}
            >
              <strong>Storage:</strong> Files are uploaded to MinIO (
              <code style={{ fontFamily: "monospace" }}>
                {(() => {
                  try {
                    return new URL(
                      process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1",
                    ).origin;
                  } catch {
                    return "http://localhost:8080";
                  }
                })()}
              </code>
              ). The object key is automatically assigned. After upload, copy the
              returned object key into any content field that references media.
            </div>

            <div className="admin-form-footer">
              <Link href="/admin/media" className="admin-btn admin-btn--secondary">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={uploading || !file}
                className="admin-btn admin-btn--primary"
              >
                {uploading ? (
                  <>
                    <span className="admin-spinner admin-spinner--sm" />
                    Uploading…
                  </>
                ) : (
                  "Upload File"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
