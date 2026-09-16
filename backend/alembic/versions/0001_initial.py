"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-01-01

"""
from alembic import op
import sqlalchemy as sa

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("full_name", sa.String(150), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("business_name", sa.String(200), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "customers",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("phone", sa.String(30), nullable=True),
        sa.Column("company", sa.String(200), nullable=True),
        sa.Column("address", sa.String(400), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_customers_user_id", "customers", ["user_id"])

    op.create_table(
        "accounts",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column(
            "account_type",
            sa.Enum("CASH", "BANK", "CREDIT_CARD", "SAVINGS", "OTHER", name="accounttype"),
            nullable=False,
        ),
        sa.Column("balance", sa.Float(), nullable=False, server_default="0"),
        sa.Column("currency", sa.String(10), nullable=False, server_default="USD"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_accounts_user_id", "accounts", ["user_id"])

    op.create_table(
        "transactions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("account_id", sa.String(36), sa.ForeignKey("accounts.id"), nullable=True),
        sa.Column("type", sa.Enum("INCOME", "EXPENSE", name="transactiontype"), nullable=False),
        sa.Column("category", sa.String(100), nullable=False, server_default="general"),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("description", sa.String(400), nullable=True),
        sa.Column("transaction_date", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_transactions_user_id", "transactions", ["user_id"])

    op.create_table(
        "invoices",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("customer_id", sa.String(36), sa.ForeignKey("customers.id"), nullable=False),
        sa.Column("invoice_number", sa.String(50), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED", name="invoicestatus"),
            nullable=False,
        ),
        sa.Column("issue_date", sa.Date(), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=False),
        sa.Column("notes", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_invoices_user_id", "invoices", ["user_id"])
    op.create_index("ix_invoices_customer_id", "invoices", ["customer_id"])
    op.create_index("ix_invoices_invoice_number", "invoices", ["invoice_number"], unique=True)

    op.create_table(
        "expenses",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("category", sa.String(100), nullable=False, server_default="general"),
        sa.Column("vendor", sa.String(200), nullable=True),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("description", sa.String(400), nullable=True),
        sa.Column("expense_date", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_expenses_user_id", "expenses", ["user_id"])


def downgrade() -> None:
    op.drop_table("expenses")
    op.drop_table("invoices")
    op.drop_table("transactions")
    op.drop_table("accounts")
    op.drop_table("customers")
    op.drop_table("users")
