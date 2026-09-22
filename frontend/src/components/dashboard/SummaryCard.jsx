import React from "react";

export default function SummaryCard({
  label,
  value,
  tone = "default",
  icon = null,
  subtext = null,
  trend = null, // { direction: 'up' | 'down', text: '12% MoM' }
}) {
  const toneClass =
    tone === "success"
      ? "tone-success"
      : tone === "danger"
      ? "tone-danger"
      : tone === "primary"
      ? "tone-primary"
      : "tone-default";

  return (
    <div className={`summary-card ${toneClass}`}>
      <div className="summary-card-header">
        <span className="label">{label}</span>
        {icon && <div className="summary-icon-pill">{icon}</div>}
      </div>
      <div className="value">{value}</div>
      {(subtext || trend) && (
        <div className="sub-hint">
          {trend && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 2,
                fontWeight: 600,
                color:
                  trend.direction === "up"
                    ? "var(--color-success-text)"
                    : "var(--color-danger-text)",
              }}
            >
              {trend.direction === "up" ? "▲" : "▼"} {trend.text}
            </span>
          )}
          {subtext && <span>{subtext}</span>}
        </div>
      )}
    </div>
  );
}
