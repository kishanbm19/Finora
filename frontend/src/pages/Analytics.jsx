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

const SEVERITY_BADGE = {
  info: "badge-muted",
  warning: "badge-warning",
  critical: "badge-danger",
};

export default function Analytics() {
  const [metric, setMetric] = useState("income");

  const { data: summary, loading: summaryLoading } = useFetch(fetchAnalyticsSummary, []);
  const { data: forecast, loading: forecastLoading } = useFetch(() => fetchForecast(metric, 3), [metric]);
  const { data: anomalyData, loading: anomalyLoading } = useFetch(fetchAnomalies, []);
  const { data: insightsData, loading: insightsLoading } = useFetch(fetchInsights, []);

  if (summaryLoading) return <Loader />;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Analytics</h1>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <SummaryCard
          label="Revenue Growth (MoM)"
          value={`${summary.revenue_growth_pct}%`}
          tone={summary.revenue_growth_pct >= 0 ? "success" : "danger"}
        />
        <SummaryCard
          label="Expense Growth (MoM)"
          value={`${summary.expense_growth_pct}%`}
          tone={summary.expense_growth_pct <= 0 ? "success" : "danger"}
        />
        <SummaryCard
          label="Profit Margin"
          value={`${summary.profit_margin_pct}%`}
          tone={summary.profit_margin_pct >= 10 ? "success" : "danger"}
        />
        <SummaryCard label="Categories Tracked" value={Object.keys(summary.expense_by_category).length} />
      </div>

      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <h3 style={{ marginTop: 0, fontSize: 15 }}>Expense by Category</h3>
          {Object.keys(summary.expense_by_category).length === 0 ? (
            <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>No expense data yet.</p>
          ) : (
            <table className="table">
              <tbody>
                {Object.entries(summary.expense_by_category).map(([category, amount]) => (
                  <tr key={category}>
                    <td>{category}</td>
                    <td>{formatCurrency(amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0, fontSize: 15 }}>Top Customers by Revenue</h3>
          {summary.top_customers_by_revenue.length === 0 ? (
            <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>No paid invoices yet.</p>
          ) : (
            <table className="table">
              <tbody>
                {summary.top_customers_by_revenue.map((c) => (
                  <tr key={c.name}>
                    <td>{c.name}</td>
                    <td>{formatCurrency(c.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <h3 style={{ margin: 0, fontSize: 15 }}>Forecast (next 3 months)</h3>
          <select className="input" style={{ width: 140 }} value={metric} onChange={(e) => setMetric(e.target.value)}>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
        {forecastLoading ? (
          <Loader />
        ) : forecast.forecast.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>Not enough history to forecast yet.</p>
        ) : (
          <>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 0 }}>
              Method: {forecast.method.replace("_", " ")} · based on {forecast.history_points_used} months of history
            </p>
            <table className="table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Predicted {metric}</th>
                </tr>
              </thead>
              <tbody>
                {forecast.forecast.map((f) => (
                  <tr key={f.period}>
                    <td>{f.period}</td>
                    <td>{formatCurrency(f.predicted_value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 style={{ marginTop: 0, fontSize: 15 }}>Anomaly Detection</h3>
          {anomalyLoading ? (
            <Loader />
          ) : anomalyData.anomalies.length === 0 ? (
            <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>
              No unusual transactions detected ({anomalyData.total_checked} checked).
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {anomalyData.anomalies.map((a) => (
                <div key={a.transaction_id} style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span className={`badge ${SEVERITY_BADGE[a.severity]}`}>{a.severity}</span>
                    <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>{formatDate(a.transaction_date)}</span>
                  </div>
                  <p style={{ fontSize: 13, margin: "6px 0 0" }}>{a.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0, fontSize: 15 }}>AI Financial Insights</h3>
          {insightsLoading ? (
            <Loader />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {insightsData.insights.map((insight, idx) => (
                <div key={idx} style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ fontSize: 14 }}>{insight.title}</strong>
                    <span className={`badge ${SEVERITY_BADGE[insight.severity]}`}>{insight.severity}</span>
                  </div>
                  <p style={{ fontSize: 13, margin: "6px 0 0", color: "var(--color-text-muted)" }}>{insight.detail}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
