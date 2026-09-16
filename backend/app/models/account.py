import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class AccountType(str, enum.Enum):
    CASH = "cash"
    BANK = "bank"
    CREDIT_CARD = "credit_card"
    SAVINGS = "savings"
    OTHER = "other"


class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)

    name: Mapped[str] = mapped_column(String(150), nullable=False)
    account_type: Mapped[AccountType] = mapped_column(Enum(AccountType), default=AccountType.BANK)
    balance: Mapped[float] = mapped_column(Float, default=0.0)
    currency: Mapped[str] = mapped_column(String(10), default="USD")

    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    owner = relationship("User", back_populates="accounts")
    transactions = relationship("Transaction", back_populates="account")
