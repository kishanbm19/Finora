from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.models.invoice import InvoiceStatus


class InvoiceBase(BaseModel):
    customer_id: str
    amount: float
    status: InvoiceStatus = InvoiceStatus.DRAFT
    issue_date: date | None = None
    due_date: date
    notes: str | None = None


class InvoiceCreate(InvoiceBase):
    pass


class InvoiceUpdate(BaseModel):
    customer_id: str | None = None
    amount: float | None = None
    status: InvoiceStatus | None = None
    issue_date: date | None = None
    due_date: date | None = None
    notes: str | None = None


class InvoiceResponse(InvoiceBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    invoice_number: str
    issue_date: date
    created_at: datetime
