"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  adminOnly?: boolean;
}

const NAV_SECTIONS: Array<{ heading: string; items: NavItem[] }> = [
  {
    heading: "Overview",
    items: [{ label: "Dashboard", href: "/admin", icon: "⊞" }],
  },
  {
    heading: "Content",
    items: [
      { label: "Pages", href: "/admin/pages", icon: "📄" },
      { label: "Blog Posts", href: "/admin/blog", icon: "✍️" },
      { label: "Products", href: "/admin/products", icon: "📦" },
      { label: "Resources", href: "/admin/resources", icon: "📁" },
    ],
  },
  {
    heading: "Assets & Data",
    items: [
      { label: "Media Library", href: "/admin/media", icon: "🖼️" },
      { label: "Form Submissions", href: "/admin/forms", icon: "📬" },
    ],
  },
  {
    heading: "Site",
    items: [
      { label: "Redirects", href: "/admin/redirects", icon: "↩" },
    ],
  },
  {
    heading: "Administration",
    items: [
      {
        label: "User Management",
        href: "/admin/users",
        icon: "👥",
        adminOnly: true,
      },
    ],
  },
];

interface Props {
  role: string;
}

export function AdminSidebar({ role }: Props) {
  const pathname = usePathname();
  const isAdmin = role === "ADMIN";

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <aside className="admin-sidebar">
      {/* Logo */}
      <div className="admin-sidebar-logo">
        <div className="admin-sidebar-logo-mark">K</div>
        <div>
          <div className="admin-sidebar-logo-text">Kron Admin</div>
          <div className="admin-sidebar-logo-sub">Content Management</div>
        </div>
      </div>

      {/* Navigation */}
      {NAV_SECTIONS.map((section) => {
        const visible = section.items.filter(
          (item) => !item.adminOnly || isAdmin,
        );
        if (visible.length === 0) return null;
        return (
          <div key={section.heading} className="admin-nav-section">
            <div className="admin-nav-section-label">{section.heading}</div>
            {visible.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-item${isActive(item.href) ? " active" : ""}`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        );
      })}

      {/* Footer — role indicator */}
      <div className="admin-sidebar-footer">
        <div
          style={{
            fontSize: "11px",
            color: "rgba(156,163,175,.6)",
            textAlign: "center",
          }}
        >
          Signed in as{" "}
          <strong style={{ color: "rgba(156,163,175,.9)" }}>{role}</strong>
        </div>
      </div>
    </aside>
  );
}
