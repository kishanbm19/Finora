from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.expense import Expense
from app.schemas.expense import ExpenseCreate, ExpenseUpdate


def create_expense(db: Session, user_id: str, payload: ExpenseCreate) -> Expense:
    data = payload.model_dump()
    if not data.get("expense_date"):
        data["expense_date"] = datetime.now(timezone.utc).date()

    expense = Expense(user_id=user_id, **data)
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


def get_owned_expense(db: Session, expense_id: str, user_id: str) -> Expense:
    expense = db.get(Expense, expense_id)
    if not expense or expense.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    return expense


def list_expenses(
    db: Session,
    user_id: str,
    skip: int = 0,
    limit: int = 100,
    category: str | None = None,
) -> list[Expense]:
    query = db.query(Expense).filter(Expense.user_id == user_id)
    if category:
        query = query.filter(Expense.category == category)
    return query.order_by(Expense.expense_date.desc()).offset(skip).limit(limit).all()


def update_expense(db: Session, expense: Expense, payload: ExpenseUpdate) -> Expense:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(expense, field, value)
    db.commit()
    db.refresh(expense)
    return expense


def delete_expense(db: Session, expense: Expense) -> None:
    db.delete(expense)
    db.commit()
