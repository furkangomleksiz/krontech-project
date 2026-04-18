"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { registerMedia } from "@/lib/api/admin";
import { ErrorBanner, SuccessBanner } from "@/components/admin/ui";

export default function RegisterMediaPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    objectKey: "", fileName: "", mimeType: "image/jpeg",
    sizeBytes: 0, altText: "", width: "", height: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function set(key: string, value: string | number) { setForm((f) => ({ ...f, [key]: value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError(""); setSuccess("");
    try {
      const item = await registerMedia({
        objectKey: form.objectKey, fileName: form.fileName, mimeType: form.mimeType,
        sizeBytes: Number(form.sizeBytes),
        altText: form.altText || undefined,
        width: form.width ? Number(form.width) : undefined,
        height: form.height ? Number(form.height) : undefined,
      });
      setSuccess("Asset registered."); router.push(`/admin/media/${item.id}`);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to register asset."); }
    finally { setSaving(false); }
  }

  return (
    <>
      <Link href="/admin/media" className="admin-back-link">← Media Library</Link>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Register Asset</h1>
        <p className="admin-page-subtitle" style={{ marginTop: 4, fontSize: 13, color: "var(--a-text-muted)" }}>
          Register metadata for an asset that has already been uploaded to S3/MinIO.
        </p>
      </div>
      <div className="admin-card">
        <div className="admin-card-body">
          <form onSubmit={handleSubmit} className="admin-form">
            {error && <ErrorBanner message={error} />}
            {success && <SuccessBanner message={success} />}
            <div className="admin-field">
              <label className="admin-label">Object key * <span className="admin-label-hint">(S3 path)</span></label>
              <input type="text" className="admin-input" value={form.objectKey}
                onChange={(e) => set("objectKey", e.target.value)} placeholder="media/2025/hero-banner.jpg" required />
            </div>
            <div className="admin-form-row admin-form-row--2">
              <div className="admin-field">
                <label className="admin-label">File name *</label>
                <input type="text" className="admin-input" value={form.fileName}
                  onChange={(e) => set("fileName", e.target.value)} placeholder="hero-banner.jpg" required />
              </div>
              <div className="admin-field">
                <label className="admin-label">MIME type *</label>
                <select className="admin-select" value={form.mimeType} onChange={(e) => set("mimeType", e.target.value)}>
                  <option value="image/jpeg">image/jpeg</option>
                  <option value="image/png">image/png</option>
                  <option value="image/webp">image/webp</option>
                  <option value="image/svg+xml">image/svg+xml</option>
                  <option value="application/pdf">application/pdf</option>
                  <option value="video/mp4">video/mp4</option>
                  <option value="video/webm">video/webm</option>
                </select>
              </div>
            </div>
            <div className="admin-form-row admin-form-row--3">
              <div className="admin-field">
                <label className="admin-label">Size (bytes) *</label>
                <input type="number" className="admin-input" value={form.sizeBytes || ""}
                  onChange={(e) => set("sizeBytes", parseInt(e.target.value) || 0)} min={0} required />
              </div>
              <div className="admin-field">
                <label className="admin-label">Width (px)</label>
                <input type="number" className="admin-input" value={form.width}
                  onChange={(e) => set("width", e.target.value)} min={1} />
              </div>
              <div className="admin-field">
                <label className="admin-label">Height (px)</label>
                <input type="number" className="admin-input" value={form.height}
                  onChange={(e) => set("height", e.target.value)} min={1} />
              </div>
            </div>
            <div className="admin-field">
              <label className="admin-label">Alt text</label>
              <input type="text" className="admin-input" value={form.altText}
                onChange={(e) => set("altText", e.target.value)} placeholder="Descriptive alt text for accessibility" />
            </div>
            <div className="admin-form-footer">
              <Link href="/admin/media" className="admin-btn admin-btn--secondary">Cancel</Link>
              <button type="submit" disabled={saving} className="admin-btn admin-btn--primary">
                {saving ? "Registering…" : "Register Asset"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
