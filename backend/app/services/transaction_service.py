from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.account import Account
from app.models.transaction import Transaction, TransactionType
from app.schemas.transaction import TransactionCreate, TransactionUpdate


def _apply_balance_delta(db: Session, account_id: str | None, delta: float) -> None:
    """Adjust the linked account's balance when a transaction is created/updated/deleted."""
    if not account_id:
        return
    account = db.get(Account, account_id)
    if account:
        account.balance += delta


def create_transaction(db: Session, user_id: str, payload: TransactionCreate) -> Transaction:
    data = payload.model_dump()
    if not data.get("transaction_date"):
        data["transaction_date"] = datetime.now(timezone.utc).date()

    transaction = Transaction(user_id=user_id, **data)
    db.add(transaction)

    signed_amount = transaction.amount if transaction.type == TransactionType.INCOME else -transaction.amount
    _apply_balance_delta(db, transaction.account_id, signed_amount)

    db.commit()
    db.refresh(transaction)
    return transaction


def get_owned_transaction(db: Session, transaction_id: str, user_id: str) -> Transaction:
    transaction = db.get(Transaction, transaction_id)
    if not transaction or transaction.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    return transaction


def list_transactions(
    db: Session,
    user_id: str,
    skip: int = 0,
    limit: int = 100,
    type_filter: TransactionType | None = None,
    category: str | None = None,
) -> list[Transaction]:
    query = db.query(Transaction).filter(Transaction.user_id == user_id)
    if type_filter:
        query = query.filter(Transaction.type == type_filter)
    if category:
        query = query.filter(Transaction.category == category)
    return query.order_by(Transaction.transaction_date.desc()).offset(skip).limit(limit).all()


def update_transaction(db: Session, transaction: Transaction, payload: TransactionUpdate) -> Transaction:
    # Reverse the old balance effect before applying updates.
    old_signed = transaction.amount if transaction.type == TransactionType.INCOME else -transaction.amount
    _apply_balance_delta(db, transaction.account_id, -old_signed)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(transaction, field, value)

    new_signed = transaction.amount if transaction.type == TransactionType.INCOME else -transaction.amount
    _apply_balance_delta(db, transaction.account_id, new_signed)

    db.commit()
    db.refresh(transaction)
    return transaction


def delete_transaction(db: Session, transaction: Transaction) -> None:
    signed_amount = transaction.amount if transaction.type == TransactionType.INCOME else -transaction.amount
    _apply_balance_delta(db, transaction.account_id, -signed_amount)
    db.delete(transaction)
    db.commit()
