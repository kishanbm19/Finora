export default function SummaryCard({ label, value, tone = "default" }) {
  const toneColor =
    tone === "success" ? "var(--color-success)" : tone === "danger" ? "var(--color-danger)" : "var(--color-text)";

  return (
    <div className="card summary-card">
      <div className="label">{label}</div>
      <div className="value" style={{ color: toneColor }}>
        {value}
      </div>
    </div>
  );
}
