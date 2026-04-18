"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAdminAuth } from "@/components/admin/AdminShell";
import {
  listBlog,
  listFormSubmissions,
  listMedia,
  listPages,
  listProducts,
  listResources,
} from "@/lib/api/admin";

interface StatItem {
  label: string;
  value: string;
  href: string;
}

const QUICK_LINKS = [
  { icon: "✍️", label: "New Blog Post", href: "/admin/blog/new" },
  { icon: "📦", label: "New Product", href: "/admin/products/new" },
  { icon: "📁", label: "New Resource", href: "/admin/resources/new" },
  { icon: "📄", label: "New Page", href: "/admin/pages/new" },
  { icon: "📬", label: "View Submissions", href: "/admin/forms" },
  { icon: "🖼️", label: "Media Library", href: "/admin/media" },
];

export default function DashboardPage() {
  const { email, role } = useAdminAuth();
  const [stats, setStats] = useState<StatItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const size = 1;
    Promise.allSettled([
      listPages({ size }),
      listBlog({ size }),
      listProducts({ size }),
      listResources({ size }),
      listFormSubmissions({ size }),
      listMedia({ size }),
    ]).then(([pages, blog, products, resources, forms, media]) => {
      const val = (r: PromiseSettledResult<{ totalElements: number }>) =>
        r.status === "fulfilled" ? String(r.value.totalElements) : "–";
      setStats([
        { label: "Pages", value: val(pages), href: "/admin/pages" },
        { label: "Blog posts", value: val(blog), href: "/admin/blog" },
        { label: "Products", value: val(products), href: "/admin/products" },
        { label: "Resources", value: val(resources), href: "/admin/resources" },
        { label: "Submissions", value: val(forms), href: "/admin/forms" },
        { label: "Media assets", value: val(media), href: "/admin/media" },
      ]);
      setLoading(false);
    });
  }, []);

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-subtitle">
            Welcome back,{" "}
            <strong>{email}</strong> &mdash; {role}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="admin-stat-grid">
        {loading
          ? [...Array(6)].map((_, i) => (
              <div key={i} className="admin-stat-card">
                <div
                  style={{
                    height: 26,
                    width: 40,
                    background: "#f3f4f6",
                    borderRadius: 4,
                    marginBottom: 8,
                  }}
                />
                <div
                  style={{
                    height: 13,
                    width: 70,
                    background: "#f3f4f6",
                    borderRadius: 4,
                  }}
                />
              </div>
            ))
          : stats.map((s) => (
              <Link
                key={s.label}
                href={s.href}
                className="admin-stat-card"
                style={{ textDecoration: "none", display: "block" }}
              >
                <div className="admin-stat-value">{s.value}</div>
                <div className="admin-stat-label">{s.label}</div>
              </Link>
            ))}
      </div>

      {/* Quick links */}
      <h2
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--a-text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          margin: "0 0 12px",
        }}
      >
        Quick actions
      </h2>
      <div className="admin-quick-links">
        {QUICK_LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="admin-quick-link">
            <div className="admin-quick-link-icon">{l.icon}</div>
            <span>{l.label}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
