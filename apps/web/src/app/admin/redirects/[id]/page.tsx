"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getRedirect,
  updateRedirect,
  toggleRedirect,
  deleteRedirect,
  AdminApiError,
  type RedirectRuleItem,
} from "@/lib/api/admin";
import {
  ErrorBanner,
  LoadingState,
  SuccessBanner,
} from "@/components/admin/ui";

export default function EditRedirectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [rule, setRule] = useState<RedirectRuleItem | null>(null);
  const [sourcePath, setSourcePath] = useState("");
  const [targetPath, setTargetPath] = useState("");
  const [statusCode, setStatusCode] = useState<301 | 302>(301);
  const [active, setActive] = useState(true);
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const r = await getRedirect(id);
      setRule(r);
      setSourcePath(r.sourcePath);
      setTargetPath(r.targetPath);
      setStatusCode(r.statusCode);
      setActive(r.active);
      setNotes(r.notes ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load rule.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sourcePath.startsWith("/")) { setError("Source path must start with /"); return; }
    if (sourcePath === targetPath) { setError("Source and target paths must not be identical."); return; }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await updateRedirect(id, { sourcePath, targetPath, statusCode, active, notes: notes || undefined });
      setSuccess("Redirect rule saved.");
      load();
    } catch (err) {
      if (err instanceof AdminApiError && err.status === 409) {
        setError(`Source path "${sourcePath}" is already used by another rule.`);
      } else {
        setError(err instanceof Error ? err.message : "Save failed.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle() {
    setError(""); setSuccess("");
    try {
      await toggleRedirect(id);
      setSuccess("Status toggled.");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Toggle failed.");
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete redirect "${sourcePath}"?\n\nConsider deactivating instead to preserve history.`)) return;
    setError("");
    try {
      await deleteRedirect(id);
      router.push("/admin/redirects");
    } catch (err) {
      if (err instanceof AdminApiError && err.status === 403) {
        setError("Only ADMIN users can delete redirect rules.");
      } else {
        setError(err instanceof Error ? err.message : "Delete failed.");
      }
    }
  }

  if (loading) return <LoadingState />;

  return (
    <>
      <Link href="/admin/redirects" className="admin-back-link">← Redirects</Link>

      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Edit Redirect</h1>
          <p className="admin-page-subtitle" style={{ fontFamily: "monospace", fontSize: 13 }}>
            {rule?.sourcePath ?? ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleToggle}
            className={`admin-btn ${rule?.active ? "admin-btn--secondary" : "admin-btn--primary"}`}
          >
            {rule?.active ? "Deactivate" : "Activate"}
          </button>
          <button onClick={handleDelete} className="admin-btn admin-btn--danger">
            Delete
          </button>
        </div>
      </div>

      <div className="admin-card" style={{ maxWidth: 640 }}>
        <div className="admin-card-body">
          <form onSubmit={handleSubmit} className="admin-form">
            {error && <ErrorBanner message={error} />}
            {success && <SuccessBanner message={success} />}

            <div className="admin-field">
              <label className="admin-label">Source path</label>
              <input
                type="text"
                className="admin-input"
                value={sourcePath}
                onChange={(e) => setSourcePath(e.target.value)}
                required
              />
            </div>

            <div className="admin-field">
              <label className="admin-label">Target path</label>
              <input
                type="text"
                className="admin-input"
                value={targetPath}
                onChange={(e) => setTargetPath(e.target.value)}
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="admin-field">
                <label className="admin-label">Status code</label>
                <select
                  className="admin-input"
                  value={statusCode}
                  onChange={(e) => setStatusCode(Number(e.target.value) as 301 | 302)}
                >
                  <option value={301}>301 — Permanent</option>
                  <option value={302}>302 — Temporary</option>
                </select>
              </div>
              <div className="admin-field">
                <label className="admin-label">Active</label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                  />
                  Enable this rule
                </label>
              </div>
            </div>

            <div className="admin-field">
              <label className="admin-label">
                Notes <span className="admin-label-hint">(optional)</span>
              </label>
              <textarea
                className="admin-input"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={1000}
              />
            </div>

            {rule && (
              <div style={{ fontSize: 12, color: "var(--a-text-muted)" }}>
                Created {new Date(rule.createdAt).toLocaleString()} ·
                Updated {new Date(rule.updatedAt).toLocaleString()}
              </div>
            )}

            <div className="admin-form-footer">
              <Link href="/admin/redirects" className="admin-btn admin-btn--secondary">
                Cancel
              </Link>
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
