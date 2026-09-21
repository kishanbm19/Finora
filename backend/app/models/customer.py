import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    company: Mapped[str | None] = mapped_column(String(200), nullable=True)
    address: Mapped[str | None] = mapped_column(String(400), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    owner = relationship("User", back_populates="customers")
    invoices = relationship("Invoice", back_populates="customer", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="customer")

    @property
    def total_invoiced(self) -> float:
        return round(
            sum(inv.amount for inv in self.invoices if str(inv.status).lower() not in ("cancelled", "invoicestatus.cancelled")),
            2,
        )

    @property
    def total_paid(self) -> float:
        return round(
            sum(inv.amount for inv in self.invoices if str(inv.status).lower() in ("paid", "invoicestatus.paid")),
            2,
        )

    @property
    def outstanding_balance(self) -> float:
        return round(
            sum(inv.amount for inv in self.invoices if str(inv.status).lower() in ("sent", "overdue", "invoicestatus.sent", "invoicestatus.overdue")),
            2,
        )

    @property
    def invoice_count(self) -> int:
        return len(self.invoices)

    @property
    def transaction_count(self) -> int:
        return len(self.transactions)
