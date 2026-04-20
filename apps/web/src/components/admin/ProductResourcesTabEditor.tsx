"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { listResources, type ProductResourcesTabPayload, type ResourceAdminItem } from "@/lib/api/admin";
import { MediaPicker } from "@/components/admin/MediaPicker";

export interface ProductResourcesTabFormState {
  introTitle: string;
  introBody: string;
  introImageKey: string;
  introImageAlt: string;
  linkedResourceIds: string[];
}

interface ProductResourcesTabEditorProps {
  locale: string;
  value: ProductResourcesTabFormState;
  onChange: (next: ProductResourcesTabFormState) => void;
}

export function emptyResourcesTabForm(): ProductResourcesTabFormState {
  return {
    introTitle: "",
    introBody: "",
    introImageKey: "",
    introImageAlt: "",
    linkedResourceIds: [],
  };
}

export function toResourcesTabPayload(state: ProductResourcesTabFormState): ProductResourcesTabPayload {
  return {
    introTitle: state.introTitle.trim() || null,
    introBody: state.introBody.trim() || null,
    introImageKey: state.introImageKey.trim() || null,
    introImageAlt: state.introImageAlt.trim() || null,
    linkedResourceIds: state.linkedResourceIds,
  };
}

export function resourcesTabFromApi(p: {
  resourcesIntroTitle?: string | null;
  resourcesIntroBody?: string | null;
  resourcesIntroImageKey?: string | null;
  resourcesIntroImageAlt?: string | null;
  linkedResourceIds?: string[] | null;
}): ProductResourcesTabFormState {
  return {
    introTitle: p.resourcesIntroTitle ?? "",
    introBody: p.resourcesIntroBody ?? "",
    introImageKey: p.resourcesIntroImageKey ?? "",
    introImageAlt: p.resourcesIntroImageAlt ?? "",
    linkedResourceIds: Array.isArray(p.linkedResourceIds) ? [...p.linkedResourceIds] : [],
  };
}

export function ProductResourcesTabEditor({ locale, value, onChange }: ProductResourcesTabEditorProps) {
  const [catalog, setCatalog] = useState<ResourceAdminItem[]>([]);
  const [catalogError, setCatalogError] = useState("");
  const [pickId, setPickId] = useState("");

  useEffect(() => {
    let cancelled = false;
    listResources({ locale, size: 100, page: 0 })
      .then((res) => {
        if (!cancelled) setCatalog(res.content ?? []);
      })
      .catch((e) => {
        if (!cancelled) setCatalogError(e instanceof Error ? e.message : "Could not load resources.");
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const titleById = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of catalog) {
      m.set(r.id, r.title || "Untitled");
    }
    return m;
  }, [catalog]);

  const availableToAdd = useMemo(() => {
    const set = new Set(value.linkedResourceIds);
    return catalog.filter((r) => !set.has(r.id));
  }, [catalog, value.linkedResourceIds]);

  const patch = useCallback(
    (partial: Partial<ProductResourcesTabFormState>) => {
      onChange({ ...value, ...partial });
    },
    [onChange, value],
  );

  const addLinked = () => {
    if (!pickId) return;
    if (value.linkedResourceIds.includes(pickId)) return;
    patch({ linkedResourceIds: [...value.linkedResourceIds, pickId] });
    setPickId("");
  };

  const removeLinked = (id: string) => {
    patch({ linkedResourceIds: value.linkedResourceIds.filter((x) => x !== id) });
  };

  const moveLinked = (index: number, dir: -1 | 1) => {
    const next = [...value.linkedResourceIds];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    patch({ linkedResourceIds: next });
  };

  return (
    <div className="product-resources-tab-editor">
      <p style={{ fontSize: 13, color: "var(--a-text-muted)", margin: "0 0 16px", lineHeight: 1.5 }}>
        The public <strong>Resources</strong> tab shows one wide &quot;learn more&quot; card, then document cards
        (same style as the datasheets listing). Pick any CMS resources in this locale; only{" "}
        <strong>published</strong> ones appear on the live site.
      </p>

      <div className="admin-field">
        <label className="admin-label">Intro title</label>
        <input
          type="text"
          className="admin-input"
          value={value.introTitle}
          onChange={(e) => patch({ introTitle: e.target.value })}
          placeholder='e.g. Learn more about Kron AAA'
        />
      </div>

      <div className="admin-field">
        <label className="admin-label">Intro description</label>
        <textarea
          className="admin-textarea"
          rows={3}
          value={value.introBody}
          onChange={(e) => patch({ introBody: e.target.value })}
          placeholder="Short paragraph under the heading"
        />
      </div>

      <MediaPicker
        label="Intro image key"
        value={value.introImageKey}
        onChange={(k) => patch({ introImageKey: k })}
        placeholder="media/products/resources-intro.png"
      />

      <div className="admin-field">
        <label className="admin-label">Intro image alt (optional)</label>
        <input
          type="text"
          className="admin-input"
          value={value.introImageAlt}
          onChange={(e) => patch({ introImageAlt: e.target.value })}
        />
      </div>

      <hr style={{ border: 0, borderTop: "1px solid var(--a-border)", margin: "20px 0" }} />

      <strong style={{ display: "block", marginBottom: 8 }}>Linked resources (order = public display order)</strong>
      {catalogError ? (
        <p style={{ color: "#b91c1c", fontSize: 13 }}>{catalogError}</p>
      ) : null}

      <div className="admin-form-row admin-form-row--2" style={{ marginBottom: 12 }}>
        <div className="admin-field" style={{ marginBottom: 0 }}>
          <label className="admin-label">Add resource</label>
          <select className="admin-select" value={pickId} onChange={(e) => setPickId(e.target.value)}>
            <option value="">Select…</option>
            {availableToAdd.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title || "Untitled"} ({r.resourceType})
              </option>
            ))}
          </select>
        </div>
        <div className="admin-field" style={{ marginBottom: 0, alignSelf: "end" }}>
          <button type="button" className="admin-btn admin-btn--secondary" onClick={addLinked} disabled={!pickId}>
            Add to list
          </button>
        </div>
      </div>

      {value.linkedResourceIds.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--a-text-muted)", margin: 0 }}>No resources linked yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {value.linkedResourceIds.map((id, index) => (
            <li
              key={id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 0",
                borderBottom: "1px dashed var(--a-border)",
              }}
            >
              <span style={{ flex: 1, fontSize: 14 }}>{titleById.get(id) ?? id}</span>
              <button
                type="button"
                className="admin-btn admin-btn--secondary admin-btn--sm"
                onClick={() => moveLinked(index, -1)}
                disabled={index === 0}
                aria-label="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--secondary admin-btn--sm"
                onClick={() => moveLinked(index, 1)}
                disabled={index === value.linkedResourceIds.length - 1}
                aria-label="Move down"
              >
                ↓
              </button>
              <button type="button" className="admin-btn admin-btn--secondary admin-btn--sm" onClick={() => removeLinked(id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
