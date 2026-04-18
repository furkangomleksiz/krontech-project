"use client";

import { useEffect, useState } from "react";
import { getFormSubmission, listFormSubmissions, type FormSubmissionAdminItem } from "@/lib/api/admin";
import { EmptyState, ErrorBanner, LoadingState, Pagination } from "@/components/admin/ui";

function DetailRow({ label, value }: { label: string; value: string | undefined }) {
  if (!value) return null;
  return (
    <>
      <span className="admin-detail-label">{label}</span>
      <span className="admin-detail-value">{value}</span>
    </>
  );
}

export default function FormSubmissionsPage() {
  const [items, setItems] = useState<FormSubmissionAdminItem[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [formType, setFormType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<FormSubmissionAdminItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  async function load(p = page) {
    setLoading(true); setError("");
    try {
      const res = await listFormSubmissions({ page: p, size: 20, formType: formType || undefined });
      setItems(res.content); setTotalPages(res.totalPages); setTotalElements(res.totalElements);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to load submissions."); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(0); setPage(0); }, [formType]); // eslint-disable-line react-hooks/exhaustive-deps

  async function openDetail(id: string) {
    setDetailLoading(true);
    try { const item = await getFormSubmission(id); setSelected(item); }
    catch { setSelected(null); }
    finally { setDetailLoading(false); }
  }


  return (
    <>
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={() => setSelected(null)}>
          <div className="admin-card" style={{ width: "100%", maxWidth: 560, maxHeight: "90vh", overflow: "auto" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="admin-card-header">
              <p className="admin-card-title">Submission — {selected.fullName}</p>
              <button className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="admin-card-body">
              <div className="admin-detail-grid" style={{ marginBottom: 16 }}>
                <DetailRow label="Name" value={selected.fullName} />
                <DetailRow label="Email" value={selected.email} />
                <DetailRow label="Company" value={selected.company} />
                <DetailRow label="Job title" value={selected.jobTitle} />
                <DetailRow label="Department" value={selected.department} />
                <DetailRow label="Phone" value={selected.phone} />
                <DetailRow label="Form type" value={selected.formType} />
                <DetailRow label="Source page" value={selected.sourcePage} />
                <DetailRow label="IP" value={selected.ipAddress} />
                <DetailRow label="Submitted" value={new Date(selected.submittedAt).toLocaleString()} />
                <span className="admin-detail-label">Consent</span>
                <span className="admin-detail-value">{selected.consentAccepted ? "✓ Accepted" : "✗ Not accepted"}</span>
              </div>
              <div className="admin-field" style={{ marginBottom: 16 }}>
                <label className="admin-label">Message</label>
                <div className="admin-pre">{selected.message}</div>
              </div>
              <p style={{ fontSize: 12, color: "var(--a-text-muted)", margin: 0 }}>
                Export submissions via{" "}
                <code style={{ fontFamily: "monospace" }}>GET /api/v1/admin/forms/export.csv</code>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Form Submissions</h1>
          <p className="admin-page-subtitle">Review and manage contact and demo request submissions.</p>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-body" style={{ padding: "14px 16px" }}>
          <div className="admin-filters">
            <select className="admin-filter-select" value={formType} onChange={(e) => setFormType(e.target.value)}>
              <option value="">All form types</option>
              <option value="CONTACT">Contact</option>
              <option value="DEMO_REQUEST">Demo Request</option>
            </select>
          </div>
        </div>
        <div className="admin-table-wrap">
          {error && <ErrorBanner message={error} />}
          {loading ? <LoadingState /> : items.length === 0 ? (
            <EmptyState icon="📬" title="No submissions yet" description="Form submissions will appear here." />
          ) : (
            <table className="admin-table">
              <thead><tr><th>Name</th><th>Email</th><th>Company</th><th>Type</th><th>Submitted</th><th /></tr></thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td><span className="admin-table-link" style={{ cursor: "pointer" }} onClick={() => openDetail(item.id)}>{item.fullName}</span></td>
                    <td className="admin-table-muted">{item.email}</td>
                    <td className="admin-table-muted">{item.company}</td>
                    <td className="admin-table-muted">{item.formType}</td>
                    <td className="admin-table-muted">{new Date(item.submittedAt).toLocaleDateString()}</td>
                    <td>
                      <button className="admin-btn admin-btn--secondary admin-btn--sm" onClick={() => openDetail(item.id)}
                        disabled={detailLoading}>View</button>
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
