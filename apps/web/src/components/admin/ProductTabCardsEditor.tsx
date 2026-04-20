"use client";

import { useCallback } from "react";
import { MediaPicker } from "@/components/admin/MediaPicker";
import type { ProductTabCardAdminItem, ProductTabCardReplacePayload } from "@/lib/api/admin";

/** Tabs that use repeating text + image cards (Resources is edited separately). */
export type ProductTabKey = "SOLUTION" | "HOW_IT_WORKS" | "KEY_BENEFITS";

const TAB_ORDER: ProductTabKey[] = ["SOLUTION", "HOW_IT_WORKS", "KEY_BENEFITS"];

const TAB_LABELS: Record<ProductTabKey, string> = {
  SOLUTION: "Solution",
  HOW_IT_WORKS: "How it works?",
  KEY_BENEFITS: "Key benefits",
};

export interface TabCardDraft {
  tab: ProductTabKey;
  sortOrder: number;
  title: string;
  body: string;
  imageObjectKey: string;
  imageAlt: string;
}

function emptyByTab(): Record<ProductTabKey, TabCardDraft[]> {
  return {
    SOLUTION: [],
    HOW_IT_WORKS: [],
    KEY_BENEFITS: [],
  };
}

export function tabCardsFromApi(items: ProductTabCardAdminItem[] | undefined): Record<ProductTabKey, TabCardDraft[]> {
  const out = emptyByTab();
  if (!items?.length) return out;
  for (const row of items) {
    const tab = row.tab as ProductTabKey;
    if (!TAB_ORDER.includes(tab)) continue;
    out[tab].push({
      tab,
      sortOrder: row.sortOrder,
      title: row.title,
      body: row.body,
      imageObjectKey: row.imageObjectKey ?? "",
      imageAlt: row.imageAlt ?? "",
    });
  }
  for (const k of TAB_ORDER) {
    out[k].sort((a, b) => a.sortOrder - b.sortOrder);
  }
  return out;
}

/** Flattens grouped drafts into the JSON body expected by `PUT /admin/products/{id}`. */
export function flattenTabCardsForApi(byTab: Record<ProductTabKey, TabCardDraft[]>): ProductTabCardReplacePayload[] {
  const payload: ProductTabCardReplacePayload[] = [];
  for (const tab of TAB_ORDER) {
    const rows = byTab[tab];
    rows.forEach((row, idx) => {
      payload.push({
        tab,
        sortOrder: idx,
        title: row.title,
        body: row.body,
        imageObjectKey: row.imageObjectKey.trim() || undefined,
        imageAlt: row.imageAlt.trim() || undefined,
      });
    });
  }
  return payload;
}

interface ProductTabCardsEditorProps {
  value: Record<ProductTabKey, TabCardDraft[]>;
  onChange: (next: Record<ProductTabKey, TabCardDraft[]>) => void;
}

export function ProductTabCardsEditor({ value, onChange }: ProductTabCardsEditorProps) {
  const updateTab = useCallback(
    (tab: ProductTabKey, rows: TabCardDraft[]) => {
      onChange({ ...value, [tab]: rows });
    },
    [value, onChange],
  );

  const addCard = (tab: ProductTabKey) => {
    const rows = value[tab];
    const next: TabCardDraft = {
      tab,
      sortOrder: rows.length,
      title: "",
      body: "",
      imageObjectKey: "",
      imageAlt: "",
    };
    updateTab(tab, [...rows, next]);
  };

  const removeCard = (tab: ProductTabKey, index: number) => {
    const rows = value[tab].filter((_, i) => i !== index);
    updateTab(tab, rows);
  };

  const patchCard = (tab: ProductTabKey, index: number, patch: Partial<TabCardDraft>) => {
    const rows = value[tab].map((row, i) => (i === index ? { ...row, ...patch } : row));
    updateTab(tab, rows);
  };

  const move = (tab: ProductTabKey, index: number, dir: -1 | 1) => {
    const rows = [...value[tab]];
    const j = index + dir;
    if (j < 0 || j >= rows.length) return;
    [rows[index], rows[j]] = [rows[j], rows[index]];
    updateTab(tab, rows);
  };

  return (
    <div className="product-tab-cards-editor">
      {TAB_ORDER.map((tab) => (
        <div
          key={tab}
          style={{
            marginBottom: 24,
            padding: 16,
            border: "1px solid var(--a-border)",
            borderRadius: 8,
            background: "var(--a-surface-2, rgba(0,0,0,.02))",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <strong>{TAB_LABELS[tab]}</strong>
            <button type="button" className="admin-btn admin-btn--secondary admin-btn--sm" onClick={() => addCard(tab)}>
              + Add card
            </button>
          </div>

          {value[tab].length === 0 ? (
            <p style={{ fontSize: 13, margin: 0, color: "var(--a-text-muted)" }}>
              No cards in this tab yet.
            </p>
          ) : (
            value[tab].map((row, index) => (
              <div
                key={`${tab}-${index}`}
                style={{
                  marginBottom: 16,
                  paddingBottom: 16,
                  borderBottom: index < value[tab].length - 1 ? "1px dashed var(--a-border)" : "none",
                }}
              >
                <div className="admin-form-row admin-form-row--2" style={{ marginBottom: 8 }}>
                  <div className="admin-field" style={{ marginBottom: 0 }}>
                    <label className="admin-label">Title</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={row.title}
                      onChange={(e) => patchCard(tab, index, { title: e.target.value })}
                      placeholder="Card heading"
                    />
                  </div>
                  <div className="admin-field" style={{ marginBottom: 0, alignSelf: "end" }}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="admin-btn admin-btn--secondary admin-btn--sm"
                        onClick={() => move(tab, index, -1)}
                        disabled={index === 0}
                        aria-label="Move up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn--secondary admin-btn--sm"
                        onClick={() => move(tab, index, 1)}
                        disabled={index === value[tab].length - 1}
                        aria-label="Move down"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn--secondary admin-btn--sm"
                        onClick={() => removeCard(tab, index)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>

                <div className="admin-field">
                  <label className="admin-label">Body</label>
                  <textarea
                    className="admin-textarea"
                    rows={4}
                    value={row.body}
                    onChange={(e) => patchCard(tab, index, { body: e.target.value })}
                    placeholder="Supporting paragraph"
                  />
                </div>

                <MediaPicker
                  label="Card image key"
                  value={row.imageObjectKey}
                  onChange={(k) => patchCard(tab, index, { imageObjectKey: k })}
                  placeholder="media/products/card.jpg"
                />

                <div className="admin-field">
                  <label className="admin-label">Image alt (optional)</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={row.imageAlt}
                    onChange={(e) => patchCard(tab, index, { imageAlt: e.target.value })}
                    placeholder="Describe the image for accessibility"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      ))}
    </div>
  );
}
