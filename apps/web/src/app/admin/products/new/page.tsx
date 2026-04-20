"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createProduct, type SeoAdminFields } from "@/lib/api/admin";
import {
  ProductTabCardsEditor,
  flattenTabCardsForApi,
  tabCardsFromApi,
  type ProductTabKey,
  type TabCardDraft,
} from "@/components/admin/ProductTabCardsEditor";
import { ErrorBanner, SeoFieldset, SuccessBanner } from "@/components/admin/ui";
import { MediaPicker } from "@/components/admin/MediaPicker";
import {
  emptyResourcesTabForm,
  ProductResourcesTabEditor,
  toResourcesTabPayload,
  type ProductResourcesTabFormState,
} from "@/components/admin/ProductResourcesTabEditor";

export default function NewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    slug: "",
    locale: "tr",
    title: "",
    summary: "",
    heroImageKey: "",
    highlights: "",
  });
  const [seo, setSeo] = useState<SeoAdminFields>({ noIndex: false });
  const [tabCardsByTab, setTabCardsByTab] = useState<Record<ProductTabKey, TabCardDraft[]>>(() =>
    tabCardsFromApi(undefined),
  );
  const [resourcesTab, setResourcesTab] = useState<ProductResourcesTabFormState>(() => emptyResourcesTabForm());
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
      const item = await createProduct({
        ...form,
        status: "DRAFT",
        seo,
        tabCards: flattenTabCardsForApi(tabCardsByTab),
        resourcesTab: toResourcesTabPayload(resourcesTab),
      });
      setSuccess("Product created.");
      router.push(`/admin/products/${item.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Link href="/admin/products" className="admin-back-link">
        ← Products
      </Link>
      <div className="admin-page-header">
        <h1 className="admin-page-title">New Product</h1>
      </div>

      <form onSubmit={handleSubmit} className="admin-form">
        {error && <ErrorBanner message={error} />}
        {success && <SuccessBanner message={success} />}

        <div className="admin-card" style={{ marginBottom: 20 }}>
          <div className="admin-card-header">
            <p className="admin-card-title">Product details</p>
          </div>
          <div className="admin-card-body">
            <div className="admin-form-row admin-form-row--2">
              <div className="admin-field">
                <label className="admin-label">Slug *</label>
                <input
                  type="text"
                  className="admin-input"
                  value={form.slug}
                  onChange={(e) => set("slug", e.target.value)}
                  placeholder="pam-suite"
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
              <label className="admin-label">Summary</label>
              <textarea
                className="admin-textarea"
                rows={3}
                value={form.summary}
                onChange={(e) => set("summary", e.target.value)}
              />
            </div>
            <MediaPicker
              label="Hero image key"
              value={form.heroImageKey}
              onChange={(v) => set("heroImageKey", v)}
              placeholder="media/products/hero.jpg"
            />
            <div className="admin-field">
              <label className="admin-label">
                Highlights{" "}
                <span className="admin-label-hint">(one per line or structured text)</span>
              </label>
              <textarea
                className="admin-textarea"
                rows={6}
                value={form.highlights}
                onChange={(e) => set("highlights", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="admin-card" style={{ marginBottom: 20 }}>
          <div className="admin-card-header">
            <p className="admin-card-title">Detail page tabs &amp; cards</p>
            <p style={{ fontSize: 12, color: "var(--a-text-muted)", margin: "8px 0 0", lineHeight: 1.5 }}>
              <strong>Solution</strong>, <strong>How it works</strong>, and <strong>Key benefits</strong> use repeating
              text + image cards. The <strong>Resources</strong> tab is configured separately (below).
            </p>
          </div>
          <div className="admin-card-body">
            <ProductTabCardsEditor value={tabCardsByTab} onChange={setTabCardsByTab} />
          </div>
        </div>

        <div className="admin-card" style={{ marginBottom: 20 }}>
          <div className="admin-card-header">
            <p className="admin-card-title">Resources tab</p>
          </div>
          <div className="admin-card-body">
            <ProductResourcesTabEditor locale={form.locale} value={resourcesTab} onChange={setResourcesTab} />
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <p className="admin-card-title">SEO</p>
          </div>
          <div className="admin-card-body">
            <SeoFieldset seo={seo} onChange={setSeo} />
            <div className="admin-form-footer">
              <Link href="/admin/products" className="admin-btn admin-btn--secondary">
                Cancel
              </Link>
              <button type="submit" disabled={saving} className="admin-btn admin-btn--primary">
                {saving ? "Saving…" : "Create Product"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
