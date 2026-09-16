from pydantic import BaseModel


class DashboardSummary(BaseModel):
    total_revenue: float
    total_expenses: float
    net_profit: float
    cash_balance: float
    outstanding_invoices: float
    overdue_invoices: float
    outstanding_invoice_count: int
    overdue_invoice_count: int


class TrendPoint(BaseModel):
    period: str  # e.g. "2026-01"
    value: float


class DashboardTrends(BaseModel):
    revenue_trend: list[TrendPoint]
    expense_trend: list[TrendPoint]
    cash_flow_trend: list[TrendPoint]


class AnalyticsSummary(BaseModel):
    revenue_growth_pct: float
    expense_growth_pct: float
    profit_margin_pct: float
    expense_by_category: dict[str, float]
    top_customers_by_revenue: list[dict]


class ForecastPoint(BaseModel):
    period: str
    predicted_value: float


class ForecastResponse(BaseModel):
    metric: str
    method: str
    history_points_used: int
    forecast: list[ForecastPoint]


class AnomalyItem(BaseModel):
    transaction_id: str
    amount: float
    category: str
    transaction_date: str
    reason: str
    severity: str


class AnomalyResponse(BaseModel):
    anomalies: list[AnomalyItem]
    total_checked: int


class InsightItem(BaseModel):
    title: str
    detail: str
    severity: str  # info | warning | critical


class InsightsResponse(BaseModel):
    insights: list[InsightItem]
