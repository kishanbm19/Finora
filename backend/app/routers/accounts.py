from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database.connection import get_db
from app.models.account import Account
from app.models.user import User
from app.schemas.account import AccountCreate, AccountResponse, AccountUpdate

router = APIRouter(prefix="/api/v1/accounts", tags=["Accounts"])


def _get_owned_account(db: Session, account_id: str, user_id: str) -> Account:
    account = db.get(Account, account_id)
    if not account or account.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    return account


@router.get("", response_model=list[AccountResponse])
def list_accounts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Account).filter(Account.user_id == current_user.id).all()


@router.post("", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
def create_account(
    payload: AccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    account = Account(user_id=current_user.id, **payload.model_dump())
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


@router.get("/{account_id}", response_model=AccountResponse)
def get_account(
    account_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_owned_account(db, account_id, current_user.id)


@router.put("/{account_id}", response_model=AccountResponse)
def update_account(
    account_id: str,
    payload: AccountUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    account = _get_owned_account(db, account_id, current_user.id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(account, field, value)
    db.commit()
    db.refresh(account)
    return account


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    account_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    account = _get_owned_account(db, account_id, current_user.id)
    db.delete(account)
    db.commit()
