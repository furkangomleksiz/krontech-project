"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBlogPost, type SeoAdminFields } from "@/lib/api/admin";
import { ErrorBanner, SeoFieldset, SuccessBanner } from "@/components/admin/ui";
import { MediaPicker } from "@/components/admin/MediaPicker";

const BLANK_SEO: SeoAdminFields = { noIndex: false };

export default function NewBlogPostPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    slug: "",
    locale: "tr",
    title: "",
    summary: "",
    heroImageKey: "",
    body: "",
    tags: "",
    readTimeMinutes: 5,
    category: "",
  });
  const [seo, setSeo] = useState<SeoAdminFields>(BLANK_SEO);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function set(key: string, value: string | number) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const item = await createBlogPost({ ...form, status: "DRAFT", seo });
      setSuccess("Post created.");
      router.push(`/admin/blog/${item.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Link href="/admin/blog" className="admin-back-link">
        ← Blog Posts
      </Link>
      <div className="admin-page-header">
        <h1 className="admin-page-title">New Blog Post</h1>
      </div>

      <div className="admin-card">
        <div className="admin-card-body">
          <form onSubmit={handleSubmit} className="admin-form">
            {error && <ErrorBanner message={error} />}
            {success && <SuccessBanner message={success} />}

            <div className="admin-form-row admin-form-row--2">
              <div className="admin-field">
                <label className="admin-label">Slug *</label>
                <input
                  type="text"
                  className="admin-input"
                  value={form.slug}
                  onChange={(e) => set("slug", e.target.value)}
                  placeholder="my-first-post"
                  required
                />
              </div>
              <div className="admin-field">
                <label className="admin-label">Locale *</label>
                <select
                  className="admin-select"
                  value={form.locale}
                  onChange={(e) => set("locale", e.target.value)}
                >
                  <option value="tr">Turkish (tr)</option>
                  <option value="en">English (en)</option>
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
              <label className="admin-label">Summary / excerpt</label>
              <textarea
                className="admin-textarea"
                rows={2}
                value={form.summary}
                onChange={(e) => set("summary", e.target.value)}
              />
            </div>

            <div className="admin-form-row admin-form-row--3">
              <div className="admin-field">
                <label className="admin-label">Category</label>
                <input
                  type="text"
                  className="admin-input"
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                  placeholder="Cybersecurity"
                />
              </div>
              <div className="admin-field">
                <label className="admin-label">
                  Tags{" "}
                  <span className="admin-label-hint">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  className="admin-input"
                  value={form.tags}
                  onChange={(e) => set("tags", e.target.value)}
                  placeholder="pam, security, iam"
                />
              </div>
              <div className="admin-field">
                <label className="admin-label">Read time (min)</label>
                <input
                  type="number"
                  className="admin-input"
                  value={form.readTimeMinutes}
                  onChange={(e) =>
                    set("readTimeMinutes", parseInt(e.target.value) || 5)
                  }
                  min={1}
                />
              </div>
            </div>

            <MediaPicker
              label="Hero image key"
              value={form.heroImageKey}
              onChange={(v) => set("heroImageKey", v)}
              placeholder="media/blog/cover.jpg"
            />

            <div className="admin-field">
              <label className="admin-label">
                Body{" "}
                <span className="admin-label-hint">
                  (plain text or markdown)
                </span>
              </label>
              <textarea
                className="admin-textarea"
                rows={12}
                value={form.body}
                onChange={(e) => set("body", e.target.value)}
              />
            </div>

            <SeoFieldset seo={seo} onChange={setSeo} />

            <div className="admin-form-footer">
              <Link href="/admin/blog" className="admin-btn admin-btn--secondary">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="admin-btn admin-btn--primary"
              >
                {saving ? "Saving…" : "Create Post"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
