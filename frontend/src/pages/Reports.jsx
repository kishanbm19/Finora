import { useState } from "react";
import { fetchProfitAndLoss } from "../services/dashboardService";
import { formatCurrency } from "../utils/formatCurrency";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Loader from "../components/common/Loader";

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
      setError(err.response?.data?.detail || "Could not generate report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Reports</h1>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginTop: 0, fontSize: 15 }}>Profit &amp; Loss Statement</h3>
        <form onSubmit={handleGenerate} style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <Input label="Start Date" type="date" value={start} onChange={(e) => setStart(e.target.value)} required />
          <Input label="End Date" type="date" value={end} onChange={(e) => setEnd(e.target.value)} required />
          <Button type="submit" disabled={loading} style={{ marginBottom: 14 }}>
            {loading ? "Generating…" : "Generate Report"}
          </Button>
        </form>
        {error && <p className="error-text">{error}</p>}
      </div>

      {loading && <Loader />}

      {report && !loading && (
        <div className="card">
          <p style={{ color: "var(--color-text-muted)", fontSize: 13, marginTop: 0 }}>
            Period: {report.period_start} to {report.period_end}
          </p>

          <div className="grid grid-4" style={{ marginBottom: 20 }}>
            <div className="summary-card">
              <div className="label">Total Income</div>
              <div className="value" style={{ color: "var(--color-success)" }}>
                {formatCurrency(report.total_income)}
              </div>
            </div>
            <div className="summary-card">
              <div className="label">Total Expenses</div>
              <div className="value" style={{ color: "var(--color-danger)" }}>
                {formatCurrency(report.total_expenses)}
              </div>
            </div>
            <div className="summary-card">
              <div className="label">Net Profit</div>
              <div className="value" style={{ color: report.net_profit >= 0 ? "var(--color-success)" : "var(--color-danger)" }}>
                {formatCurrency(report.net_profit)}
              </div>
            </div>
          </div>

          <h4 style={{ marginBottom: 8 }}>Expense Breakdown</h4>
          {Object.keys(report.expense_breakdown).length === 0 ? (
            <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>No expenses recorded in this period.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(report.expense_breakdown).map(([category, amount]) => (
                  <tr key={category}>
                    <td>{category}</td>
                    <td>{formatCurrency(amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
