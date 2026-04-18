"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getPage,
  updatePage,
  patchPageSeo,
  publishContent,
  scheduleContent,
  unpublishContent,
  rotatePreviewToken,
  getPageBlocks,
  replacePageBlocks,
  type PageAdminItem,
  type SeoAdminFields,
  type ContentBlockItem,
} from "@/lib/api/admin";
import {
  ErrorBanner,
  LoadingState,
  PublishBar,
  ScheduleModal,
  SeoFieldset,
  StatusBadge,
  SuccessBanner,
} from "@/components/admin/ui";
import { BlockEditor } from "@/components/admin/BlockEditor";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { LocaleLinker } from "@/components/admin/LocaleLinker";
import { useAdminAuth } from "@/components/admin/AdminShell";

export default function EditPagePage() {
  const { id } = useParams<{ id: string }>();
  const { role } = useAdminAuth();
  const isAdmin = role === "ADMIN";

  const [item, setItem] = useState<PageAdminItem | null>(null);
  const [form, setForm] = useState({
    slug: "",
    locale: "tr",
    pageType: "GENERIC",
    title: "",
    summary: "",
    heroImageKey: "",
    contentGroupId: "",
  });
  const [seo, setSeo] = useState<SeoAdminFields>({ noIndex: false });
  const [blocks, setBlocks] = useState<ContentBlockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingBlocks, setSavingBlocks] = useState(false);
  const [pubBusy, setPubBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [previewToken, setPreviewToken] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getPage(id), getPageBlocks(id)])
      .then(([p, b]) => {
        setItem(p);
        setForm({
          slug: p.slug,
          locale: p.locale,
          pageType: p.pageType ?? "GENERIC",
          title: p.title ?? "",
          summary: p.summary ?? "",
          heroImageKey: p.heroImageKey ?? "",
          contentGroupId: p.contentGroupId ?? "",
        });
        setSeo(p.seo ?? { noIndex: false });
        setBlocks(b);
        if (p.previewToken) setPreviewToken(String(p.previewToken));
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load page."))
      .finally(() => setLoading(false));
  }, [id]);

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const updated = await updatePage(id, {
        ...form,
        contentGroupId: form.contentGroupId || undefined,
        seo,
      });
      await patchPageSeo(id, seo);
      setItem(updated);
      setSuccess("Page saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveBlocks() {
    setSavingBlocks(true);
    setError("");
    setSuccess("");
    try {
      const saved = await replacePageBlocks(id, blocks);
      setBlocks(saved);
      setSuccess("Content blocks saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save blocks.");
    } finally {
      setSavingBlocks(false);
    }
  }

  async function doPublish() {
    setPubBusy(true); setError("");
    try {
      const res = await publishContent(form.slug, form.locale);
      setItem((p) => p ? { ...p, status: res.status as PageAdminItem["status"], publishedAt: res.publishedAt } : p);
      setSuccess("Published.");
    } catch (e) { setError(e instanceof Error ? e.message : "Publish failed."); }
    finally { setPubBusy(false); }
  }

  async function doUnpublish() {
    setPubBusy(true); setError("");
    try {
      const res = await unpublishContent(form.slug, form.locale);
      setItem((p) => p ? { ...p, status: res.status as PageAdminItem["status"] } : p);
      setSuccess("Unpublished.");
    } catch (e) { setError(e instanceof Error ? e.message : "Unpublish failed."); }
    finally { setPubBusy(false); }
  }

  async function doSchedule(dt: string) {
    setShowSchedule(false); setPubBusy(true); setError("");
    try {
      const res = await scheduleContent(form.slug, form.locale, dt);
      setItem((p) => p ? { ...p, status: res.status as PageAdminItem["status"], scheduledAt: res.scheduledAt } : p);
      setSuccess(`Scheduled for ${new Date(dt).toLocaleString()}.`);
    } catch (e) { setError(e instanceof Error ? e.message : "Schedule failed."); }
    finally { setPubBusy(false); }
  }

  async function doRotatePreviewToken() {
    setPubBusy(true); setError("");
    try {
      const res = await rotatePreviewToken(id);
      setPreviewToken(res.token);
      setSuccess("Preview link generated.");
    } catch (e) { setError(e instanceof Error ? e.message : "Preview token rotation failed."); }
    finally { setPubBusy(false); }
  }

  const previewUrl = previewToken ? `/preview?token=${previewToken}` : undefined;

  if (loading) return <LoadingState />;

  return (
    <>
      {showSchedule && (
        <ScheduleModal onConfirm={doSchedule} onCancel={() => setShowSchedule(false)} />
      )}
      <Link href="/admin/pages" className="admin-back-link">← Pages</Link>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">{form.title || "Edit Page"}</h1>
          <p className="admin-page-subtitle">{form.locale.toUpperCase()} · {form.slug}</p>
        </div>
        {item && <StatusBadge status={item.status} />}
      </div>

      {item && (
        <PublishBar
          status={item.status}
          previewToken={previewToken}
          previewUrl={previewUrl}
          onPublish={doPublish}
          onUnpublish={doUnpublish}
          onSchedule={() => setShowSchedule(true)}
          onRotatePreviewToken={doRotatePreviewToken}
          busy={pubBusy}
        />
      )}

      {/* ── Page metadata form ── */}
      <div className="admin-card" style={{ marginBottom: 20 }}>
        <div className="admin-card-header">
          <p className="admin-card-title">Page details</p>
        </div>
        <div className="admin-card-body">
          <form onSubmit={handleSave} className="admin-form">
            {error && <ErrorBanner message={error} />}
            {success && <SuccessBanner message={success} />}

            <div className="admin-form-row admin-form-row--3">
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
              <div className="admin-field">
                <label className="admin-label">Page type</label>
                <select className="admin-select" value={form.pageType} onChange={(e) => set("pageType", e.target.value)}>
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
              <input type="text" className="admin-input" value={form.title}
                onChange={(e) => set("title", e.target.value)} required />
            </div>

            <div className="admin-field">
              <label className="admin-label">Summary</label>
              <textarea className="admin-textarea" rows={3} value={form.summary}
                onChange={(e) => set("summary", e.target.value)} />
            </div>

            <MediaPicker
              label="Hero image key"
              value={form.heroImageKey}
              onChange={(v) => set("heroImageKey", v)}
              placeholder="media/hero.jpg"
            />

            <LocaleLinker
              currentLocale={form.locale}
              contentGroupId={form.contentGroupId}
              onChange={(v) => set("contentGroupId", v)}
            />

            <SeoFieldset seo={seo} onChange={setSeo} />

            {item && (
              <div className="admin-detail-grid" style={{ marginTop: 4, paddingTop: 12, borderTop: "1px solid var(--a-border)" }}>
                <span className="admin-detail-label">Created</span>
                <span className="admin-detail-value">{new Date(item.createdAt).toLocaleString()}</span>
                <span className="admin-detail-label">Updated</span>
                <span className="admin-detail-value">{new Date(item.updatedAt).toLocaleString()}</span>
                {item.publishedAt && (<>
                  <span className="admin-detail-label">Published</span>
                  <span className="admin-detail-value">{new Date(item.publishedAt).toLocaleString()}</span>
                </>)}
                {isAdmin && (<>
                  <span className="admin-detail-label">ID</span>
                  <span className="admin-detail-value" style={{ fontFamily: "monospace", fontSize: 12 }}>{id}</span>
                </>)}
              </div>
            )}

            <div className="admin-form-footer">
              <Link href="/admin/pages" className="admin-btn admin-btn--secondary">Cancel</Link>
              <button type="submit" disabled={saving} className="admin-btn admin-btn--primary">
                {saving ? "Saving…" : "Save Page"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Block editor ── */}
      <div className="admin-card">
        <div className="admin-card-header">
          <p className="admin-card-title">Content blocks</p>
          <p style={{ fontSize: 12, color: "var(--a-text-muted)", margin: 0 }}>
            Blocks are rendered in order on the public page. Save blocks separately from page details.
          </p>
        </div>
        <div className="admin-card-body">
          {error && !saving && <ErrorBanner message={error} />}
          <BlockEditor blocks={blocks} onChange={setBlocks} />
          <div className="admin-form-footer" style={{ marginTop: 16 }}>
            <button
              type="button"
              disabled={savingBlocks}
              className="admin-btn admin-btn--primary"
              onClick={handleSaveBlocks}
            >
              {savingBlocks ? "Saving blocks…" : "Save Blocks"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
