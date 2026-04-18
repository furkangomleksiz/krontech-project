"use client";

import { useEffect, useState } from "react";
import {
  createUser,
  deactivateUser,
  listUsers,
  updateUserRole,
  type UserAdminItem,
} from "@/lib/api/admin";
import { useAdminAuth } from "@/components/admin/AdminShell";
import {
  ActiveBadge,
  EmptyState,
  ErrorBanner,
  LoadingState,
  Pagination,
  RoleBadge,
  SuccessBanner,
} from "@/components/admin/ui";

function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ email: "", password: "", role: "EDITOR" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    try { await createUser(form); onCreated(); onClose(); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed to create user."); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}>
      <div className="admin-card" style={{ width: 400 }} onClick={(e) => e.stopPropagation()}>
        <div className="admin-card-header">
          <p className="admin-card-title">Create User</p>
          <button className="admin-btn admin-btn--ghost admin-btn--sm" onClick={onClose}>✕</button>
        </div>
        <div className="admin-card-body">
          <form onSubmit={handleSubmit} className="admin-form">
            {error && <ErrorBanner message={error} />}
            <div className="admin-field">
              <label className="admin-label">Email *</label>
              <input type="email" className="admin-input" value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required autoFocus />
            </div>
            <div className="admin-field">
              <label className="admin-label">Password *</label>
              <input type="password" className="admin-input" value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required minLength={8} />
            </div>
            <div className="admin-field">
              <label className="admin-label">Role</label>
              <select className="admin-select" value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                <option value="EDITOR">EDITOR</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
            <div className="admin-form-footer">
              <button type="button" className="admin-btn admin-btn--secondary" onClick={onClose}>Cancel</button>
              <button type="submit" disabled={saving} className="admin-btn admin-btn--primary">
                {saving ? "Creating…" : "Create User"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const { role, email: currentEmail } = useAdminAuth();
  const isAdmin = role === "ADMIN";

  const [items, setItems] = useState<UserAdminItem[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  async function load(p = page) {
    setLoading(true); setError("");
    try {
      const res = await listUsers({ page: p, size: 20 });
      setItems(res.content); setTotalPages(res.totalPages); setTotalElements(res.totalElements);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to load users."); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(0); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleRoleChange(id: string, newRole: string) {
    setError(""); setSuccess("");
    try {
      const updated = await updateUserRole(id, newRole);
      setItems((prev) => prev.map((u) => (u.id === id ? updated : u)));
      setSuccess(`Role updated to ${newRole}.`);
    } catch (e) { setError(e instanceof Error ? e.message : "Update failed."); }
  }

  async function handleDeactivate(id: string, email: string) {
    if (!confirm(`Deactivate account for "${email}"?`)) return;
    setError(""); setSuccess("");
    try {
      const updated = await deactivateUser(id);
      setItems((prev) => prev.map((u) => (u.id === id ? updated : u)));
      setSuccess(`${email} deactivated.`);
    } catch (e) { setError(e instanceof Error ? e.message : "Deactivate failed."); }
  }

  if (!isAdmin) {
    return (
      <div className="admin-card">
        <div className="admin-card-body">
          <EmptyState icon="🔒" title="Access restricted" description="User management is available to ADMIN users only." />
        </div>
      </div>
    );
  }

  return (
    <>
      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} onCreated={() => { load(page); setSuccess("User created."); }} />}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">User Management</h1>
          <p className="admin-page-subtitle">Manage admin and editor accounts. ADMIN role required.</p>
        </div>
        <div className="admin-page-actions">
          <button className="admin-btn admin-btn--primary" onClick={() => setShowCreate(true)}>+ Create User</button>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}
      {success && <SuccessBanner message={success} />}

      <div className="admin-card" style={{ marginTop: 16 }}>
        <div className="admin-table-wrap">
          {loading ? <LoadingState /> : items.length === 0 ? (
            <EmptyState icon="👥" title="No users found" />
          ) : (
            <table className="admin-table">
              <thead><tr><th>Email</th><th>Role</th><th>Status</th><th>Created</th><th /></tr></thead>
              <tbody>
                {items.map((user) => {
                  const isSelf = user.email === currentEmail;
                  return (
                    <tr key={user.id}>
                      <td>
                        <span>{user.email}</span>
                        {isSelf && <span style={{ marginLeft: 8, fontSize: 11, background: "#e0f2fe", color: "#0369a1", padding: "1px 6px", borderRadius: 10 }}>you</span>}
                      </td>
                      <td><RoleBadge role={user.role} /></td>
                      <td><ActiveBadge active={user.active} /></td>
                      <td className="admin-table-muted">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>
                        {!isSelf && (
                          <div style={{ display: "flex", gap: 6 }}>
                            <select className="admin-filter-select" value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value)}
                              style={{ padding: "4px 8px", fontSize: 12 }}>
                              <option value="EDITOR">EDITOR</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                            {user.active && (
                              <button className="admin-btn admin-btn--danger admin-btn--sm"
                                onClick={() => handleDeactivate(user.id, user.email)}>Deactivate</button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
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
