"use client";

import { useState } from "react";
import type { ContentBlockItem } from "@/lib/api/admin";

// ── Block type registry ───────────────────────────────────────────────────────

export const BLOCK_TYPES = [
  { value: "hero", label: "Hero section" },
  { value: "text", label: "Text / rich content" },
  { value: "split-cta", label: "Split CTA" },
  { value: "feature-grid", label: "Feature grid" },
  { value: "stats", label: "Stats row" },
  { value: "faq", label: "FAQ accordion" },
  { value: "article-list", label: "Article list" },
  { value: "resource-grid", label: "Resource grid" },
  { value: "office-list", label: "Office locations" },
  { value: "custom", label: "Custom block" },
] as const;

const BLOCK_EXAMPLES: Record<string, object> = {
  hero: {
    eyebrow: "Intro tagline",
    title: "Main page heading",
    description: "Supporting paragraph text.",
    ctaLabel: "Get Started",
    ctaHref: "/en/contact",
    cta2Label: "Learn More",
    cta2Href: "#features",
    imageKey: "media/hero.jpg",
  },
  text: {
    heading: "Section heading",
    body: "Paragraph text goes here.",
  },
  "split-cta": {
    heading: "Heading",
    description: "Supporting text.",
    ctaLabel: "CTA Button",
    ctaHref: "/en/contact",
    imageKey: "media/section.jpg",
    reverse: false,
  },
  "feature-grid": {
    heading: "Why choose us",
    items: [
      { title: "Feature One", description: "Description here.", imageKey: "media/icon1.svg" },
      { title: "Feature Two", description: "Description here.", imageKey: "media/icon2.svg" },
    ],
  },
  stats: {
    items: [
      { number: "500+", label: "Customers" },
      { number: "20+", label: "Countries" },
    ],
  },
  faq: {
    heading: "Frequently Asked Questions",
    items: [
      { question: "Question 1?", answer: "Answer 1." },
      { question: "Question 2?", answer: "Answer 2." },
    ],
  },
  "article-list": { heading: "Latest articles", locale: "en" },
  "resource-grid": { heading: "Resources", locale: "en" },
  "office-list": { heading: "Our offices" },
  custom: { key: "value" },
};

function defaultPayload(blockType: string): string {
  const example = BLOCK_EXAMPLES[blockType] ?? { key: "value" };
  return JSON.stringify(example, null, 2);
}

// ── Structured field editors for simple block types ──────────────────────────

function HeroEditor({
  payload,
  onChange,
}: {
  payload: Record<string, string>;
  onChange: (p: Record<string, string>) => void;
}) {
  const set = (k: string, v: string) => onChange({ ...payload, [k]: v });
  return (
    <div className="admin-form" style={{ gap: 10 }}>
      <div className="admin-form-row admin-form-row--2">
        <Field label="Eyebrow" value={payload.eyebrow ?? ""} onChange={(v) => set("eyebrow", v)} />
        <Field label="Image key" value={payload.imageKey ?? ""} onChange={(v) => set("imageKey", v)} placeholder="media/hero.jpg" />
      </div>
      <Field label="Title *" value={payload.title ?? ""} onChange={(v) => set("title", v)} />
      <Field label="Description" value={payload.description ?? ""} onChange={(v) => set("description", v)} textarea />
      <div className="admin-form-row admin-form-row--2">
        <Field label="CTA label" value={payload.ctaLabel ?? ""} onChange={(v) => set("ctaLabel", v)} />
        <Field label="CTA URL" value={payload.ctaHref ?? ""} onChange={(v) => set("ctaHref", v)} />
      </div>
      <div className="admin-form-row admin-form-row--2">
        <Field label="Secondary CTA label" value={payload.cta2Label ?? ""} onChange={(v) => set("cta2Label", v)} />
        <Field label="Secondary CTA URL" value={payload.cta2Href ?? ""} onChange={(v) => set("cta2Href", v)} />
      </div>
    </div>
  );
}

function TextEditor({
  payload,
  onChange,
}: {
  payload: Record<string, string>;
  onChange: (p: Record<string, string>) => void;
}) {
  const set = (k: string, v: string) => onChange({ ...payload, [k]: v });
  return (
    <div className="admin-form" style={{ gap: 10 }}>
      <Field label="Heading" value={payload.heading ?? ""} onChange={(v) => set("heading", v)} />
      <Field label="Body" value={payload.body ?? ""} onChange={(v) => set("body", v)} textarea rows={6} />
    </div>
  );
}

function SplitCtaEditor({
  payload,
  onChange,
}: {
  payload: Record<string, string | boolean>;
  onChange: (p: Record<string, string | boolean>) => void;
}) {
  const set = (k: string, v: string | boolean) => onChange({ ...payload, [k]: v });
  return (
    <div className="admin-form" style={{ gap: 10 }}>
      <Field label="Heading" value={String(payload.heading ?? "")} onChange={(v) => set("heading", v)} />
      <Field label="Description" value={String(payload.description ?? "")} onChange={(v) => set("description", v)} textarea />
      <div className="admin-form-row admin-form-row--2">
        <Field label="CTA label" value={String(payload.ctaLabel ?? "")} onChange={(v) => set("ctaLabel", v)} />
        <Field label="CTA URL" value={String(payload.ctaHref ?? "")} onChange={(v) => set("ctaHref", v)} />
      </div>
      <div className="admin-form-row admin-form-row--2">
        <Field label="Image key" value={String(payload.imageKey ?? "")} onChange={(v) => set("imageKey", v)} placeholder="media/section.jpg" />
        <div className="admin-field" style={{ justifyContent: "flex-end" }}>
          <div className="admin-checkbox-field" style={{ marginTop: 22 }}>
            <input type="checkbox" className="admin-checkbox" id="reverse"
              checked={!!payload.reverse}
              onChange={(e) => set("reverse", e.target.checked)} />
            <label htmlFor="reverse" className="admin-label">Reverse layout</label>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  textarea,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  textarea?: boolean;
  rows?: number;
}) {
  return (
    <div className="admin-field">
      <label className="admin-label">{label}</label>
      {textarea ? (
        <textarea className="admin-textarea" rows={rows} value={value}
          onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      ) : (
        <input type="text" className="admin-input" value={value}
          onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </div>
  );
}

// ── JSON payload editor (fallback for complex block types) ────────────────────

function JsonEditor({
  value,
  onChange,
  blockType,
}: {
  value: string;
  onChange: (v: string) => void;
  blockType: string;
}) {
  const [jsonError, setJsonError] = useState("");

  function handleChange(raw: string) {
    onChange(raw);
    try {
      JSON.parse(raw);
      setJsonError("");
    } catch {
      setJsonError("Invalid JSON");
    }
  }

  return (
    <div className="admin-field">
      <label className="admin-label">
        Payload JSON
        <span className="admin-label-hint" style={{ marginLeft: 8 }}>
          block type: <code>{blockType}</code>
        </span>
      </label>
      <textarea
        className="admin-textarea"
        rows={10}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        style={{ fontFamily: "monospace", fontSize: 12 }}
        spellCheck={false}
      />
      {jsonError && <span className="admin-field-error">{jsonError}</span>}
    </div>
  );
}

// ── Single block card ─────────────────────────────────────────────────────────

function BlockCard({
  block,
  index,
  total,
  onChange,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  block: ContentBlockItem;
  index: number;
  total: number;
  onChange: (b: ContentBlockItem) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  function parsePayload(): Record<string, unknown> {
    try {
      return JSON.parse(block.payloadJson) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  function renderEditor() {
    const p = parsePayload();
    if (block.blockType === "hero") {
      return <HeroEditor payload={p as Record<string, string>}
        onChange={(np) => onChange({ ...block, payloadJson: JSON.stringify(np) })} />;
    }
    if (block.blockType === "text") {
      return <TextEditor payload={p as Record<string, string>}
        onChange={(np) => onChange({ ...block, payloadJson: JSON.stringify(np) })} />;
    }
    if (block.blockType === "split-cta") {
      return <SplitCtaEditor payload={p as Record<string, string | boolean>}
        onChange={(np) => onChange({ ...block, payloadJson: JSON.stringify(np) })} />;
    }
    // All other types use the JSON editor
    return (
      <JsonEditor
        value={block.payloadJson}
        onChange={(v) => onChange({ ...block, payloadJson: v })}
        blockType={block.blockType}
      />
    );
  }

  return (
    <div className="admin-block-card">
      <div className="admin-block-header" onClick={() => setExpanded((e) => !e)}>
        <div className="admin-block-handle">
          <span className="admin-block-order">#{index + 1}</span>
          <span className="admin-block-type">
            {BLOCK_TYPES.find((t) => t.value === block.blockType)?.label ?? block.blockType}
          </span>
        </div>
        <div className="admin-block-actions" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm"
            onClick={onMoveUp} disabled={index === 0} title="Move up">↑</button>
          <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm"
            onClick={onMoveDown} disabled={index === total - 1} title="Move down">↓</button>
          <button type="button" className="admin-btn admin-btn--danger admin-btn--sm"
            onClick={onDelete} title="Remove block">✕</button>
          <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm"
            onClick={() => setExpanded((e) => !e)}>{expanded ? "▲" : "▼"}</button>
        </div>
      </div>

      {expanded && (
        <div className="admin-block-body">
          {/* Allow changing the block type */}
          <div className="admin-field" style={{ marginBottom: 14 }}>
            <label className="admin-label">Block type</label>
            <select className="admin-select" value={block.blockType}
              onChange={(e) => {
                const newType = e.target.value;
                onChange({
                  ...block,
                  blockType: newType,
                  payloadJson: defaultPayload(newType),
                });
              }}>
              {BLOCK_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          {renderEditor()}
        </div>
      )}
    </div>
  );
}

// ── BlockEditor (public component) ───────────────────────────────────────────

interface BlockEditorProps {
  blocks: ContentBlockItem[];
  onChange: (blocks: ContentBlockItem[]) => void;
}

export function BlockEditor({ blocks, onChange }: BlockEditorProps) {
  const [newType, setNewType] = useState("hero");

  function addBlock() {
    const block: ContentBlockItem = {
      blockType: newType,
      sortOrder: blocks.length,
      payloadJson: defaultPayload(newType),
    };
    onChange([...blocks, block]);
  }

  function updateBlock(index: number, updated: ContentBlockItem) {
    const next = [...blocks];
    next[index] = updated;
    onChange(next.map((b, i) => ({ ...b, sortOrder: i })));
  }

  function moveUp(index: number) {
    if (index === 0) return;
    const next = [...blocks];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange(next.map((b, i) => ({ ...b, sortOrder: i })));
  }

  function moveDown(index: number) {
    if (index >= blocks.length - 1) return;
    const next = [...blocks];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onChange(next.map((b, i) => ({ ...b, sortOrder: i })));
  }

  function deleteBlock(index: number) {
    if (!confirm("Remove this block?")) return;
    const next = blocks.filter((_, i) => i !== index);
    onChange(next.map((b, i) => ({ ...b, sortOrder: i })));
  }

  return (
    <div className="admin-block-editor">
      <div className="admin-block-editor-header">
        <span className="admin-block-editor-title">
          Content Blocks <span className="admin-block-editor-count">({blocks.length})</span>
        </span>
        <div className="admin-block-add-row">
          <select className="admin-filter-select" value={newType}
            onChange={(e) => setNewType(e.target.value)}>
            {BLOCK_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <button type="button" className="admin-btn admin-btn--primary admin-btn--sm"
            onClick={addBlock}>
            + Add Block
          </button>
        </div>
      </div>

      {blocks.length === 0 ? (
        <div className="admin-empty" style={{ padding: "24px" }}>
          <p style={{ color: "var(--a-text-muted)", margin: 0, fontSize: 13 }}>
            No blocks yet. Add a block above to start building the page.
          </p>
        </div>
      ) : (
        <div className="admin-block-list">
          {blocks.map((block, index) => (
            <BlockCard
              key={`${block.blockType}-${block.sortOrder}-${index}`}
              block={block}
              index={index}
              total={blocks.length}
              onChange={(b) => updateBlock(index, b)}
              onMoveUp={() => moveUp(index)}
              onMoveDown={() => moveDown(index)}
              onDelete={() => deleteBlock(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
