"""
Finora Financial Tools for AI Assistant.
Provides backend functions to query user financial data and tool definitions for LLMs.
ALL tools strictly require and enforce the authenticated user_id.
All currency metrics are in Indian Rupees (INR, ₹).
Uses database-agnostic date range queries compatible with SQLite, PostgreSQL, and MySQL.
"""
import calendar
from datetime import date, datetime, timezone
from typing import Any
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.account import Account
from app.models.invoice import Invoice, InvoiceStatus
from app.models.transaction import Transaction, TransactionType
from app.services import dashboard_service
from app.ml.forecasting import forecast_series
from app.ml.anomaly_detection import TransactionRecord, detect_anomalies


def get_account_balances(db: Session, user_id: str) -> dict[str, Any]:
    """Retrieve all account balances and total cash balance for the user in INR (₹)."""
    accounts = db.query(Account).filter(Account.user_id == user_id).all()
    account_list = [
        {
            "id": a.id,
            "name": a.name,
            "account_type": a.account_type.value if hasattr(a.account_type, "value") else str(a.account_type),
            "balance": round(a.balance, 2),
            "currency": a.currency or "INR",
        }
        for a in accounts
    ]
    total_balance = sum(a["balance"] for a in account_list)
    return {
        "accounts": account_list,
        "total_cash_balance": round(total_balance, 2),
        "currency": "INR",
        "currency_symbol": "₹",
        "account_count": len(account_list),
    }


def get_monthly_income(db: Session, user_id: str, year: int | None = None, month: int | None = None) -> dict[str, Any]:
    """Retrieve total income for a specified month, comparing with previous month using date range filters."""
    now = datetime.now(timezone.utc)
    target_year = year or now.year
    target_month = month or now.month

    # Current month date bounds
    start_date = date(target_year, target_month, 1)
    _, last_day = calendar.monthrange(target_year, target_month)
    end_date = date(target_year, target_month, last_day)

    current_income = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0.0))
        .filter(
            Transaction.user_id == user_id,
            Transaction.type == TransactionType.INCOME,
            Transaction.transaction_date >= start_date,
            Transaction.transaction_date <= end_date,
        )
        .scalar()
        or 0.0
    )

    # Previous month date bounds
    prev_m = target_month - 1 or 12
    prev_y = target_year if target_month > 1 else target_year - 1
    prev_start = date(prev_y, prev_m, 1)
    _, prev_last_day = calendar.monthrange(prev_y, prev_m)
    prev_end = date(prev_y, prev_m, prev_last_day)

    prev_income = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0.0))
        .filter(
            Transaction.user_id == user_id,
            Transaction.type == TransactionType.INCOME,
            Transaction.transaction_date >= prev_start,
            Transaction.transaction_date <= prev_end,
        )
        .scalar()
        or 0.0
    )

    diff = current_income - prev_income
    pct_change = (
        round((diff / prev_income) * 100, 2)
        if prev_income > 0
        else (100.0 if current_income > 0 else 0.0)
    )

    return {
        "period": f"{target_year}-{target_month:02d}",
        "income": round(current_income, 2),
        "currency": "INR",
        "currency_symbol": "₹",
        "previous_month_period": f"{prev_y}-{prev_m:02d}",
        "previous_month_income": round(prev_income, 2),
        "change_amount": round(diff, 2),
        "change_percentage": pct_change,
    }


def get_monthly_expenses(db: Session, user_id: str, year: int | None = None, month: int | None = None) -> dict[str, Any]:
    """Retrieve total expenses for a specified month from Transactions, comparing with previous month."""
    now = datetime.now(timezone.utc)
    target_year = year or now.year
    target_month = month or now.month

    start_date = date(target_year, target_month, 1)
    _, last_day = calendar.monthrange(target_year, target_month)
    end_date = date(target_year, target_month, last_day)

    current_expenses = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0.0))
        .filter(
            Transaction.user_id == user_id,
            Transaction.type == TransactionType.EXPENSE,
            Transaction.transaction_date >= start_date,
            Transaction.transaction_date <= end_date,
        )
        .scalar()
        or 0.0
    )

    prev_m = target_month - 1 or 12
    prev_y = target_year if target_month > 1 else target_year - 1
    prev_start = date(prev_y, prev_m, 1)
    _, prev_last_day = calendar.monthrange(prev_y, prev_m)
    prev_end = date(prev_y, prev_m, prev_last_day)

    prev_expenses = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0.0))
        .filter(
            Transaction.user_id == user_id,
            Transaction.type == TransactionType.EXPENSE,
            Transaction.transaction_date >= prev_start,
            Transaction.transaction_date <= prev_end,
        )
        .scalar()
        or 0.0
    )

    diff = current_expenses - prev_expenses
    pct_change = (
        round((diff / prev_expenses) * 100, 2)
        if prev_expenses > 0
        else (100.0 if current_expenses > 0 else 0.0)
    )

    return {
        "period": f"{target_year}-{target_month:02d}",
        "expenses": round(current_expenses, 2),
        "currency": "INR",
        "currency_symbol": "₹",
        "previous_month_period": f"{prev_y}-{prev_m:02d}",
        "previous_month_expenses": round(prev_expenses, 2),
        "change_amount": round(diff, 2),
        "change_percentage": pct_change,
    }


def get_cash_flow(db: Session, user_id: str, months: int = 6) -> dict[str, Any]:
    """Retrieve multi-month cash flow trends (revenue, expense, and net cash flow in INR)."""
    trends = dashboard_service.get_trends(db, user_id, months=months)
    return {
        "months": months,
        "currency": "INR",
        "currency_symbol": "₹",
        "revenue_trend": [{"period": p.period, "amount": p.value} for p in trends.revenue_trend],
        "expense_trend": [{"period": p.period, "amount": p.value} for p in trends.expense_trend],
        "net_cash_flow": [{"period": p.period, "net": p.value} for p in trends.cash_flow_trend],
    }


def get_transaction_summary(
    db: Session,
    user_id: str,
    limit: int = 10,
    type: str | None = None,
    category: str | None = None,
) -> dict[str, Any]:
    """Retrieve recent transactions and overall ledger totals in INR."""
    query = db.query(Transaction).filter(Transaction.user_id == user_id)

    if type:
        t_clean = type.strip().lower()
        if t_clean in ("income", "expense", "transfer"):
            query = query.filter(Transaction.type == TransactionType(t_clean))

    if category:
        query = query.filter(func.lower(Transaction.category) == category.strip().lower())

    recent_txs = (
        query.order_by(Transaction.transaction_date.desc(), Transaction.created_at.desc())
        .limit(limit)
        .all()
    )

    summary = dashboard_service.get_summary(db, user_id)

    formatted_txs = [
        {
            "id": t.id,
            "date": str(t.transaction_date),
            "type": t.type.value if hasattr(t.type, "value") else str(t.type),
            "category": t.category,
            "amount": round(t.amount, 2),
            "currency": "INR",
            "description": t.description,
            "account": t.account_name,
            "customer": t.customer_name,
        }
        for t in recent_txs
    ]

    return {
        "recent_transactions": formatted_txs,
        "total_revenue": summary.total_revenue,
        "total_expenses": summary.total_expenses,
        "net_profit": summary.net_profit,
        "currency": "INR",
        "currency_symbol": "₹",
    }


def get_top_expense_categories(db: Session, user_id: str, limit: int = 5) -> dict[str, Any]:
    """Retrieve the highest expense categories in INR based on Transaction records."""
    rows = (
        db.query(Transaction.category, func.sum(Transaction.amount).label("total"))
        .filter(Transaction.user_id == user_id, Transaction.type == TransactionType.EXPENSE)
        .group_by(Transaction.category)
        .order_by(func.sum(Transaction.amount).desc())
        .limit(limit)
        .all()
    )
    categories = [{"category": category, "amount": round(total, 2)} for category, total in rows]
    total_spent = sum(c["amount"] for c in categories)
    return {
        "top_categories": categories,
        "top_categories_total": round(total_spent, 2),
        "currency": "INR",
        "currency_symbol": "₹",
    }


def get_overdue_invoices(db: Session, user_id: str) -> dict[str, Any]:
    """Retrieve list of overdue invoices with customer details in INR."""
    today = datetime.now(timezone.utc).date()
    invoices = (
        db.query(Invoice)
        .filter(
            Invoice.user_id == user_id,
            (Invoice.status == InvoiceStatus.OVERDUE) | ((Invoice.status == InvoiceStatus.SENT) & (Invoice.due_date < today)),
        )
        .order_by(Invoice.due_date.asc())
        .all()
    )

    items = [
        {
            "id": inv.id,
            "invoice_number": inv.invoice_number,
            "customer_name": inv.customer.name if inv.customer else "Unknown",
            "amount": round(inv.amount, 2),
            "currency": "INR",
            "due_date": str(inv.due_date),
            "status": "overdue",
        }
        for inv in invoices
    ]
    return {
        "overdue_invoices": items,
        "total_overdue_amount": round(sum(inv["amount"] for inv in items), 2),
        "overdue_count": len(items),
        "currency": "INR",
        "currency_symbol": "₹",
    }


def get_invoice_summary(db: Session, user_id: str) -> dict[str, Any]:
    """Retrieve high-level summary of invoices in INR (outstanding, overdue, paid)."""
    summary = dashboard_service.get_summary(db, user_id)
    return {
        "outstanding_receivables": summary.outstanding_invoices,
        "outstanding_count": summary.outstanding_invoice_count,
        "overdue_amount": summary.overdue_invoices,
        "overdue_count": summary.overdue_invoice_count,
        "currency": "INR",
        "currency_symbol": "₹",
    }


def get_financial_forecast(db: Session, user_id: str, metric: str = "income", periods_ahead: int = 3) -> dict[str, Any]:
    """Forecast future monthly revenue or expenses using ML forecasting."""
    metric_str = (metric or "").strip().lower()
    is_expense = any(w in metric_str for w in ["expense", "cost", "spend"])
    tx_type = TransactionType.EXPENSE if is_expense else TransactionType.INCOME
    
    rows = (
        db.query(Transaction.transaction_date, Transaction.amount)
        .filter(Transaction.user_id == user_id, Transaction.type == tx_type)
        .all()
    )
    result = forecast_series(rows, periods_ahead=periods_ahead)
    return {
        "metric": "expense" if is_expense else "income",
        "periods_ahead": periods_ahead,
        "method": result.get("method"),
        "history_points_used": result.get("history_points_used", 0),
        "forecast": result.get("forecast", []),
        "currency": "INR",
        "currency_symbol": "₹",
    }


def get_anomalies(db: Session, user_id: str) -> dict[str, Any]:
    """Detect unusual or anomalous expense transactions in INR."""
    transactions = (
        db.query(Transaction)
        .filter(Transaction.user_id == user_id, Transaction.type == TransactionType.EXPENSE)
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
    anomalies_found = detect_anomalies(records)
    return {
        "total_transactions_checked": len(records),
        "anomalies_detected": anomalies_found,
        "anomaly_count": len(anomalies_found),
        "currency": "INR",
        "currency_symbol": "₹",
    }


# Map tool name string to python function
TOOL_REGISTRY = {
    "get_account_balances": get_account_balances,
    "get_monthly_income": get_monthly_income,
    "get_monthly_expenses": get_monthly_expenses,
    "get_cash_flow": get_cash_flow,
    "get_transaction_summary": get_transaction_summary,
    "get_top_expense_categories": get_top_expense_categories,
    "get_overdue_invoices": get_overdue_invoices,
    "get_invoice_summary": get_invoice_summary,
    "get_financial_forecast": get_financial_forecast,
    "get_anomalies": get_anomalies,
}


def execute_tool(name: str, args: dict[str, Any], db: Session, user_id: str) -> dict[str, Any]:
    """Execute a financial tool strictly with the authenticated user_id."""
    func = TOOL_REGISTRY.get(name)
    if not func:
        return {"error": f"Tool '{name}' not found"}
    try:
        safe_args = {k: v for k, v in args.items() if k not in ("db", "user_id")}
        return func(db=db, user_id=user_id, **safe_args)
    except Exception as e:
        return {"error": f"Tool execution failed: {str(e)}"}


# OpenAI function calling definitions
OPENAI_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_account_balances",
            "description": "Get balances in Indian Rupees (₹) for all user accounts and current total cash balance.",
            "parameters": {
                "type": "object",
                "properties": {},
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_monthly_income",
            "description": "Get total income in Indian Rupees (₹) for a specific month with comparison to previous month.",
            "parameters": {
                "type": "object",
                "properties": {
                    "year": {"type": "integer", "description": "4-digit year, e.g. 2026. Defaults to current year."},
                    "month": {"type": "integer", "description": "Month number 1-12. Defaults to current month."},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_monthly_expenses",
            "description": "Get total expenses in Indian Rupees (₹) for a specific month with comparison to previous month.",
            "parameters": {
                "type": "object",
                "properties": {
                    "year": {"type": "integer", "description": "4-digit year, e.g. 2026. Defaults to current year."},
                    "month": {"type": "integer", "description": "Month number 1-12. Defaults to current month."},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_cash_flow",
            "description": "Get monthly revenue, expenses, and net cash flow trends in Indian Rupees (₹) over recent months.",
            "parameters": {
                "type": "object",
                "properties": {
                    "months": {"type": "integer", "description": "Number of past months to retrieve (e.g. 6)."},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_transaction_summary",
            "description": "Get recent transactions and ledger totals in Indian Rupees (₹).",
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {"type": "integer", "description": "Number of recent transactions to return. Default 10."},
                    "type": {"type": "string", "enum": ["income", "expense", "transfer"], "description": "Filter by transaction type."},
                    "category": {"type": "string", "description": "Filter by transaction category."},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_top_expense_categories",
            "description": "Get top expense categories and amounts spent in Indian Rupees (₹).",
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {"type": "integer", "description": "Maximum number of categories to return. Default 5."},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_overdue_invoices",
            "description": "Get list of overdue invoices in Indian Rupees (₹) with customer names and due dates.",
            "parameters": {
                "type": "object",
                "properties": {},
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_invoice_summary",
            "description": "Get summary of invoice receivables in Indian Rupees (₹) including outstanding and overdue balances.",
            "parameters": {
                "type": "object",
                "properties": {},
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_financial_forecast",
            "description": "Forecast future revenue or expenses in Indian Rupees (₹) for upcoming months.",
            "parameters": {
                "type": "object",
                "properties": {
                    "metric": {"type": "string", "enum": ["income", "expense"], "description": "Financial metric to forecast."},
                    "periods_ahead": {"type": "integer", "description": "Months into future to forecast (1 to 6)."},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_anomalies",
            "description": "Detect statistical anomalies or unusually large expense transactions in Indian Rupees (₹).",
            "parameters": {
                "type": "object",
                "properties": {},
            },
        },
    },
]
