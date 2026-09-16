from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database.connection import get_db
from app.ml.anomaly_detection import TransactionRecord, detect_anomalies
from app.ml.forecasting import forecast_series
from app.models.customer import Customer
from app.models.invoice import Invoice, InvoiceStatus
from app.models.transaction import Transaction, TransactionType
from app.models.user import User
from app.schemas.dashboard import (
    AnalyticsSummary,
    AnomalyResponse,
    ForecastResponse,
    InsightItem,
    InsightsResponse,
)

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics"])


def _sum_amount(db: Session, user_id: str, type_: TransactionType, year: int, month: int | None = None) -> float:
    query = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
        Transaction.user_id == user_id,
        Transaction.type == type_,
        func.strftime("%Y", Transaction.transaction_date) == str(year),
    )
    if month:
        query = query.filter(func.strftime("%m", Transaction.transaction_date) == f"{month:02d}")
    return query.scalar() or 0.0


@router.get("/summary", response_model=AnalyticsSummary)
def analytics_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    this_month_rev = _sum_amount(db, current_user.id, TransactionType.INCOME, now.year, now.month)
    prev_month = now.month - 1 or 12
    prev_year = now.year if now.month > 1 else now.year - 1
    last_month_rev = _sum_amount(db, current_user.id, TransactionType.INCOME, prev_year, prev_month)

    this_month_exp = _sum_amount(db, current_user.id, TransactionType.EXPENSE, now.year, now.month)
    last_month_exp = _sum_amount(db, current_user.id, TransactionType.EXPENSE, prev_year, prev_month)

    def pct_change(current: float, previous: float) -> float:
        if previous == 0:
            return 100.0 if current > 0 else 0.0
        return round(((current - previous) / previous) * 100, 2)

    total_income = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0.0))
        .filter(Transaction.user_id == current_user.id, Transaction.type == TransactionType.INCOME)
        .scalar()
    )
    total_expense = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0.0))
        .filter(Transaction.user_id == current_user.id, Transaction.type == TransactionType.EXPENSE)
        .scalar()
    )
    profit_margin = round(((total_income - total_expense) / total_income) * 100, 2) if total_income else 0.0

    expense_rows = (
        db.query(Transaction.category, func.sum(Transaction.amount))
        .filter(Transaction.user_id == current_user.id, Transaction.type == TransactionType.EXPENSE)
        .group_by(Transaction.category)
        .all()
    )
    expense_by_category = {category: round(total, 2) for category, total in expense_rows}

    top_customers_rows = (
        db.query(Customer.name, func.coalesce(func.sum(Invoice.amount), 0.0).label("revenue"))
        .join(Invoice, Invoice.customer_id == Customer.id)
        .filter(Customer.user_id == current_user.id, Invoice.status == InvoiceStatus.PAID)
        .group_by(Customer.name)
        .order_by(func.sum(Invoice.amount).desc())
        .limit(5)
        .all()
    )
    top_customers = [{"name": name, "revenue": round(revenue, 2)} for name, revenue in top_customers_rows]

    return AnalyticsSummary(
        revenue_growth_pct=pct_change(this_month_rev, last_month_rev),
        expense_growth_pct=pct_change(this_month_exp, last_month_exp),
        profit_margin_pct=profit_margin,
        expense_by_category=expense_by_category,
        top_customers_by_revenue=top_customers,
    )


@router.get("/forecast", response_model=ForecastResponse)
def forecast(
    metric: TransactionType = Query(default=TransactionType.INCOME),
    periods_ahead: int = Query(default=3, ge=1, le=12),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (
        db.query(Transaction.transaction_date, Transaction.amount)
        .filter(Transaction.user_id == current_user.id, Transaction.type == metric)
        .all()
    )
    result = forecast_series(rows, periods_ahead)
    return ForecastResponse(
        metric=metric.value,
        method=result["method"],
        history_points_used=result["history_points_used"],
        forecast=result["forecast"],
    )


@router.get("/anomalies", response_model=AnomalyResponse)
def anomalies(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    transactions = (
        db.query(Transaction)
        .filter(Transaction.user_id == current_user.id, Transaction.type == TransactionType.EXPENSE)
        .all()
    )
    records = [
        TransactionRecord(
            id=t.id,
            amount=t.amount,
            category=t.category,
            transaction_date=t.transaction_date.isoformat(),
        )
        for t in transactions
    ]
    found = detect_anomalies(records)
    return AnomalyResponse(anomalies=found, total_checked=len(records))


@router.get("/insights", response_model=InsightsResponse)
def insights(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Rule-based financial insights derived from analytics + ML output.
    This is the deterministic backbone that a real LLM call can later
    enrich into natural-language narrative (see docs/architecture.md).
    """
    summary = analytics_summary(db, current_user)  # type: ignore[arg-type]
    items: list[InsightItem] = []

    if summary.revenue_growth_pct < 0:
        items.append(
            InsightItem(
                title="Revenue is declining",
                detail=f"Revenue is down {abs(summary.revenue_growth_pct)}% compared to last month.",
                severity="warning",
            )
        )
    elif summary.revenue_growth_pct > 10:
        items.append(
            InsightItem(
                title="Strong revenue growth",
                detail=f"Revenue grew {summary.revenue_growth_pct}% compared to last month.",
                severity="info",
            )
        )

    if summary.expense_growth_pct > 15:
        items.append(
            InsightItem(
                title="Expenses rising quickly",
                detail=f"Expenses increased {summary.expense_growth_pct}% compared to last month.",
                severity="warning",
            )
        )

    if summary.profit_margin_pct < 10:
        items.append(
            InsightItem(
                title="Thin profit margin",
                detail=f"Current profit margin is {summary.profit_margin_pct}%, which is quite low.",
                severity="critical" if summary.profit_margin_pct < 0 else "warning",
            )
        )

    if not items:
        items.append(
            InsightItem(
                title="Financials look stable",
                detail="No major warning signs detected in revenue, expenses, or margin this period.",
                severity="info",
            )
        )

    return InsightsResponse(insights=items)
