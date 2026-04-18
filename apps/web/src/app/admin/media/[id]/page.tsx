"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getMediaAsset, updateMedia, type MediaAdminItem } from "@/lib/api/admin";
import { ErrorBanner, LoadingState, SuccessBanner } from "@/components/admin/ui";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function EditMediaPage() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<MediaAdminItem | null>(null);
  const [form, setForm] = useState({ altText: "", width: "", height: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    getMediaAsset(id)
      .then((a) => { setItem(a); setForm({ altText: a.altText ?? "", width: a.width ? String(a.width) : "", height: a.height ? String(a.height) : "" }); })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load."))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError(""); setSuccess("");
    try {
      const updated = await updateMedia(id, { altText: form.altText || undefined, width: form.width ? Number(form.width) : undefined, height: form.height ? Number(form.height) : undefined });
      setItem(updated); setSuccess("Metadata updated.");
    } catch (err) { setError(err instanceof Error ? err.message : "Save failed."); }
    finally { setSaving(false); }
  }

  if (loading) return <LoadingState />;

  return (
    <>
      <Link href="/admin/media" className="admin-back-link">← Media Library</Link>
      <div className="admin-page-header">
        <h1 className="admin-page-title">{item?.fileName ?? "Edit Asset"}</h1>
        {item && <span style={{ fontSize: 13, color: "var(--a-text-muted)" }}>{item.mimeType} · {formatBytes(item.sizeBytes)}</span>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>
        <div className="admin-card">
          <div className="admin-card-body">
            <form onSubmit={handleSave} className="admin-form">
              {error && <ErrorBanner message={error} />}
              {success && <SuccessBanner message={success} />}
              <div className="admin-field">
                <label className="admin-label">Alt text</label>
                <input type="text" className="admin-input" value={form.altText}
                  onChange={(e) => setForm((f) => ({ ...f, altText: e.target.value }))} />
              </div>
              <div className="admin-form-row admin-form-row--2">
                <div className="admin-field">
                  <label className="admin-label">Width (px)</label>
                  <input type="number" className="admin-input" value={form.width}
                    onChange={(e) => setForm((f) => ({ ...f, width: e.target.value }))} min={1} />
                </div>
                <div className="admin-field">
                  <label className="admin-label">Height (px)</label>
                  <input type="number" className="admin-input" value={form.height}
                    onChange={(e) => setForm((f) => ({ ...f, height: e.target.value }))} min={1} />
                </div>
              </div>
              {item && (
                <div className="admin-detail-grid" style={{ paddingTop: 12, borderTop: "1px solid var(--a-border)" }}>
                  <span className="admin-detail-label">Object key</span>
                  <span className="admin-detail-value" style={{ fontFamily: "monospace", fontSize: 12 }}>{item.objectKey}</span>
                  <span className="admin-detail-label">Public URL</span>
                  <span className="admin-detail-value"><a href={item.publicUrl} target="_blank" rel="noreferrer" style={{ color: "var(--a-accent)", wordBreak: "break-all" }}>{item.publicUrl}</a></span>
                  <span className="admin-detail-label">Uploaded</span>
                  <span className="admin-detail-value">{new Date(item.createdAt).toLocaleString()}</span>
                </div>
              )}
              <div className="admin-form-footer">
                <Link href="/admin/media" className="admin-btn admin-btn--secondary">Cancel</Link>
                <button type="submit" disabled={saving} className="admin-btn admin-btn--primary">{saving ? "Saving…" : "Save Metadata"}</button>
              </div>
            </form>
          </div>
        </div>

        {item && item.mimeType.startsWith("image/") && (
          <div className="admin-card">
            <div className="admin-card-header"><p className="admin-card-title">Preview</p></div>
            <div className="admin-card-body" style={{ padding: 12 }}>
              <img src={item.publicUrl} alt={item.altText ?? item.fileName}
                style={{ width: "100%", borderRadius: 4, display: "block" }} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
