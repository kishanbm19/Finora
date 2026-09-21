import enum
import uuid
from datetime import date, datetime, timezone

from sqlalchemy import Date, DateTime, Enum, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class TransactionType(str, enum.Enum):
    INCOME = "income"
    EXPENSE = "expense"


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    account_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("accounts.id"), nullable=True)
    customer_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("customers.id"), nullable=True, index=True)

    type: Mapped[TransactionType] = mapped_column(Enum(TransactionType), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False, default="general")
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    description: Mapped[str | None] = mapped_column(String(400), nullable=True)
    transaction_date: Mapped[date] = mapped_column(Date, default=lambda: datetime.now(timezone.utc).date())

    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    owner = relationship("User", back_populates="transactions")
    account = relationship("Account", back_populates="transactions")
    customer = relationship("Customer", back_populates="transactions")

    @property
    def account_name(self) -> str | None:
        return self.account.name if self.account else None

    @property
    def account_type(self) -> str | None:
        if self.account and self.account.account_type:
            return self.account.account_type.value if hasattr(self.account.account_type, "value") else str(self.account.account_type)
        return None

    @property
    def customer_name(self) -> str | None:
        return self.customer.name if self.customer else None
