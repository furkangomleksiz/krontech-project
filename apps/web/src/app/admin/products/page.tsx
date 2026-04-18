"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { deleteProduct, listProducts, type ProductAdminItem, type PublishStatus } from "@/lib/api/admin";
import { useAdminAuth } from "@/components/admin/AdminShell";
import { EmptyState, ErrorBanner, LoadingState, Pagination, StatusBadge } from "@/components/admin/ui";

export default function ProductsListPage() {
  const { role } = useAdminAuth();
  const isAdmin = role === "ADMIN";
  const [items, setItems] = useState<ProductAdminItem[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [locale, setLocale] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(p = page) {
    setLoading(true); setError("");
    try {
      const res = await listProducts({ page: p, size: 20, locale: locale || undefined, status: (status as PublishStatus) || undefined });
      setItems(res.content); setTotalPages(res.totalPages); setTotalElements(res.totalElements);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to load products."); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(0); setPage(0); }, [locale, status]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    try { await deleteProduct(id); load(page); }
    catch (e) { alert(e instanceof Error ? e.message : "Delete failed."); }
  }

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Products</h1>
          <p className="admin-page-subtitle">Manage product pages and their feature content.</p>
        </div>
        <div className="admin-page-actions">
          <Link href="/admin/products/new" className="admin-btn admin-btn--primary">+ New Product</Link>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-body" style={{ padding: "14px 16px" }}>
          <div className="admin-filters">
            <select className="admin-filter-select" value={locale} onChange={(e) => setLocale(e.target.value)}>
              <option value="">All locales</option>
              <option value="tr">Turkish (tr)</option>
              <option value="en">English (en)</option>
            </select>
            <select className="admin-filter-select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </div>
        </div>
        <div className="admin-table-wrap">
          {error && <ErrorBanner message={error} />}
          {loading ? <LoadingState /> : items.length === 0 ? (
            <EmptyState icon="📦" title="No products yet" description="Add your first product."
              action={<Link href="/admin/products/new" className="admin-btn admin-btn--primary">New Product</Link>} />
          ) : (
            <table className="admin-table">
              <thead><tr><th>Title</th><th>Slug</th><th>Locale</th><th>Status</th><th>Updated</th><th /></tr></thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td><Link href={`/admin/products/${item.id}`} className="admin-table-link">{item.title || "Untitled"}</Link></td>
                    <td className="admin-table-muted">{item.slug}</td>
                    <td className="admin-table-muted">{item.locale.toUpperCase()}</td>
                    <td><StatusBadge status={item.status} /></td>
                    <td className="admin-table-muted">{new Date(item.updatedAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <Link href={`/admin/products/${item.id}`} className="admin-btn admin-btn--secondary admin-btn--sm">Edit</Link>
                        {isAdmin && <button className="admin-btn admin-btn--danger admin-btn--sm" onClick={() => handleDelete(item.id, item.title)}>Delete</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination page={page} totalPages={totalPages} totalElements={totalElements} size={20}
          onPageChange={(p) => { setPage(p); load(p); }} />
      </div>
    </>
  );
}
