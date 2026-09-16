from datetime import date

from sqlalchemy.orm import Session

from app.models.expense import Expense
from app.models.transaction import Transaction, TransactionType


def profit_and_loss_report(db: Session, user_id: str, start: date, end: date) -> dict:
    """Builds a simple Profit & Loss statement for the given date range."""
    income = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == user_id,
            Transaction.type == TransactionType.INCOME,
            Transaction.transaction_date >= start,
            Transaction.transaction_date <= end,
        )
        .all()
    )
    expense_transactions = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == user_id,
            Transaction.type == TransactionType.EXPENSE,
            Transaction.transaction_date >= start,
            Transaction.transaction_date <= end,
        )
        .all()
    )
    standalone_expenses = (
        db.query(Expense)
        .filter(Expense.user_id == user_id, Expense.expense_date >= start, Expense.expense_date <= end)
        .all()
    )

    total_income = sum(t.amount for t in income)
    total_expenses = sum(t.amount for t in expense_transactions) + sum(e.amount for e in standalone_expenses)

    by_category: dict[str, float] = {}
    for t in expense_transactions:
        by_category[t.category] = by_category.get(t.category, 0.0) + t.amount
    for e in standalone_expenses:
        by_category[e.category] = by_category.get(e.category, 0.0) + e.amount

    return {
        "period_start": start.isoformat(),
        "period_end": end.isoformat(),
        "total_income": round(total_income, 2),
        "total_expenses": round(total_expenses, 2),
        "net_profit": round(total_income - total_expenses, 2),
        "expense_breakdown": {k: round(v, 2) for k, v in by_category.items()},
    }
