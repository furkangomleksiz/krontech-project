"use client";

import { usePathname } from "next/navigation";

const ROUTE_LABELS: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/pages": "Pages",
  "/admin/blog": "Blog Posts",
  "/admin/blog/highlights": "Blog highlights",
  "/admin/products": "Products",
  "/admin/resources": "Resources",
  "/admin/media": "Media Library",
  "/admin/forms": "Form Submissions",
  "/admin/users": "Users",
};

function resolveTitle(pathname: string): string {
  if (pathname === "/admin/blog/highlights") {
    return ROUTE_LABELS["/admin/blog/highlights"] ?? "Blog highlights";
  }
  if (pathname.endsWith("/new")) {
    const base = pathname.replace(/\/new$/, "");
    const parent = ROUTE_LABELS[base];
    return parent ? `New — ${parent}` : "New";
  }
  // edit page (/admin/blog/some-uuid)
  for (const [route, label] of Object.entries(ROUTE_LABELS)) {
    if (pathname.startsWith(route + "/")) return `Edit — ${label}`;
  }
  return ROUTE_LABELS[pathname] ?? "Admin";
}

interface Props {
  email: string;
  role: string;
  onLogout: () => void;
}

export function AdminTopbar({ email, role, onLogout }: Props) {
  const pathname = usePathname();
  const title = resolveTitle(pathname);
  const initial = email ? email[0].toUpperCase() : "A";

  return (
    <header className="admin-topbar">
      <div className="admin-topbar-left">
        <span className="admin-topbar-breadcrumb">
          <strong>{title}</strong>
        </span>
      </div>
      <div className="admin-topbar-right">
        <div className="admin-topbar-user">
          <div className="admin-topbar-avatar">{initial}</div>
          <div>
            <div className="admin-topbar-email">{email}</div>
            <div className="admin-topbar-role">{role}</div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="admin-btn admin-btn--ghost admin-btn--sm"
          title="Sign out"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
