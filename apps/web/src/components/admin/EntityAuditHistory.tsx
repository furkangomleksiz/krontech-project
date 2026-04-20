"use client";

import { useEffect, useState } from "react";
import { listAuditLog, type AuditLogItem } from "@/lib/api/admin";

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Created",
  UPDATE: "Updated",
  DELETE: "Deleted",
  PUBLISH: "Published",
  SCHEDULE: "Scheduled",
  UNPUBLISH: "Unpublished",
  SCHEDULED_PUBLISH: "Published (scheduled)",
  ROTATE_PREVIEW_TOKEN: "Preview link rotated",
};

function formatAction(action: string): string {
  if (ACTION_LABELS[action]) return ACTION_LABELS[action];
  return action
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

interface EntityAuditHistoryProps {
  targetId: string;
  /** Increment to refetch after mutations (e.g. save). */
  refreshKey?: number;
  title?: string;
}

export function EntityAuditHistory({
  targetId,
  refreshKey = 0,
  title = "Activity history",
}: EntityAuditHistoryProps) {
  const [rows, setRows] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    listAuditLog({ targetId, size: 50, page: 0 })
      .then((page) => {
        if (!cancelled) setRows(page.content ?? []);
      })
      .catch((e) => {
        if (!cancelled) {
          setRows([]);
          setError(e instanceof Error ? e.message : "Failed to load history.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [targetId, refreshKey]);

  return (
    <div className="admin-card" style={{ marginTop: 24 }}>
      <div className="admin-card-header">
        <p className="admin-card-title">{title}</p>
        <p
          className="admin-page-subtitle"
          style={{ margin: "6px 0 0", fontSize: 13, maxWidth: 560 }}
        >
          Who did what and when — not field-by-field diffs. Saving the form (summary, title, body, SEO,
          etc.) records an Updated row; publish and unpublish alone do not add that row.
        </p>
      </div>
      <div className="admin-card-body">
        {loading && <p className="admin-table-muted">Loading…</p>}
        {error && (
          <p style={{ color: "#b91c1c", fontSize: 14, margin: 0 }} role="alert">
            {error}
          </p>
        )}
        {!loading && !error && rows.length === 0 && (
          <p className="admin-table-muted">No recorded events yet.</p>
        )}
        {!loading && !error && rows.length > 0 && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{new Date(row.createdAt).toLocaleString()}</td>
                    <td>{formatAction(row.action)}</td>
                    <td>{row.actor}</td>
                    <td className="admin-table-muted">{row.details?.trim() ? row.details : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
