import { useState } from "react";
import { useFetch } from "../hooks/useFetch";
import {
  fetchAnalyticsSummary,
  fetchForecast,
  fetchAnomalies,
  fetchInsights,
} from "../services/dashboardService";
import { formatCurrency } from "../utils/formatCurrency";
import { formatDate } from "../utils/formatDate";
import SummaryCard from "../components/dashboard/SummaryCard";
import Loader from "../components/common/Loader";
import { IconAnalytics, IconArrowUpRight, IconArrowDownRight, IconAlertCircle } from "../components/common/Icons";

const SEVERITY_CONFIG = {
  info: { class: "badge-info", label: "Info" },
  warning: { class: "badge-warning", label: "Warning" },
  critical: { class: "badge-danger", label: "Critical" },
};

export default function Analytics() {
  const [metric, setMetric] = useState("income");

  const { data: summary, loading: summaryLoading } = useFetch(fetchAnalyticsSummary, []);
  const { data: forecast, loading: forecastLoading } = useFetch(() => fetchForecast(metric, 3), [metric]);
  const { data: anomalyData, loading: anomalyLoading } = useFetch(fetchAnomalies, []);
  const { data: insightsData, loading: insightsLoading } = useFetch(fetchInsights, []);

  if (summaryLoading) return <Loader label="Crunching business analytics & forecasts…" />;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Financial Analytics</h1>
          <p>Growth velocity, predictive forecasting, anomaly audits, and automated insights.</p>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <SummaryCard
          label="Revenue Growth (MoM)"
          value={`${summary.revenue_growth_pct >= 0 ? "+" : ""}${summary.revenue_growth_pct}%`}
          tone={summary.revenue_growth_pct >= 0 ? "success" : "danger"}
          icon={<IconArrowUpRight size={18} color="var(--color-success-text)" />}
          subtext="Month-over-month trajectory"
        />
        <SummaryCard
          label="Expense Growth (MoM)"
          value={`${summary.expense_growth_pct <= 0 ? "" : "+"}${summary.expense_growth_pct}%`}
          tone={summary.expense_growth_pct <= 0 ? "success" : "danger"}
          icon={<IconArrowDownRight size={18} color="var(--color-danger-text)" />}
          subtext="Outflow delta comparison"
        />
        <SummaryCard
          label="Operating Profit Margin"
          value={`${summary.profit_margin_pct}%`}
          tone={summary.profit_margin_pct >= 10 ? "success" : "danger"}
          icon={<IconAnalytics size={18} />}
          subtext={summary.profit_margin_pct >= 10 ? "Healthy margin ratio" : "Compression warning"}
        />
        <SummaryCard
          label="Categories Monitored"
          value={Object.keys(summary.expense_by_category).length}
          tone="default"
          subtext="Active cost centers"
        />
      </div>

      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        {/* Expense by Category */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--color-border)" }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Expense by Category</h3>
          </div>
          {Object.keys(summary.expense_by_category).length === 0 ? (
            <div style={{ padding: 24, color: "var(--color-text-muted)", fontSize: 13.5 }}>
              No categorized expenses logged yet.
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th style={{ textAlign: "right" }}>Total Outflow</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(summary.expense_by_category).map(([category, amount]) => (
                  <tr key={category}>
                    <td style={{ textTransform: "capitalize", fontWeight: 500 }}>{category}</td>
                    <td style={{ textAlign: "right", fontWeight: 700, color: "var(--color-danger-text)" }} className="tabular-nums">
                      -{formatCurrency(amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Top Customers by Revenue */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--color-border)" }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Top Customers by Revenue</h3>
          </div>
          {summary.top_customers_by_revenue.length === 0 ? (
            <div style={{ padding: 24, color: "var(--color-text-muted)", fontSize: 13.5 }}>
              No realized invoices recorded yet.
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th style={{ textAlign: "right" }}>Paid Revenue</th>
                </tr>
              </thead>
              <tbody>
                {summary.top_customers_by_revenue.map((c) => (
                  <tr key={c.name}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td style={{ textAlign: "right", fontWeight: 700, color: "var(--color-success-text)" }} className="tabular-nums">
                      +{formatCurrency(c.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Forecast Card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>AI Predictive Forecast (Next 3 Months)</h3>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>
              Statistical projection based on historical trends
            </p>
          </div>
          <select className="input" style={{ width: 140 }} value={metric} onChange={(e) => setMetric(e.target.value)}>
            <option value="income">Income Stream</option>
            <option value="expense">Expense Stream</option>
          </select>
        </div>

        {forecastLoading ? (
          <Loader label="Generating projections…" />
        ) : forecast.forecast.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)", fontSize: 13.5 }}>Not enough history to generate a forecast yet.</p>
        ) : (
          <>
            <div
              style={{
                fontSize: 12,
                color: "var(--color-text-muted)",
                marginBottom: 12,
                background: "#f8fafc",
                padding: "6px 12px",
                borderRadius: 6,
                display: "inline-block",
              }}
            >
              Model: <strong style={{ textTransform: "capitalize" }}>{forecast.method.replace("_", " ")}</strong> · computed over {forecast.history_points_used} historical periods
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Target Period</th>
                  <th style={{ textAlign: "right" }}>Predicted {metric === "income" ? "Inflow" : "Outflow"}</th>
                </tr>
              </thead>
              <tbody>
                {forecast.forecast.map((f) => (
                  <tr key={f.period}>
                    <td style={{ fontWeight: 600 }}>🗓️ {f.period}</td>
                    <td
                      style={{
                        textAlign: "right",
                        fontWeight: 700,
                        color: metric === "income" ? "var(--color-success-text)" : "var(--color-danger-text)",
                      }}
                      className="tabular-nums"
                    >
                      {metric === "income" ? "+" : "-"}{formatCurrency(f.predicted_value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* Anomalies & AI Insights */}
      <div className="grid grid-2">
        {/* Anomaly Detection */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <IconAlertCircle size={18} color="var(--color-warning-text)" />
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Statistical Anomalies</h3>
          </div>
          {anomalyLoading ? (
            <Loader label="Auditing transaction deviations…" />
          ) : anomalyData.anomalies.length === 0 ? (
            <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 8, padding: 14 }}>
              <div style={{ fontWeight: 600, color: "#065f46", fontSize: 13.5 }}>✓ Clean Audit Record</div>
              <div style={{ color: "#047857", fontSize: 12.5, marginTop: 2 }}>
                All {anomalyData.total_checked} evaluated transactions fall within standard deviation thresholds.
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {anomalyData.anomalies.map((a) => {
                const conf = SEVERITY_CONFIG[a.severity] || { class: "badge-muted", label: a.severity };
                return (
                  <div
                    key={a.transaction_id}
                    style={{
                      background: "#fff1f2",
                      border: "1px solid #fecdd3",
                      borderRadius: 8,
                      padding: 12,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className={`badge ${conf.class}`}>
                        <span className="badge-dot" />
                        {conf.label}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{formatDate(a.transaction_date)}</span>
                    </div>
                    <p style={{ fontSize: 13, margin: "6px 0 0", color: "#9f1239", fontWeight: 500 }}>{a.reason}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* AI Financial Insights */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 16 }}>✨</span>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>AI Strategic Insights</h3>
          </div>
          {insightsLoading ? (
            <Loader label="Synthesizing strategic insights…" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {insightsData.insights.map((insight, idx) => {
                const conf = SEVERITY_CONFIG[insight.severity] || { class: "badge-muted", label: insight.severity };
                return (
                  <div
                    key={idx}
                    style={{
                      background: "#f8fafc",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                      padding: 14,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong style={{ fontSize: 13.5, color: "var(--color-text)" }}>{insight.title}</strong>
                      <span className={`badge ${conf.class}`}>
                        <span className="badge-dot" />
                        {conf.label}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, margin: "6px 0 0", color: "var(--color-text-muted)", lineHeight: 1.4 }}>
                      {insight.detail}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
