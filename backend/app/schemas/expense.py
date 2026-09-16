from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class ExpenseBase(BaseModel):
    category: str = "general"
    vendor: str | None = None
    amount: float
    description: str | None = None
    expense_date: date | None = None


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    category: str | None = None
    vendor: str | None = None
    amount: float | None = None
    description: str | None = None
    expense_date: date | None = None


class ExpenseResponse(ExpenseBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    expense_date: date
    created_at: datetime
