"use client";

import { useCallback } from "react";

interface LocaleLinkerProps {
  /** The locale of the content being edited. */
  currentLocale: string;
  /** UUID that groups locale variants of the same content together. */
  contentGroupId: string;
  onChange: (contentGroupId: string) => void;
}

export function LocaleLinker({
  currentLocale,
  contentGroupId,
  onChange,
}: LocaleLinkerProps) {
  const otherLocale = currentLocale === "tr" ? "en" : "tr";

  const generateId = useCallback(() => {
    const uuid = crypto.randomUUID();
    onChange(uuid);
  }, [onChange]);

  return (
    <div className="admin-fieldset">
      <div
        style={{
          padding: "12px 16px",
          borderBottom: contentGroupId ? "1px solid var(--a-border)" : undefined,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--a-text)" }}>
              🌍 Locale variants
            </span>
            <span
              style={{
                marginLeft: 8,
                fontSize: 11,
                background: "#e0f2fe",
                color: "#0369a1",
                padding: "1px 7px",
                borderRadius: 10,
                fontWeight: 600,
              }}
            >
              {currentLocale.toUpperCase()} (current)
            </span>
          </div>
        </div>
      </div>

      <div style={{ padding: "12px 16px" }}>
        <div className="admin-field">
          <label className="admin-label">
            Content group ID{" "}
            <span className="admin-label-hint">
              — shared UUID that links this item to its {otherLocale.toUpperCase()} translation
            </span>
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              className="admin-input"
              value={contentGroupId}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Leave blank or enter a UUID to link translations"
              style={{ fontFamily: "monospace", fontSize: 12 }}
            />
            {!contentGroupId && (
              <button
                type="button"
                className="admin-btn admin-btn--secondary"
                onClick={generateId}
                style={{ whiteSpace: "nowrap", flexShrink: 0 }}
                title={`Generate a new group ID — copy this to the ${otherLocale.toUpperCase()} variant to link them`}
              >
                Generate
              </button>
            )}
            {contentGroupId && (
              <button
                type="button"
                className="admin-btn admin-btn--ghost"
                onClick={() => onChange("")}
                title="Unlink from content group"
                style={{ flexShrink: 0 }}
              >
                Unlink
              </button>
            )}
          </div>
          {contentGroupId && (
            <p
              style={{
                margin: "6px 0 0",
                fontSize: 12,
                color: "var(--a-text-muted)",
                lineHeight: 1.5,
              }}
            >
              Copy this group ID into the <strong>{otherLocale.toUpperCase()} version</strong> of this
              content to link them as locale variants. Linked variants share the same public URL
              with a different locale prefix.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
