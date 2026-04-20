"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createResource, type SeoAdminFields, type ResourceType } from "@/lib/api/admin";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { ErrorBanner, SeoFieldset, SuccessBanner } from "@/components/admin/ui";

export default function NewResourcePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    slug: "", locale: "tr", title: "", summary: "", heroImageKey: "",
    resourceType: "WHITEPAPER" as ResourceType, fileKey: "", externalUrl: "",
  });
  const [seo, setSeo] = useState<SeoAdminFields>({ noIndex: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function set(key: string, value: string) { setForm((f) => ({ ...f, [key]: value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError(""); setSuccess("");
    if (!form.fileKey && !form.externalUrl) { setError("Provide either a file key or external URL."); setSaving(false); return; }
    try {
      const item = await createResource({ ...form, status: "DRAFT", seo });
      setSuccess("Resource created."); router.push(`/admin/resources/${item.id}`);
    } catch (err) { setError(err instanceof Error ? err.message : "Save failed."); }
    finally { setSaving(false); }
  }

  return (
    <>
      <Link href="/admin/resources" className="admin-back-link">← Resources</Link>
      <div className="admin-page-header"><h1 className="admin-page-title">New Resource</h1></div>
      <div className="admin-card">
        <div className="admin-card-body">
          <form onSubmit={handleSubmit} className="admin-form">
            {error && <ErrorBanner message={error} />}
            {success && <SuccessBanner message={success} />}
            <div className="admin-form-row admin-form-row--3">
              <div className="admin-field">
                <label className="admin-label">Slug *</label>
                <input type="text" className="admin-input" value={form.slug}
                  onChange={(e) => set("slug", e.target.value)} placeholder="pam-whitepaper-2025" required />
              </div>
              <div className="admin-field">
                <label className="admin-label">Locale *</label>
                <select className="admin-select" value={form.locale} onChange={(e) => set("locale", e.target.value)}>
                  <option value="tr">Turkish (tr)</option>
                  <option value="en">English (en)</option>
                </select>
              </div>
              <div className="admin-field">
                <label className="admin-label">Type *</label>
                <select className="admin-select" value={form.resourceType}
                  onChange={(e) => set("resourceType", e.target.value)}>
                  <option value="WHITEPAPER">Whitepaper</option>
                  <option value="DATASHEET">Datasheet</option>
                  <option value="CASE_STUDY">Case Study</option>
                  <option value="VIDEO">Video</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
            <div className="admin-field">
              <label className="admin-label">Title *</label>
              <input type="text" className="admin-input" value={form.title}
                onChange={(e) => set("title", e.target.value)} required />
            </div>
            <div className="admin-field">
              <label className="admin-label">Summary</label>
              <textarea className="admin-textarea" rows={3} value={form.summary}
                onChange={(e) => set("summary", e.target.value)} />
            </div>
            <MediaPicker
              label="Cover image (card thumbnail)"
              placeholder="media/covers/case-study.jpg"
              value={form.heroImageKey}
              onChange={(v) => set("heroImageKey", v)}
            />
            <div className="admin-form-row admin-form-row--2">
              <MediaPicker
                variant="pdf"
                label="PDF file key"
                placeholder="media/docs/resource.pdf"
                value={form.fileKey}
                onChange={(v) => set("fileKey", v)}
              />
              <div className="admin-field">
                <label className="admin-label">External URL <span className="admin-label-hint">(or use a link)</span></label>
                <input type="url" className="admin-input" value={form.externalUrl}
                  onChange={(e) => set("externalUrl", e.target.value)} placeholder="https://..." />
              </div>
            </div>
            <SeoFieldset seo={seo} onChange={setSeo} />
            <div className="admin-form-footer">
              <Link href="/admin/resources" className="admin-btn admin-btn--secondary">Cancel</Link>
              <button type="submit" disabled={saving} className="admin-btn admin-btn--primary">
                {saving ? "Saving…" : "Create Resource"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
