"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { deleteMedia, listMedia, type MediaAdminItem } from "@/lib/api/admin";
import { useAdminAuth } from "@/components/admin/AdminShell";
import { EmptyState, ErrorBanner, LoadingState, Pagination } from "@/components/admin/ui";

function fileIcon(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "🖼️";
  if (mimeType.startsWith("video/")) return "🎬";
  if (mimeType === "application/pdf") return "📄";
  return "📎";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaLibraryPage() {
  const { role } = useAdminAuth();
  const isAdmin = role === "ADMIN";
  const [items, setItems] = useState<MediaAdminItem[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [mimeType, setMimeType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<"grid" | "table">("grid");

  async function load(p = page) {
    setLoading(true); setError("");
    try {
      const res = await listMedia({ page: p, size: 24, mimeType: mimeType || undefined });
      setItems(res.content); setTotalPages(res.totalPages); setTotalElements(res.totalElements);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to load media."); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(0); setPage(0); }, [mimeType]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This removes the metadata record only.`)) return;
    try { await deleteMedia(id); load(page); }
    catch (e) { alert(e instanceof Error ? e.message : "Delete failed."); }
  }

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Media Library</h1>
          <p className="admin-page-subtitle">Manage uploaded media assets and their metadata.</p>
        </div>
        <div className="admin-page-actions">
          <button className={`admin-btn admin-btn--secondary admin-btn--sm`}
            onClick={() => setView(view === "grid" ? "table" : "grid")}>
            {view === "grid" ? "List view" : "Grid view"}
          </button>
          <Link href="/admin/media/new" className="admin-btn admin-btn--primary">+ Register Asset</Link>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-body" style={{ padding: "14px 16px" }}>
          <div className="admin-filters">
            <select className="admin-filter-select" value={mimeType} onChange={(e) => setMimeType(e.target.value)}>
              <option value="">All types</option>
              <option value="image/">Images</option>
              <option value="application/pdf">PDF</option>
              <option value="video/">Video</option>
            </select>
          </div>
        </div>

        {error && <ErrorBanner message={error} />}
        {loading ? <LoadingState /> : items.length === 0 ? (
          <EmptyState icon="🖼️" title="No media assets yet" description="Register your first asset."
            action={<Link href="/admin/media/new" className="admin-btn admin-btn--primary">Register Asset</Link>} />
        ) : view === "grid" ? (
          <div style={{ padding: "16px" }}>
            <div className="admin-media-grid">
              {items.map((item) => (
                <div key={item.id} className="admin-media-card">
                  {item.mimeType.startsWith("image/") ? (
                    <img src={item.publicUrl} alt={item.altText ?? item.fileName}
                      className="admin-media-thumb" style={{ objectFit: "cover" }} />
                  ) : (
                    <div className="admin-media-thumb">{fileIcon(item.mimeType)}</div>
                  )}
                  <div className="admin-media-info">
                    <div className="admin-media-name" title={item.fileName}>{item.fileName}</div>
                    <div className="admin-media-meta">{formatBytes(item.sizeBytes)}</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                      <Link href={`/admin/media/${item.id}`}
                        className="admin-btn admin-btn--secondary admin-btn--sm" style={{ flex: 1, justifyContent: "center" }}>Edit</Link>
                      {isAdmin && (
                        <button className="admin-btn admin-btn--danger admin-btn--sm"
                          onClick={() => handleDelete(item.id, item.fileName)}>✕</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>File</th><th>Type</th><th>Size</th><th>Alt text</th><th>Uploaded</th><th /></tr></thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span>{fileIcon(item.mimeType)}</span>
                        <Link href={`/admin/media/${item.id}`} className="admin-table-link">{item.fileName}</Link>
                      </div>
                    </td>
                    <td className="admin-table-muted">{item.mimeType}</td>
                    <td className="admin-table-muted">{formatBytes(item.sizeBytes)}</td>
                    <td className="admin-table-muted">{item.altText || "—"}</td>
                    <td className="admin-table-muted">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <Link href={`/admin/media/${item.id}`} className="admin-btn admin-btn--secondary admin-btn--sm">Edit</Link>
                        {isAdmin && <button className="admin-btn admin-btn--danger admin-btn--sm" onClick={() => handleDelete(item.id, item.fileName)}>Delete</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} totalElements={totalElements} size={24}
          onPageChange={(p) => { setPage(p); load(p); }} />
      </div>
    </>
  );
}
