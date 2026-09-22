import { useFetch } from "../hooks/useFetch";
import { fetchDashboardSummary, fetchDashboardTrends } from "../services/dashboardService";
import { formatCurrency } from "../utils/formatCurrency";
import SummaryCard from "../components/dashboard/SummaryCard";
import RevenueChart from "../components/dashboard/RevenueChart";
import ExpenseChart from "../components/dashboard/ExpenseChart";
import CashFlowChart from "../components/dashboard/CashFlowChart";
import Loader from "../components/common/Loader";
import {
  IconArrowUpRight,
  IconArrowDownRight,
  IconWallet,
  IconInvoice,
  IconAnalytics,
  IconAlertCircle,
} from "../components/common/Icons";

export default function Dashboard() {
  const { data: summary, loading: summaryLoading } = useFetch(fetchDashboardSummary, []);
  const { data: trends, loading: trendsLoading } = useFetch(() => fetchDashboardTrends(6), []);

  if (summaryLoading || trendsLoading) return <Loader label="Compiling financial overview…" />;

  const todayFormatted = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Financial Dashboard</h1>
          <p>Real-time cash flow, profit metrics, and receivable status as of {todayFormatted}.</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              padding: "6px 12px",
              background: "#ffffff",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              color: "var(--color-text-secondary)",
              boxShadow: "var(--shadow-xs)",
            }}
          >
            🗓️ Period: Rolling 6 Months
          </span>
        </div>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <SummaryCard
          label="Total Revenue"
          value={formatCurrency(summary.total_revenue)}
          tone="success"
          icon={<IconArrowUpRight size={18} color="var(--color-success-text)" />}
          subtext="Total billed income"
        />
        <SummaryCard
          label="Total Expenses"
          value={formatCurrency(summary.total_expenses)}
          tone="danger"
          icon={<IconArrowDownRight size={18} color="var(--color-danger-text)" />}
          subtext="Recorded expenditures"
        />
        <SummaryCard
          label="Net Profit"
          value={formatCurrency(summary.net_profit)}
          tone={summary.net_profit >= 0 ? "success" : "danger"}
          icon={<IconAnalytics size={18} color={summary.net_profit >= 0 ? "var(--color-success-text)" : "var(--color-danger-text)"} />}
          subtext={summary.net_profit >= 0 ? "Profitable performance" : "Net operating loss"}
        />
        <SummaryCard
          label="Cash & Bank Balance"
          value={formatCurrency(summary.cash_balance)}
          tone="primary"
          icon={<IconWallet size={18} color="var(--color-primary)" />}
          subtext="Total liquid reserves"
        />
      </div>

      {/* Invoice Health Row */}
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <SummaryCard
          label="Outstanding Receivables"
          value={formatCurrency(summary.outstanding_invoices)}
          tone={summary.outstanding_invoices > 0 ? "warning" : "default"}
          icon={<IconInvoice size={18} color="var(--color-warning-text)" />}
          subtext={`${summary.outstanding_invoice_count} unpaid invoices`}
        />
        <SummaryCard
          label="Overdue Invoices"
          value={formatCurrency(summary.overdue_invoices)}
          tone={summary.overdue_invoices > 0 ? "danger" : "default"}
          icon={<IconAlertCircle size={18} color={summary.overdue_invoices > 0 ? "var(--color-danger-text)" : "var(--color-text-muted)"} />}
          subtext={`${summary.overdue_invoice_count} past due date`}
        />
        <SummaryCard
          label="Unpaid Count"
          value={summary.outstanding_invoice_count}
          subtext="Pending client settlement"
        />
        <SummaryCard
          label="Overdue Count"
          value={summary.overdue_invoice_count}
          tone={summary.overdue_invoice_count > 0 ? "danger" : "default"}
          subtext="Immediate follow-up required"
        />
      </div>

      {/* Trends & Visual Analytics */}
      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        <RevenueChart data={trends.revenue_trend} />
        <ExpenseChart data={trends.expense_trend} />
      </div>

      <div>
        <CashFlowChart data={trends.cash_flow_trend} />
      </div>
    </div>
  );
}
