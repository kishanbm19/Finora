from collections import defaultdict
from datetime import datetime, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.account import Account
from app.models.invoice import Invoice, InvoiceStatus
from app.models.transaction import Transaction, TransactionType
from app.schemas.dashboard import DashboardSummary, DashboardTrends, TrendPoint


def get_summary(db: Session, user_id: str) -> DashboardSummary:
    total_revenue = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0.0))
        .filter(Transaction.user_id == user_id, Transaction.type == TransactionType.INCOME)
        .scalar()
    )
    total_expenses = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0.0))
        .filter(Transaction.user_id == user_id, Transaction.type == TransactionType.EXPENSE)
        .scalar()
    )
    cash_balance = (
        db.query(func.coalesce(func.sum(Account.balance), 0.0)).filter(Account.user_id == user_id).scalar()
    )

    outstanding_statuses = [InvoiceStatus.SENT, InvoiceStatus.OVERDUE]
    outstanding_invoices_q = db.query(Invoice).filter(
        Invoice.user_id == user_id, Invoice.status.in_(outstanding_statuses)
    )
    overdue_invoices_q = db.query(Invoice).filter(Invoice.user_id == user_id, Invoice.status == InvoiceStatus.OVERDUE)

    outstanding_amount = sum(inv.amount for inv in outstanding_invoices_q.all())
    overdue_amount = sum(inv.amount for inv in overdue_invoices_q.all())

    return DashboardSummary(
        total_revenue=round(total_revenue, 2),
        total_expenses=round(total_expenses, 2),
        net_profit=round(total_revenue - total_expenses, 2),
        cash_balance=round(cash_balance, 2),
        outstanding_invoices=round(outstanding_amount, 2),
        overdue_invoices=round(overdue_amount, 2),
        outstanding_invoice_count=outstanding_invoices_q.count(),
        overdue_invoice_count=overdue_invoices_q.count(),
    )


def _monthly_series(rows: list[tuple], months: int) -> list[TrendPoint]:
    buckets: dict[str, float] = defaultdict(float)
    for tx_date, amount in rows:
        key = tx_date.strftime("%Y-%m") if hasattr(tx_date, "strftime") else str(tx_date)[:7]
        buckets[key] += amount

    now = datetime.now(timezone.utc)
    ordered_keys = []
    year, month = now.year, now.month
    for _ in range(months):
        ordered_keys.append(f"{year:04d}-{month:02d}")
        month -= 1
        if month == 0:
            month = 12
            year -= 1
    ordered_keys.reverse()

    return [TrendPoint(period=k, value=round(buckets.get(k, 0.0), 2)) for k in ordered_keys]


def get_trends(db: Session, user_id: str, months: int = 6) -> DashboardTrends:
    income_rows = (
        db.query(Transaction.transaction_date, Transaction.amount)
        .filter(Transaction.user_id == user_id, Transaction.type == TransactionType.INCOME)
        .all()
    )
    expense_rows = (
        db.query(Transaction.transaction_date, Transaction.amount)
        .filter(Transaction.user_id == user_id, Transaction.type == TransactionType.EXPENSE)
        .all()
    )

    revenue_trend = _monthly_series(income_rows, months)
    expense_trend = _monthly_series(expense_rows, months)

    cash_flow_trend = [
        TrendPoint(period=r.period, value=round(r.value - e.value, 2))
        for r, e in zip(revenue_trend, expense_trend)
    ]

    return DashboardTrends(revenue_trend=revenue_trend, expense_trend=expense_trend, cash_flow_trend=cash_flow_trend)
