from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database.connection import get_db
from app.models.transaction import TransactionType
from app.models.user import User
from app.schemas.transaction import TransactionCreate, TransactionResponse, TransactionUpdate
from app.services import transaction_service

router = APIRouter(prefix="/api/v1/transactions", tags=["Transactions"])


@router.get("", response_model=list[TransactionResponse])
def list_transactions(
    skip: int = 0,
    limit: int = 100,
    type: TransactionType | None = Query(default=None),
    category: str | None = None,
    account_id: str | None = Query(default=None),
    customer_id: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return transaction_service.list_transactions(db, current_user.id, skip, limit, type, category, account_id, customer_id)


@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    payload: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return transaction_service.create_transaction(db, current_user.id, payload)


@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return transaction_service.get_owned_transaction(db, transaction_id, current_user.id)


@router.put("/{transaction_id}", response_model=TransactionResponse)
def update_transaction(
    transaction_id: str,
    payload: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    transaction = transaction_service.get_owned_transaction(db, transaction_id, current_user.id)
    return transaction_service.update_transaction(db, transaction, payload)


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    transaction = transaction_service.get_owned_transaction(db, transaction_id, current_user.id)
    transaction_service.delete_transaction(db, transaction)
