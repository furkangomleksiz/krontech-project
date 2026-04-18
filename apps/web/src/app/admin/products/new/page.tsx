"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createProduct, type SeoAdminFields } from "@/lib/api/admin";
import { ErrorBanner, SeoFieldset, SuccessBanner } from "@/components/admin/ui";

export default function NewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState({ slug: "", locale: "tr", title: "", summary: "", heroImageKey: "", highlights: "" });
  const [seo, setSeo] = useState<SeoAdminFields>({ noIndex: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function set(key: string, value: string) { setForm((f) => ({ ...f, [key]: value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError(""); setSuccess("");
    try {
      const item = await createProduct({ ...form, status: "DRAFT", seo });
      setSuccess("Product created."); router.push(`/admin/products/${item.id}`);
    } catch (err) { setError(err instanceof Error ? err.message : "Save failed."); }
    finally { setSaving(false); }
  }

  return (
    <>
      <Link href="/admin/products" className="admin-back-link">← Products</Link>
      <div className="admin-page-header"><h1 className="admin-page-title">New Product</h1></div>
      <div className="admin-card">
        <div className="admin-card-body">
          <form onSubmit={handleSubmit} className="admin-form">
            {error && <ErrorBanner message={error} />}
            {success && <SuccessBanner message={success} />}
            <div className="admin-form-row admin-form-row--2">
              <div className="admin-field">
                <label className="admin-label">Slug *</label>
                <input type="text" className="admin-input" value={form.slug}
                  onChange={(e) => set("slug", e.target.value)} placeholder="pam-suite" required />
              </div>
              <div className="admin-field">
                <label className="admin-label">Locale *</label>
                <select className="admin-select" value={form.locale} onChange={(e) => set("locale", e.target.value)}>
                  <option value="tr">Turkish (tr)</option>
                  <option value="en">English (en)</option>
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
            <div className="admin-field">
              <label className="admin-label">Hero image key</label>
              <input type="text" className="admin-input" value={form.heroImageKey}
                onChange={(e) => set("heroImageKey", e.target.value)} placeholder="media/products/hero.jpg" />
            </div>
            <div className="admin-field">
              <label className="admin-label">Highlights <span className="admin-label-hint">(one per line or structured text)</span></label>
              <textarea className="admin-textarea" rows={6} value={form.highlights}
                onChange={(e) => set("highlights", e.target.value)} />
            </div>
            <SeoFieldset seo={seo} onChange={setSeo} />
            <div className="admin-form-footer">
              <Link href="/admin/products" className="admin-btn admin-btn--secondary">Cancel</Link>
              <button type="submit" disabled={saving} className="admin-btn admin-btn--primary">
                {saving ? "Saving…" : "Create Product"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
