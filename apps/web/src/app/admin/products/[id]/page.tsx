"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getProduct, updateProduct, patchProductSeo,
  publishContent, scheduleContent, unpublishContent, rotatePreviewToken,
  type ProductAdminItem, type SeoAdminFields,
} from "@/lib/api/admin";
import {
  ErrorBanner, LoadingState, PublishBar, ScheduleModal, SeoFieldset, StatusBadge, SuccessBanner,
} from "@/components/admin/ui";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { LocaleLinker } from "@/components/admin/LocaleLinker";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<ProductAdminItem | null>(null);
  const [form, setForm] = useState({
    slug: "", locale: "tr", title: "", summary: "", heroImageKey: "", highlights: "", contentGroupId: "",
  });
  const [seo, setSeo] = useState<SeoAdminFields>({ noIndex: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pubBusy, setPubBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [previewToken, setPreviewToken] = useState<string | null>(null);

  useEffect(() => {
    getProduct(id)
      .then((p) => {
        setItem(p);
        setForm({
          slug: p.slug, locale: p.locale, title: p.title ?? "", summary: p.summary ?? "",
          heroImageKey: p.heroImageKey ?? "", highlights: p.highlights ?? "",
          contentGroupId: p.contentGroupId ?? "",
        });
        setSeo(p.seo ?? { noIndex: false });
        if (p.previewToken) setPreviewToken(String(p.previewToken));
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load."))
      .finally(() => setLoading(false));
  }, [id]);

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError(""); setSuccess("");
    try {
      const updated = await updateProduct(id, { ...form, contentGroupId: form.contentGroupId || undefined, seo });
      await patchProductSeo(id, seo);
      setItem(updated); setSuccess("Changes saved.");
    } catch (err) { setError(err instanceof Error ? err.message : "Save failed."); }
    finally { setSaving(false); }
  }

  async function doPublish() {
    setPubBusy(true); setError("");
    try {
      const res = await publishContent(form.slug, form.locale);
      setItem((p) => p ? { ...p, status: res.status as ProductAdminItem["status"] } : p);
      setSuccess("Published.");
    } catch (e) { setError(e instanceof Error ? e.message : "Publish failed."); } finally { setPubBusy(false); }
  }
  async function doUnpublish() {
    setPubBusy(true); setError("");
    try {
      const res = await unpublishContent(form.slug, form.locale);
      setItem((p) => p ? { ...p, status: res.status as ProductAdminItem["status"] } : p);
      setSuccess("Unpublished.");
    } catch (e) { setError(e instanceof Error ? e.message : "Unpublish failed."); } finally { setPubBusy(false); }
  }
  async function doSchedule(dt: string) {
    setShowSchedule(false); setPubBusy(true); setError("");
    try {
      const res = await scheduleContent(form.slug, form.locale, dt);
      setItem((p) => p ? { ...p, status: res.status as ProductAdminItem["status"], scheduledAt: res.scheduledAt } : p);
      setSuccess(`Scheduled for ${new Date(dt).toLocaleString()}.`);
    } catch (e) { setError(e instanceof Error ? e.message : "Schedule failed."); } finally { setPubBusy(false); }
  }
  async function doRotatePreviewToken() {
    setPubBusy(true); setError("");
    try {
      const res = await rotatePreviewToken(id);
      setPreviewToken(res.token); setSuccess("Preview link generated.");
    } catch (e) { setError(e instanceof Error ? e.message : "Preview rotation failed."); } finally { setPubBusy(false); }
  }

  const previewUrl = previewToken ? `/preview?token=${previewToken}` : undefined;

  if (loading) return <LoadingState />;

  return (
    <>
      {showSchedule && <ScheduleModal onConfirm={doSchedule} onCancel={() => setShowSchedule(false)} />}
      <Link href="/admin/products" className="admin-back-link">← Products</Link>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">{form.title || "Edit Product"}</h1>
          <p className="admin-page-subtitle">{form.locale.toUpperCase()} · {form.slug}</p>
        </div>
        {item && <StatusBadge status={item.status} />}
      </div>

      {item && (
        <PublishBar status={item.status} previewToken={previewToken} previewUrl={previewUrl}
          onPublish={doPublish} onUnpublish={doUnpublish} onSchedule={() => setShowSchedule(true)}
          onRotatePreviewToken={doRotatePreviewToken} busy={pubBusy} />
      )}

      <div className="admin-card">
        <div className="admin-card-body">
          <form onSubmit={handleSave} className="admin-form">
            {error && <ErrorBanner message={error} />}
            {success && <SuccessBanner message={success} />}

            <div className="admin-form-row admin-form-row--2">
              <div className="admin-field">
                <label className="admin-label">Slug *</label>
                <input type="text" className="admin-input" value={form.slug}
                  onChange={(e) => set("slug", e.target.value)} required />
              </div>
              <div className="admin-field">
                <label className="admin-label">Locale</label>
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

            <MediaPicker label="Hero image key" value={form.heroImageKey}
              onChange={(v) => set("heroImageKey", v)} placeholder="media/products/hero.jpg" />

            <div className="admin-field">
              <label className="admin-label">
                Highlights <span className="admin-label-hint">(feature bullet points, one per line or JSON)</span>
              </label>
              <textarea className="admin-textarea" rows={8} value={form.highlights}
                onChange={(e) => set("highlights", e.target.value)} />
            </div>

            <LocaleLinker currentLocale={form.locale} contentGroupId={form.contentGroupId}
              onChange={(v) => set("contentGroupId", v)} />

            <SeoFieldset seo={seo} onChange={setSeo} />

            {item && (
              <div className="admin-detail-grid" style={{ paddingTop: 12, borderTop: "1px solid var(--a-border)" }}>
                <span className="admin-detail-label">Created</span>
                <span className="admin-detail-value">{new Date(item.createdAt).toLocaleString()}</span>
                <span className="admin-detail-label">Updated</span>
                <span className="admin-detail-value">{new Date(item.updatedAt).toLocaleString()}</span>
              </div>
            )}

            <div className="admin-form-footer">
              <Link href="/admin/products" className="admin-btn admin-btn--secondary">Cancel</Link>
              <button type="submit" disabled={saving} className="admin-btn admin-btn--primary">
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
