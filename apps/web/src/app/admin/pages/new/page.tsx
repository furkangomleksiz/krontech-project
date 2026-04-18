"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createPage, type SeoAdminFields } from "@/lib/api/admin";
import { ErrorBanner, SeoFieldset, SuccessBanner } from "@/components/admin/ui";

const BLANK_SEO: SeoAdminFields = { noIndex: false };

export default function NewPagePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    slug: "",
    locale: "tr",
    pageType: "GENERIC",
    title: "",
    summary: "",
    heroImageKey: "",
  });
  const [seo, setSeo] = useState<SeoAdminFields>(BLANK_SEO);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const item = await createPage({
        ...form,
        status: "DRAFT",
        seo,
      } as Parameters<typeof createPage>[0]);
      setSuccess("Page created.");
      router.push(`/admin/pages/${item.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Link href="/admin/pages" className="admin-back-link">
        ← Pages
      </Link>
      <div className="admin-page-header">
        <h1 className="admin-page-title">New Page</h1>
      </div>

      <div className="admin-card">
        <div className="admin-card-body">
          <form onSubmit={handleSubmit} className="admin-form">
            {error && <ErrorBanner message={error} />}
            {success && <SuccessBanner message={success} />}

            <div className="admin-form-row admin-form-row--3">
              <div className="admin-field">
                <label className="admin-label">Slug *</label>
                <input
                  type="text"
                  className="admin-input"
                  value={form.slug}
                  onChange={(e) => set("slug", e.target.value)}
                  placeholder="about-us"
                  required
                />
              </div>
              <div className="admin-field">
                <label className="admin-label">Locale *</label>
                <select
                  className="admin-select"
                  value={form.locale}
                  onChange={(e) => set("locale", e.target.value)}
                  required
                >
                  <option value="tr">Turkish (tr)</option>
                  <option value="en">English (en)</option>
                </select>
              </div>
              <div className="admin-field">
                <label className="admin-label">Page type</label>
                <select
                  className="admin-select"
                  value={form.pageType}
                  onChange={(e) => set("pageType", e.target.value)}
                >
                  <option value="GENERIC">Generic</option>
                  <option value="HOME">Home</option>
                  <option value="CONTACT">Contact</option>
                  <option value="ABOUT">About</option>
                  <option value="LANDING">Landing</option>
                </select>
              </div>
            </div>

            <div className="admin-field">
              <label className="admin-label">Title *</label>
              <input
                type="text"
                className="admin-input"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                required
              />
            </div>

            <div className="admin-field">
              <label className="admin-label">Summary</label>
              <textarea
                className="admin-textarea"
                rows={3}
                value={form.summary}
                onChange={(e) => set("summary", e.target.value)}
              />
            </div>

            <div className="admin-field">
              <label className="admin-label">Hero image key</label>
              <input
                type="text"
                className="admin-input"
                value={form.heroImageKey}
                onChange={(e) => set("heroImageKey", e.target.value)}
                placeholder="media/hero-image.jpg"
              />
            </div>

            <SeoFieldset seo={seo} onChange={setSeo} />

            <div className="admin-form-footer">
              <Link
                href="/admin/pages"
                className="admin-btn admin-btn--secondary"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="admin-btn admin-btn--primary"
              >
                {saving ? "Saving…" : "Create Page"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
