from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.account import Account, AccountType
from app.models.customer import Customer
from app.models.transaction import Transaction, TransactionType
from app.schemas.transaction import TransactionCreate, TransactionUpdate


def _resolve_account_id(db: Session, user_id: str, account_id: str | None) -> str | None:
    """Resolve account ID, creating a default cash account if 'cash' is requested."""
    if not account_id or not str(account_id).strip():
        return None
    
    clean_id = str(account_id).strip()
    if clean_id.lower() == "cash":
        cash_acc = (
            db.query(Account)
            .filter(Account.user_id == user_id, Account.account_type == AccountType.CASH)
            .first()
        )
        if not cash_acc:
            cash_acc = Account(
                user_id=user_id,
                name="Cash",
                account_type=AccountType.CASH,
                balance=0.0,
                currency="USD",
            )
            db.add(cash_acc)
            db.flush()
        return cash_acc.id

    account = db.get(Account, clean_id)
    if not account or account.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selected account not found or unauthorized",
        )
    return account.id


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

    data["account_id"] = _resolve_account_id(db, user_id, data.get("account_id"))

    if data.get("customer_id"):
        cust = db.get(Customer, data["customer_id"])
        if not cust or cust.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Selected customer not found or unauthorized")

    transaction = Transaction(user_id=user_id, **data)
    db.add(transaction)

    signed_amount = transaction.amount if transaction.type == TransactionType.INCOME else -transaction.amount
    _apply_balance_delta(db, transaction.account_id, signed_amount)

    db.commit()
    db.refresh(transaction)
    return transaction


def get_owned_transaction(db: Session, transaction_id: str, user_id: str) -> Transaction:
    transaction = (
        db.query(Transaction)
        .options(joinedload(Transaction.account), joinedload(Transaction.customer))
        .filter(Transaction.id == transaction_id)
        .first()
    )
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
    account_id: str | None = None,
    customer_id: str | None = None,
) -> list[Transaction]:
    query = (
        db.query(Transaction)
        .options(joinedload(Transaction.account), joinedload(Transaction.customer))
        .filter(Transaction.user_id == user_id)
    )
    if type_filter:
        query = query.filter(Transaction.type == type_filter)
    if category:
        query = query.filter(Transaction.category == category)
    if customer_id:
        query = query.filter(Transaction.customer_id == customer_id)
    if account_id:
        if account_id.lower() == "cash":
            query = query.join(Transaction.account).filter(Account.account_type == AccountType.CASH)
        elif account_id == "unassigned":
            query = query.filter(Transaction.account_id.is_(None))
        else:
            query = query.filter(Transaction.account_id == account_id)
    return query.order_by(Transaction.transaction_date.desc()).offset(skip).limit(limit).all()


def update_transaction(db: Session, transaction: Transaction, payload: TransactionUpdate) -> Transaction:
    # Reverse the old balance effect before applying updates.
    old_signed = transaction.amount if transaction.type == TransactionType.INCOME else -transaction.amount
    _apply_balance_delta(db, transaction.account_id, -old_signed)

    update_data = payload.model_dump(exclude_unset=True)
    if "account_id" in update_data:
        update_data["account_id"] = _resolve_account_id(db, transaction.user_id, update_data.get("account_id"))

    if update_data.get("customer_id"):
        cust = db.get(Customer, update_data["customer_id"])
        if not cust or cust.user_id != transaction.user_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Selected customer not found or unauthorized")

    for field, value in update_data.items():
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
