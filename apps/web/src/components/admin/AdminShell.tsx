"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { adminMe, AdminApiError, clearCredentials } from "@/lib/api/admin";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";

// ── Auth context ──────────────────────────────────────────────────────────────

interface AuthState {
  token: string;
  role: string;
  email: string;
}

interface AdminAuthCtxValue extends AuthState {
  logout: () => void;
}

const AdminAuthCtx = createContext<AdminAuthCtxValue | null>(null);

export function useAdminAuth(): AdminAuthCtxValue {
  const ctx = useContext(AdminAuthCtx);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminShell");
  return ctx;
}

// ── Shell ─────────────────────────────────────────────────────────────────────

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";

  // "loading" = haven't read localStorage yet
  const [auth, setAuth] = useState<AuthState | "loading" | null>("loading");

  const logout = useCallback(() => {
    localStorage.removeItem("krontech_admin_token");
    localStorage.removeItem("krontech_admin_role");
    localStorage.removeItem("krontech_admin_email");
    router.push("/admin/login");
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    async function resolveAuth() {
      const token = localStorage.getItem("krontech_admin_token");
      const role = localStorage.getItem("krontech_admin_role") ?? "EDITOR";
      const email = localStorage.getItem("krontech_admin_email") ?? "";

      if (!token) {
        if (!cancelled) setAuth(null);
        if (!isLogin) router.replace("/admin/login");
        return;
      }

      // Login route: keep showing the form even if a stale JWT remains in storage.
      if (isLogin) {
        if (!cancelled) setAuth({ token, role, email });
        return;
      }

      // Any other admin route: confirm the JWT with the API so UI state matches the server.
      try {
        const me = await adminMe();
        if (!cancelled) setAuth({ token, role: me.role, email: me.email });
      } catch (err) {
        const staleSession =
          err instanceof AdminApiError && (err.status === 401 || err.status === 403);
        if (!staleSession) {
          if (!cancelled) setAuth({ token, role, email });
          return;
        }
        clearCredentials();
        if (!cancelled) setAuth(null);
        router.replace("/admin/login");
      }
    }

    void resolveAuth();
    return () => {
      cancelled = true;
    };
  }, [pathname, isLogin, router]);

  // Checking localStorage
  if (auth === "loading") {
    return (
      <div className="admin-root admin-loading-screen">
        <span className="admin-spinner" />
      </div>
    );
  }

  // Login page — no shell chrome
  if (isLogin) {
    return <div className="admin-root">{children}</div>;
  }

  // Redirect in progress
  if (!auth) return null;

  return (
    <AdminAuthCtx.Provider value={{ ...auth, logout }}>
      <div className="admin-root admin-layout">
        <AdminSidebar role={auth.role} />
        <div className="admin-body">
          <AdminTopbar email={auth.email} role={auth.role} onLogout={logout} />
          <main className="admin-content">{children}</main>
        </div>
      </div>
    </AdminAuthCtx.Provider>
  );
}
