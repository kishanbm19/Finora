from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database.connection import get_db
from app.models.invoice import InvoiceStatus
from app.models.user import User
from app.schemas.invoice import InvoiceCreate, InvoiceResponse, InvoiceUpdate
from app.services import invoice_service

router = APIRouter(prefix="/api/v1/invoices", tags=["Invoices"])


@router.get("", response_model=list[InvoiceResponse])
def list_invoices(
    skip: int = 0,
    limit: int = 100,
    status: InvoiceStatus | None = Query(default=None),
    customer_id: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return invoice_service.list_invoices(db, current_user.id, skip, limit, status, customer_id)


@router.post("", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
def create_invoice(
    payload: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return invoice_service.create_invoice(db, current_user.id, payload)


@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(
    invoice_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return invoice_service.get_owned_invoice(db, invoice_id, current_user.id)


@router.put("/{invoice_id}", response_model=InvoiceResponse)
def update_invoice(
    invoice_id: str,
    payload: InvoiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    invoice = invoice_service.get_owned_invoice(db, invoice_id, current_user.id)
    return invoice_service.update_invoice(db, invoice, payload)


@router.delete("/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_invoice(
    invoice_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    invoice = invoice_service.get_owned_invoice(db, invoice_id, current_user.id)
    invoice_service.delete_invoice(db, invoice)
