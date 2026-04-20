export default function PreviewLoading() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--gray-50)" }}>
      <div
        style={{
          background: "#4f46e5",
          color: "#fff",
          padding: "10px 24px",
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        <strong>Preview mode</strong> — loading…
      </div>
      <div className="container section-pad" style={{ textAlign: "center", color: "var(--gray-500)" }}>
        Loading preview…
      </div>
    </div>
  );
}
