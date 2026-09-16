from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.account import AccountType


class AccountBase(BaseModel):
    name: str
    account_type: AccountType = AccountType.BANK
    balance: float = 0.0
    currency: str = "USD"


class AccountCreate(AccountBase):
    pass


class AccountUpdate(BaseModel):
    name: str | None = None
    account_type: AccountType | None = None
    balance: float | None = None
    currency: str | None = None


class AccountResponse(AccountBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    created_at: datetime
