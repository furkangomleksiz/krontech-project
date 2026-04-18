"use client";

import type { PublishStatus } from "@/lib/api/admin";

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_DOT: Record<string, string> = {
  DRAFT: "●",
  SCHEDULED: "◷",
  PUBLISHED: "●",
};

export function StatusBadge({ status }: { status: string }) {
  const cls = `admin-badge admin-badge--${status.toLowerCase()}`;
  return (
    <span className={cls}>
      <span>{STATUS_DOT[status] ?? "●"}</span>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const cls = `admin-badge admin-badge--${role.toLowerCase()}`;
  return <span className={cls}>{role}</span>;
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`admin-badge ${active ? "admin-badge--active" : "admin-badge--inactive"}`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon = "📭",
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="admin-empty">
      <div className="admin-empty-icon">{icon}</div>
      <p className="admin-empty-title">{title}</p>
      {description && <p className="admin-empty-desc">{description}</p>}
      {action}
    </div>
  );
}

// ── Loading ───────────────────────────────────────────────────────────────────

export function LoadingRows({ cols = 4 }: { cols?: number }) {
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <tr key={i}>
          {[...Array(cols)].map((__, j) => (
            <td key={j}>
              <div
                style={{
                  height: 14,
                  background: "#f3f4f6",
                  borderRadius: 4,
                  width: j === 0 ? "70%" : "50%",
                  animation: "admin-spin 1.5s ease infinite",
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function LoadingState({ message = "Loading…" }: { message?: string }) {
  return (
    <div className="admin-loading">
      <span className="admin-spinner" />
      <span>{message}</span>
    </div>
  );
}

// ── Error banner ──────────────────────────────────────────────────────────────

export function ErrorBanner({ message }: { message: string }) {
  return <div className="admin-error-banner">{message}</div>;
}

export function SuccessBanner({ message }: { message: string }) {
  return <div className="admin-success-banner">{message}</div>;
}

// ── Pagination ────────────────────────────────────────────────────────────────

interface PaginationProps {
  page: number; // 0-based
  totalPages: number;
  totalElements: number;
  size: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  page,
  totalPages,
  totalElements,
  size,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;
  const from = page * size + 1;
  const to = Math.min((page + 1) * size, totalElements);

  return (
    <div className="admin-pagination">
      <span>
        {from}–{to} of {totalElements}
      </span>
      <div className="admin-pagination-controls">
        <button
          className="admin-btn admin-btn--secondary admin-btn--sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
        >
          ← Prev
        </button>
        <span style={{ fontSize: 13, color: "var(--a-text-muted)" }}>
          {page + 1} / {totalPages}
        </span>
        <button
          className="admin-btn admin-btn--secondary admin-btn--sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

// ── Publish actions bar ───────────────────────────────────────────────────────

interface PublishBarProps {
  /** Current publish status of the content item. */
  status: PublishStatus;
  /** Preview token UUID; shown as a "Get Preview Link" button when present. */
  previewToken?: string | null;
  /** Full URL to open when editor clicks "Open Preview". Constructed by the parent. */
  previewUrl?: string;
  onPublish: () => void;
  onUnpublish: () => void;
  onSchedule: () => void;
  /** Called to rotate the preview token for this item. Optional — not all types support it. */
  onRotatePreviewToken?: () => void;
  busy?: boolean;
}

export function PublishBar({
  status,
  previewToken,
  previewUrl,
  onPublish,
  onUnpublish,
  onSchedule,
  onRotatePreviewToken,
  busy,
}: PublishBarProps) {
  return (
    <div className="admin-publish-bar">
      <span className="admin-publish-bar-label">Status:</span>
      <StatusBadge status={status} />
      <div className="admin-publish-bar-gap" />

      {/* Preview token controls */}
      {previewToken && previewUrl ? (
        <a
          href={previewUrl}
          target="_blank"
          rel="noreferrer"
          className="admin-btn admin-btn--secondary admin-btn--sm"
        >
          Open Preview ↗
        </a>
      ) : onRotatePreviewToken ? (
        <button
          className="admin-btn admin-btn--ghost admin-btn--sm"
          onClick={onRotatePreviewToken}
          disabled={busy}
          title="Generate a preview link you can share with reviewers"
        >
          Get Preview Link
        </button>
      ) : null}

      {/* Publishing transitions */}
      {status !== "PUBLISHED" && (
        <button
          className="admin-btn admin-btn--success admin-btn--sm"
          onClick={onPublish}
          disabled={busy}
        >
          Publish Now
        </button>
      )}
      {status === "DRAFT" && (
        <button
          className="admin-btn admin-btn--warning admin-btn--sm"
          onClick={onSchedule}
          disabled={busy}
        >
          Schedule…
        </button>
      )}
      {(status === "PUBLISHED" || status === "SCHEDULED") && (
        <button
          className="admin-btn admin-btn--danger admin-btn--sm"
          onClick={onUnpublish}
          disabled={busy}
        >
          Unpublish
        </button>
      )}
    </div>
  );
}

// ── Schedule modal (inline) ───────────────────────────────────────────────────

interface ScheduleModalProps {
  onConfirm: (dt: string) => void;
  onCancel: () => void;
}

export function ScheduleModal({ onConfirm, onCancel }: ScheduleModalProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.4)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        className="admin-card"
        style={{ width: 360, padding: 24 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: "0 0 16px", fontSize: 16 }}>Schedule publish</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            // Backend expects a future ISO-8601 Instant string.
            onConfirm(new Date(fd.get("dt") as string).toISOString());
          }}
        >
          <div className="admin-field">
            <label className="admin-label">Publish date & time</label>
            <input
              type="datetime-local"
              name="dt"
              className="admin-input"
              required
            />
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "flex-end",
              marginTop: 16,
            }}
          >
            <button
              type="button"
              className="admin-btn admin-btn--secondary"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button type="submit" className="admin-btn admin-btn--primary">
              Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── SEO Fieldset ──────────────────────────────────────────────────────────────

import type { SeoAdminFields } from "@/lib/api/admin";

interface SeoFieldsetProps {
  seo: SeoAdminFields;
  onChange: (seo: SeoAdminFields) => void;
}

export function SeoFieldset({ seo, onChange }: SeoFieldsetProps) {
  const [open, setOpen] = useState(false);
  function set<K extends keyof SeoAdminFields>(key: K, value: SeoAdminFields[K]) {
    onChange({ ...seo, [key]: value });
  }

  return (
    <div className="admin-fieldset">
      <button
        type="button"
        className="admin-fieldset-legend"
        onClick={() => setOpen((o) => !o)}
      >
        <span>SEO / Open Graph</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="admin-fieldset-body">
          <div className="admin-form-row admin-form-row--2">
            <div className="admin-field">
              <label className="admin-label">
                Meta title <span className="admin-label-hint">(max 180)</span>
              </label>
              <input
                type="text"
                className="admin-input"
                maxLength={180}
                value={seo.metaTitle ?? ""}
                onChange={(e) => set("metaTitle", e.target.value)}
              />
            </div>
            <div className="admin-field">
              <label className="admin-label">Canonical path</label>
              <input
                type="text"
                className="admin-input"
                value={seo.canonicalPath ?? ""}
                onChange={(e) => set("canonicalPath", e.target.value)}
              />
            </div>
          </div>
          <div className="admin-field">
            <label className="admin-label">
              Meta description{" "}
              <span className="admin-label-hint">(max 300)</span>
            </label>
            <textarea
              className="admin-textarea"
              rows={2}
              maxLength={300}
              value={seo.metaDescription ?? ""}
              onChange={(e) => set("metaDescription", e.target.value)}
            />
          </div>
          <div className="admin-form-row admin-form-row--2">
            <div className="admin-field">
              <label className="admin-label">OG title</label>
              <input
                type="text"
                className="admin-input"
                value={seo.ogTitle ?? ""}
                onChange={(e) => set("ogTitle", e.target.value)}
              />
            </div>
            <div className="admin-field">
              <label className="admin-label">OG image key</label>
              <input
                type="text"
                className="admin-input"
                value={seo.ogImageKey ?? ""}
                onChange={(e) => set("ogImageKey", e.target.value)}
              />
            </div>
          </div>
          <div className="admin-field">
            <label className="admin-label">OG description</label>
            <textarea
              className="admin-textarea"
              rows={2}
              value={seo.ogDescription ?? ""}
              onChange={(e) => set("ogDescription", e.target.value)}
            />
          </div>
          <div className="admin-checkbox-field">
            <input
              type="checkbox"
              id="noIndex"
              className="admin-checkbox"
              checked={seo.noIndex}
              onChange={(e) => set("noIndex", e.target.checked)}
            />
            <label htmlFor="noIndex" className="admin-label">
              noindex (hide from search engines)
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

// useState import needed for SeoFieldset
import { useState } from "react";
