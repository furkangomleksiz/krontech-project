"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getBlogHighlightsAdmin,
  listBlog,
  updateBlogHighlightsAdmin,
  type BlogAdminItem,
  type BlogHighlightAdminItem,
} from "@/lib/api/admin";
import { ErrorBanner, LoadingState } from "@/components/admin/ui";

const SLOT_COUNT = 5;
const PICK_LIST_PAGE_SIZE = 200;

type LocaleTab = "en" | "tr";

function slotsFromPosts(posts: BlogHighlightAdminItem[]): string[] {
  const ids = posts.map((p) => p.id);
  const out = [...ids];
  while (out.length < SLOT_COUNT) out.push("");
  return out.slice(0, SLOT_COUNT);
}

export default function BlogHighlightsAdminPage() {
  const [locale, setLocale] = useState<LocaleTab>("en");
  const [slots, setSlots] = useState<string[]>(() => Array(SLOT_COUNT).fill(""));
  const [pickList, setPickList] = useState<BlogAdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [hlRes, listRes] = await Promise.all([
        getBlogHighlightsAdmin(locale),
        listBlog({
          locale,
          status: "PUBLISHED",
          page: 0,
          size: PICK_LIST_PAGE_SIZE,
        }),
      ]);
      setSlots(slotsFromPosts(hlRes.posts));
      setPickList(listRes.content);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    load();
  }, [load]);

  const options = useMemo(() => {
    return [...pickList].sort((a, b) =>
      (a.title || a.slug).localeCompare(b.title || b.slug, undefined, { sensitivity: "base" }),
    );
  }, [pickList]);

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const postIds = slots.map((s) => s.trim()).filter(Boolean);
      const res = await updateBlogHighlightsAdmin(locale, postIds);
      setSlots(slotsFromPosts(res.posts));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  function setSlotAt(index: number, value: string) {
    setSlots((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Blog sidebar highlights</h1>
          <p className="admin-page-subtitle">
            Choose up to five published posts per language. They appear in the Highlights column on
            the public blog list and article pages.
          </p>
        </div>
        <div className="admin-page-actions">
          <Link href="/admin/blog" className="admin-btn admin-btn--secondary">
            ← Blog posts
          </Link>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-body" style={{ padding: "18px 20px" }}>
          {error ? <ErrorBanner message={error} /> : null}

          <div className="admin-filters" style={{ marginBottom: 20 }}>
            <span style={{ fontSize: 13, color: "var(--gray-600)", marginRight: 8 }}>Locale</span>
            {(["en", "tr"] as const).map((loc) => (
              <button
                key={loc}
                type="button"
                className={`admin-btn admin-btn--sm${locale === loc ? " admin-btn--primary" : " admin-btn--secondary"}`}
                onClick={() => setLocale(loc)}
              >
                {loc.toUpperCase()}
              </button>
            ))}
          </div>

          {loading ? (
            <LoadingState />
          ) : (
            <>
              <ol className="admin-highlight-slots">
                {slots.map((value, index) => (
                  <li key={index} className="admin-highlight-slot">
                    <label
                      className="admin-highlight-slot__label"
                      htmlFor={`hl-slot-${locale}-${index}`}
                    >
                      Slot {index + 1}
                    </label>
                    <select
                      id={`hl-slot-${locale}-${index}`}
                      className="admin-filter-select admin-highlight-slot__select"
                      value={value}
                      onChange={(e) => setSlotAt(index, e.target.value)}
                    >
                      <option value="">— None —</option>
                      {options.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title || p.slug}
                        </option>
                      ))}
                    </select>
                  </li>
                ))}
              </ol>

              {pickList.length >= PICK_LIST_PAGE_SIZE ? (
                <p style={{ marginTop: 16, fontSize: 13, color: "var(--gray-600)" }}>
                  Only the first {PICK_LIST_PAGE_SIZE} published posts are listed. Narrow with the main
                  blog list if you need a post that is missing here.
                </p>
              ) : null}

              <div style={{ marginTop: 22, display: "flex", gap: 10 }}>
                <button
                  type="button"
                  className="admin-btn admin-btn--primary"
                  disabled={saving}
                  onClick={() => void handleSave()}
                >
                  {saving ? "Saving…" : "Save highlights"}
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--secondary"
                  disabled={saving}
                  onClick={() => void load()}
                >
                  Reload
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
