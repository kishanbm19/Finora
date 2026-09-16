from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database.connection import get_db
from app.models.user import User
from app.schemas.expense import ExpenseCreate, ExpenseResponse, ExpenseUpdate
from app.services import expense_service

router = APIRouter(prefix="/api/v1/expenses", tags=["Expenses"])


@router.get("", response_model=list[ExpenseResponse])
def list_expenses(
    skip: int = 0,
    limit: int = 100,
    category: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return expense_service.list_expenses(db, current_user.id, skip, limit, category)


@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(
    payload: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return expense_service.create_expense(db, current_user.id, payload)


@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense(
    expense_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return expense_service.get_owned_expense(db, expense_id, current_user.id)


@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: str,
    payload: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    expense = expense_service.get_owned_expense(db, expense_id, current_user.id)
    return expense_service.update_expense(db, expense, payload)


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    expense = expense_service.get_owned_expense(db, expense_id, current_user.id)
    expense_service.delete_expense(db, expense)
