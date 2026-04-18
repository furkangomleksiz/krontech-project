"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createRedirect, AdminApiError } from "@/lib/api/admin";
import { ErrorBanner } from "@/components/admin/ui";

export default function NewRedirectPage() {
  return <RedirectForm />;
}

function RedirectForm() {
  const router = useRouter();
  const [sourcePath, setSourcePath] = useState("");
  const [targetPath, setTargetPath] = useState("");
  const [statusCode, setStatusCode] = useState<301 | 302>(301);
  const [active, setActive] = useState(true);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sourcePath.startsWith("/")) {
      setError("Source path must start with /");
      return;
    }
    if (sourcePath === targetPath) {
      setError("Source and target paths must not be identical.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const rule = await createRedirect({
        sourcePath,
        targetPath,
        statusCode,
        active,
        notes: notes || undefined,
      });
      router.push(`/admin/redirects/${rule.id}`);
    } catch (err) {
      if (err instanceof AdminApiError && err.status === 409) {
        setError(
          `A redirect rule for "${sourcePath}" already exists. Edit the existing rule instead.`,
        );
      } else {
        setError(err instanceof Error ? err.message : "Save failed.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Link href="/admin/redirects" className="admin-back-link">
        ← Redirects
      </Link>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">New Redirect Rule</h1>
          <p className="admin-page-subtitle">
            Evaluated by the Next.js Edge Middleware on every public request
          </p>
        </div>
      </div>

      <div className="admin-card" style={{ maxWidth: 640 }}>
        <div className="admin-card-body">
          <form onSubmit={handleSubmit} className="admin-form">
            {error && <ErrorBanner message={error} />}

            <div className="admin-field">
              <label className="admin-label">
                Source path{" "}
                <span className="admin-label-hint">
                  — the old URL path to match (must start with /)
                </span>
              </label>
              <input
                type="text"
                className="admin-input"
                value={sourcePath}
                onChange={(e) => setSourcePath(e.target.value)}
                placeholder="/urunler/kron-pam"
                required
              />
            </div>

            <div className="admin-field">
              <label className="admin-label">
                Target path{" "}
                <span className="admin-label-hint">
                  — the destination (absolute path or full URL for off-site)
                </span>
              </label>
              <input
                type="text"
                className="admin-input"
                value={targetPath}
                onChange={(e) => setTargetPath(e.target.value)}
                placeholder="/tr/products/kron-pam"
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
                  <option value={301}>301 — Permanent (SEO juice transferred)</option>
                  <option value={302}>302 — Temporary (no SEO transfer)</option>
                </select>
                <span className="admin-field-hint">
                  Use 301 for permanent URL changes during site migration.
                </span>
              </div>

              <div className="admin-field">
                <label className="admin-label">Active</label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                  />
                  Enable this rule immediately
                </label>
                <span className="admin-field-hint">
                  Inactive rules are kept but not evaluated.
                </span>
              </div>
            </div>

            <div className="admin-field">
              <label className="admin-label">
                Notes{" "}
                <span className="admin-label-hint">(optional — migration context, ticket reference, etc.)</span>
              </label>
              <textarea
                className="admin-input"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Legacy Turkish product URL from old CMS — redirected during April 2026 migration."
                maxLength={1000}
              />
            </div>

            <div className="admin-form-footer">
              <Link href="/admin/redirects" className="admin-btn admin-btn--secondary">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="admin-btn admin-btn--primary"
              >
                {saving ? "Saving…" : "Create Redirect"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
