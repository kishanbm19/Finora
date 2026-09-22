import { useState } from "react";
import { fetchProfitAndLoss } from "../services/dashboardService";
import { formatCurrency } from "../utils/formatCurrency";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Loader from "../components/common/Loader";
import SummaryCard from "../components/dashboard/SummaryCard";
import { IconArrowUpRight, IconArrowDownRight, IconAnalytics } from "../components/common/Icons";

function firstDayOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
}

function today() {
  return new Date().toISOString().split("T")[0];
}

export default function Reports() {
  const [start, setStart] = useState(firstDayOfMonth());
  const [end, setEnd] = useState(today());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await fetchProfitAndLoss(start, end);
      setReport(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not generate financial report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Financial Reports</h1>
          <p>Generate formal Profit &amp; Loss statements across customizable date intervals.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginTop: 0, fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
          Generate Profit &amp; Loss Statement
        </h3>
        <form onSubmit={handleGenerate} style={{ display: "flex", gap: 14, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <Input label="Start Date" type="date" value={start} onChange={(e) => setStart(e.target.value)} required />
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <Input label="End Date" type="date" value={end} onChange={(e) => setEnd(e.target.value)} required />
          </div>
          <Button type="submit" disabled={loading} style={{ marginBottom: 16, height: 42 }}>
            {loading ? "Generating…" : "Run Report"}
          </Button>
        </form>
        {error && <p className="error-text">{error}</p>}
      </div>

      {loading && <Loader label="Compiling statement figures…" />}

      {report && !loading && (
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Statement of Operations</h3>
              <p style={{ color: "var(--color-text-muted)", fontSize: 13, margin: "2px 0 0" }}>
                Reporting Window: <strong>{report.period_start}</strong> through <strong>{report.period_end}</strong>
              </p>
            </div>
            <span className="badge badge-info">
              <span className="badge-dot" /> Audit Certified
            </span>
          </div>

          <div className="grid grid-3" style={{ marginBottom: 24 }}>
            <SummaryCard
              label="Operating Inflow"
              value={`+${formatCurrency(report.total_income)}`}
              tone="success"
              icon={<IconArrowUpRight size={18} color="var(--color-success-text)" />}
              subtext="Total revenue received"
            />
            <SummaryCard
              label="Operating Outflow"
              value={`-${formatCurrency(report.total_expenses)}`}
              tone="danger"
              icon={<IconArrowDownRight size={18} color="var(--color-danger-text)" />}
              subtext="Direct &amp; overhead expenses"
            />
            <SummaryCard
              label="Net Operational Income"
              value={`${report.net_profit >= 0 ? "+" : ""}${formatCurrency(report.net_profit)}`}
              tone={report.net_profit >= 0 ? "success" : "danger"}
              icon={<IconAnalytics size={18} />}
              subtext={report.net_profit >= 0 ? "Net surplus" : "Net operating deficit"}
            />
          </div>

          <h4 style={{ margin: "20px 0 12px 0", fontSize: 15, fontWeight: 700 }}>Categorical Outflow Breakdown</h4>
          {Object.keys(report.expense_breakdown).length === 0 ? (
            <div style={{ padding: "16px 0", color: "var(--color-text-muted)", fontSize: 13.5 }}>
              No expenses recorded in this period.
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Expense Category</th>
                    <th style={{ textAlign: "right" }}>Percentage of Outflow</th>
                    <th style={{ textAlign: "right" }}>Subtotal Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(report.expense_breakdown).map(([category, amount]) => {
                    const pct = report.total_expenses > 0 ? ((amount / report.total_expenses) * 100).toFixed(1) : "0.0";
                    return (
                      <tr key={category}>
                        <td style={{ textTransform: "capitalize", fontWeight: 600 }}>{category}</td>
                        <td style={{ textAlign: "right", color: "var(--color-text-muted)" }}>{pct}%</td>
                        <td style={{ textAlign: "right", fontWeight: 700, color: "var(--color-danger-text)" }} className="tabular-nums">
                          -{formatCurrency(amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
