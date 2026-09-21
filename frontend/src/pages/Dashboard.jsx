import { useFetch } from "../hooks/useFetch";
import { fetchDashboardSummary, fetchDashboardTrends } from "../services/dashboardService";
import { formatCurrency } from "../utils/formatCurrency";
import SummaryCard from "../components/dashboard/SummaryCard";
import RevenueChart from "../components/dashboard/RevenueChart";
import ExpenseChart from "../components/dashboard/ExpenseChart";
import CashFlowChart from "../components/dashboard/CashFlowChart";
import Loader from "../components/common/Loader";

export default function Dashboard() {
  const { data: summary, loading: summaryLoading } = useFetch(fetchDashboardSummary, []);
  const { data: trends, loading: trendsLoading } = useFetch(() => fetchDashboardTrends(6), []);

  if (summaryLoading || trendsLoading) return <Loader />;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <SummaryCard label="Total Revenue" value={formatCurrency(summary.total_revenue)} tone="success" />
        <SummaryCard label="Total Expenses" value={formatCurrency(summary.total_expenses)} tone="danger" />
        <SummaryCard
          label="Net Profit"
          value={formatCurrency(summary.net_profit)}
          tone={summary.net_profit >= 0 ? "success" : "danger"}
        />
        <SummaryCard label="Net Balance" value={formatCurrency(summary.cash_balance)} />
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <SummaryCard label="Outstanding Invoices" value={formatCurrency(summary.outstanding_invoices)} />
        <SummaryCard
          label="Overdue Invoices"
          value={formatCurrency(summary.overdue_invoices)}
          tone={summary.overdue_invoices > 0 ? "danger" : "default"}
        />
        <SummaryCard label="Outstanding Count" value={summary.outstanding_invoice_count} />
        <SummaryCard label="Overdue Count" value={summary.overdue_invoice_count} />
      </div>

      <div className="grid grid-2">
        <RevenueChart data={trends.revenue_trend} />
        <ExpenseChart data={trends.expense_trend} />
      </div>

      <div style={{ marginTop: 16 }}>
        <CashFlowChart data={trends.cash_flow_trend} />
      </div>
    </div>
  );
}
