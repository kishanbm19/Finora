from datetime import date, datetime, timezone
import pytest

from app.models.account import Account, AccountType
from app.models.customer import Customer
from app.models.invoice import Invoice, InvoiceStatus
from app.models.transaction import Transaction, TransactionType
from app.services import financial_tools


def test_ai_chat_requires_auth(client):
    """POST /ai/chat and /api/v1/ai/chat must require authentication."""
    res1 = client.post("/ai/chat", json={"message": "What is my cash balance?"})
    assert res1.status_code == 401

    res2 = client.post("/api/v1/ai/chat", json={"message": "What is my cash balance?"})
    assert res2.status_code == 401


def test_ai_chat_empty_message(client, auth_headers):
    """Empty or whitespace-only messages must be rejected with 400."""
    res = client.post("/api/v1/ai/chat", json={"message": "   "}, headers=auth_headers)
    assert res.status_code == 400


def test_ai_chat_balances_and_expenses(client, auth_headers, db_session):
    """Test AI assistant answers balance and expense questions with real figures."""
    # Create an account
    acc_res = client.post(
        "/api/v1/accounts",
        json={"name": "Checking Account", "account_type": "bank", "balance": 5000.0, "currency": "USD"},
        headers=auth_headers,
    )
    acc_id = acc_res.json()["id"]

    # Create an expense transaction
    client.post(
        "/api/v1/transactions",
        json={
            "type": "expense",
            "category": "software",
            "amount": 150.0,
            "description": "Cloud hosting",
            "account_id": acc_id,
        },
        headers=auth_headers,
    )

    # Chat asking for balance
    chat_res = client.post(
        "/api/v1/ai/chat",
        json={"message": "What is my current cash balance?"},
        headers=auth_headers,
    )
    assert chat_res.status_code == 200
    assert "response" in chat_res.json()
    resp_text = chat_res.json()["response"]
    assert "4,850.00" in resp_text or "Checking Account" in resp_text

    # Chat asking for expenses
    exp_res = client.post(
        "/ai/chat",
        json={"message": "How much did I spend this month?"},
        headers=auth_headers,
    )
    assert exp_res.status_code == 200
    assert "150.00" in exp_res.json()["response"]


def test_user_data_isolation(client, db_session):
    """Verify User A cannot retrieve User B's financial data."""
    # Register User A
    client.post(
        "/api/v1/auth/register",
        json={"full_name": "User A", "email": "userA@example.com", "password": "password123"},
    )
    login_a = client.post(
        "/api/v1/auth/login",
        json={"email": "userA@example.com", "password": "password123"},
    )
    token_a = login_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Register User B
    client.post(
        "/api/v1/auth/register",
        json={"full_name": "User B", "email": "userB@example.com", "password": "password123"},
    )
    login_b = client.post(
        "/api/v1/auth/login",
        json={"email": "userB@example.com", "password": "password123"},
    )
    token_b = login_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User A creates a high-value account ($99,999.00)
    client.post(
        "/api/v1/accounts",
        json={"name": "User A Private Vault", "account_type": "bank", "balance": 99999.0, "currency": "USD"},
        headers=headers_a,
    )

    # User B asks for cash balance
    res_b = client.post(
        "/api/v1/ai/chat",
        json={"message": "What is my current cash balance?"},
        headers=headers_b,
    )
    assert res_b.status_code == 200
    resp_b_text = res_b.json()["response"]
    # User B must NOT see User A's private vault or balance
    assert "User A Private Vault" not in resp_b_text
    assert "99,999.00" not in resp_b_text
    assert "$0.00" in resp_b_text or "0" in resp_b_text


def test_financial_tools_direct(db_session):
    """Directly test the 10 financial tools."""
    user_id = "test-user-uuid"

    # 1. Accounts
    acc = Account(id="acc-1", user_id=user_id, name="Main Bank", balance=2500.0, account_type=AccountType.BANK)
    db_session.add(acc)

    # 2. Transactions (Income and Expense)
    today = datetime.now(timezone.utc).date()
    t1 = Transaction(
        id="t-1",
        user_id=user_id,
        account_id="acc-1",
        type=TransactionType.INCOME,
        category="sales",
        amount=1000.0,
        transaction_date=today,
    )
    t2 = Transaction(
        id="t-2",
        user_id=user_id,
        account_id="acc-1",
        type=TransactionType.EXPENSE,
        category="rent",
        amount=400.0,
        transaction_date=today,
    )
    db_session.add_all([t1, t2])

    # 3. Customer & Overdue Invoice
    cust = Customer(id="cust-1", user_id=user_id, name="Acme Corp", email="acme@corp.com")
    inv = Invoice(
        id="inv-1",
        user_id=user_id,
        customer_id="cust-1",
        invoice_number="INV-2026-00001",
        amount=500.0,
        status=InvoiceStatus.OVERDUE,
        due_date=today,
    )
    db_session.add_all([cust, inv])
    db_session.commit()

    # Test all 10 tools
    balances = financial_tools.get_account_balances(db_session, user_id)
    assert balances["total_cash_balance"] == 2500.0

    income = financial_tools.get_monthly_income(db_session, user_id)
    assert income["income"] == 1000.0

    expenses = financial_tools.get_monthly_expenses(db_session, user_id)
    assert expenses["expenses"] == 400.0

    cash_flow = financial_tools.get_cash_flow(db_session, user_id)
    assert "revenue_trend" in cash_flow

    tx_summary = financial_tools.get_transaction_summary(db_session, user_id)
    assert len(tx_summary["recent_transactions"]) == 2

    top_cats = financial_tools.get_top_expense_categories(db_session, user_id)
    assert top_cats["top_categories"][0]["category"] == "rent"
    assert top_cats["top_categories"][0]["amount"] == 400.0

    overdue = financial_tools.get_overdue_invoices(db_session, user_id)
    assert overdue["overdue_count"] == 1
    assert overdue["total_overdue_amount"] == 500.0

    inv_summary = financial_tools.get_invoice_summary(db_session, user_id)
    assert inv_summary["overdue_amount"] == 500.0

    fc = financial_tools.get_financial_forecast(db_session, user_id, metric="income")
    assert "forecast" in fc

    anom = financial_tools.get_anomalies(db_session, user_id)
    assert "anomalies_detected" in anom
