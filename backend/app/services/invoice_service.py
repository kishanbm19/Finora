import random
import string
from datetime import date, datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.models.invoice import Invoice, InvoiceStatus
from app.schemas.invoice import InvoiceCreate, InvoiceUpdate


def _generate_invoice_number(db: Session) -> str:
    """Generate a human-friendly, unique invoice number like INV-2026-00001."""
    year = datetime.now(timezone.utc).year
    while True:
        suffix = "".join(random.choices(string.digits, k=5))
        candidate = f"INV-{year}-{suffix}"
        if not db.query(Invoice).filter(Invoice.invoice_number == candidate).first():
            return candidate


def create_invoice(db: Session, user_id: str, payload: InvoiceCreate) -> Invoice:
    customer = db.get(Customer, payload.customer_id)
    if not customer or customer.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    data = payload.model_dump()
    if not data.get("issue_date"):
        data["issue_date"] = datetime.now(timezone.utc).date()

    invoice = Invoice(user_id=user_id, invoice_number=_generate_invoice_number(db), **data)
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice


def get_owned_invoice(db: Session, invoice_id: str, user_id: str) -> Invoice:
    invoice = db.get(Invoice, invoice_id)
    if not invoice or invoice.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")
    return invoice


def list_invoices(
    db: Session,
    user_id: str,
    skip: int = 0,
    limit: int = 100,
    status_filter: InvoiceStatus | None = None,
    customer_id: str | None = None,
) -> list[Invoice]:
    query = db.query(Invoice).filter(Invoice.user_id == user_id)
    if customer_id:
        query = query.filter(Invoice.customer_id == customer_id)
    if status_filter:
        query = query.filter(Invoice.status == status_filter)

    # Auto-flag overdue invoices that are still marked "sent".
    today = datetime.now(timezone.utc).date()
    for invoice in query.filter(Invoice.status == InvoiceStatus.SENT, Invoice.due_date < today).all():
        invoice.status = InvoiceStatus.OVERDUE
    db.commit()

    return query.order_by(Invoice.issue_date.desc()).offset(skip).limit(limit).all()


def update_invoice(db: Session, invoice: Invoice, payload: InvoiceUpdate) -> Invoice:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(invoice, field, value)
    db.commit()
    db.refresh(invoice)
    return invoice


def delete_invoice(db: Session, invoice: Invoice) -> None:
    db.delete(invoice)
    db.commit()
