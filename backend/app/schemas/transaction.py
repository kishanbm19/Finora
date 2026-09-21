from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.models.transaction import TransactionType


class TransactionBase(BaseModel):
    type: TransactionType
    category: str = "general"
    amount: float
    description: str | None = None
    transaction_date: date | None = None
    account_id: str | None = None
    customer_id: str | None = None


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    type: TransactionType | None = None
    category: str | None = None
    amount: float | None = None
    description: str | None = None
    transaction_date: date | None = None
    account_id: str | None = None
    customer_id: str | None = None


class TransactionResponse(TransactionBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    transaction_date: date
    created_at: datetime
    account_name: str | None = None
    account_type: str | None = None
    customer_name: str | None = None
