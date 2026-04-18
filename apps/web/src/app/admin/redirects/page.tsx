"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  listRedirects,
  toggleRedirect,
  deleteRedirect,
  AdminApiError,
  type RedirectRuleItem,
  type PagedResponse,
} from "@/lib/api/admin";
import {
  EmptyState,
  ErrorBanner,
  LoadingState,
  Pagination,
  StatusBadge,
} from "@/components/admin/ui";

const PAGE_SIZE = 50;

export default function RedirectsPage() {
  const [data, setData] = useState<PagedResponse<RedirectRuleItem> | null>(
    null,
  );
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  async function load(p: number) {
    setLoading(true);
    setError("");
    try {
      setData(await listRedirects({ page: p, size: PAGE_SIZE }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load redirects.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(page);
  }, [page]);

  async function handleToggle(id: string) {
    setActionError("");
    try {
      await toggleRedirect(id);
      load(page);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Toggle failed.");
    }
  }

  async function handleDelete(id: string, sourcePath: string) {
    if (
      !confirm(
        `Delete redirect "${sourcePath}"? This cannot be undone.\n\nConsider deactivating it instead to preserve the audit trail.`,
      )
    )
      return;
    setActionError("");
    try {
      await deleteRedirect(id);
      load(page);
    } catch (err) {
      if (err instanceof AdminApiError && err.status === 403) {
        setActionError("Only ADMIN users can delete redirect rules.");
      } else {
        setActionError(err instanceof Error ? err.message : "Delete failed.");
      }
    }
  }

  const items = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Redirects</h1>
          <p className="admin-page-subtitle">
            Manage 301/302 redirect rules. Active rules are evaluated by the
            Next.js Edge Middleware on every request.
          </p>
        </div>
        <Link href="/admin/redirects/new" className="admin-btn admin-btn--primary">
          + New Redirect
        </Link>
      </div>

      {actionError && <ErrorBanner message={actionError} />}

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorBanner message={error} />
      ) : items.length === 0 ? (
        <EmptyState
          title="No redirect rules yet"
          description="Add redirect rules to preserve SEO rankings during URL changes. Use 301 for permanent moves, 302 for temporary ones."
          action={
            <Link
              href="/admin/redirects/new"
              className="admin-btn admin-btn--primary"
            >
              Create first redirect
            </Link>
          }
        />
      ) : (
        <>
          <div className="admin-card">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Source path</th>
                  <th>Target path</th>
                  <th>Code</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th style={{ width: 140 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((rule) => (
                  <tr key={rule.id}>
                    <td>
                      <code style={{ fontSize: 12 }}>{rule.sourcePath}</code>
                    </td>
                    <td>
                      <code
                        style={{
                          fontSize: 12,
                          color: rule.targetPath.startsWith("http")
                            ? "var(--a-text-muted)"
                            : undefined,
                        }}
                      >
                        {rule.targetPath}
                      </code>
                    </td>
                    <td>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 600,
                          background:
                            rule.statusCode === 301 ? "#dbeafe" : "#fef3c7",
                          color:
                            rule.statusCode === 301 ? "#1d4ed8" : "#92400e",
                        }}
                      >
                        {rule.statusCode}
                      </span>
                    </td>
                    <td>
                      <StatusBadge
                        status={rule.active ? "PUBLISHED" : "DRAFT"}
                      />
                    </td>
                    <td
                      style={{
                        maxWidth: 200,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontSize: 12,
                        color: "var(--a-text-muted)",
                      }}
                      title={rule.notes ?? ""}
                    >
                      {rule.notes ?? "—"}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <Link
                          href={`/admin/redirects/${rule.id}`}
                          className="admin-btn admin-btn--ghost admin-btn--sm"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleToggle(rule.id)}
                          className="admin-btn admin-btn--ghost admin-btn--sm"
                          title={
                            rule.active ? "Deactivate rule" : "Activate rule"
                          }
                        >
                          {rule.active ? "Disable" : "Enable"}
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(rule.id, rule.sourcePath)
                          }
                          className="admin-btn admin-btn--danger admin-btn--sm"
                          title="Delete rule permanently"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              totalElements={data?.totalElements ?? 0}
              size={PAGE_SIZE}
              onPageChange={setPage}
            />
          )}

          <p
            style={{
              fontSize: 12,
              color: "var(--a-text-muted)",
              marginTop: 12,
            }}
          >
            Showing {items.length} of {data?.totalElements ?? 0} rules.
            Active rules are cached in the Next.js Edge Middleware for 5
            minutes.
          </p>
        </>
      )}
    </>
  );
}
