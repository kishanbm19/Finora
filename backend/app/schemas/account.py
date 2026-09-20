from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator

from app.models.account import AccountType


class AccountBase(BaseModel):
    name: str
    account_type: AccountType = AccountType.BANK
    balance: float = 0.0
    currency: str = "USD"

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Account name cannot be blank")
        return v

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v: str) -> str:
        v = (v or "").strip().upper()
        return v or "USD"


class AccountCreate(AccountBase):
    pass


class AccountUpdate(BaseModel):
    name: str | None = None
    account_type: AccountType | None = None
    balance: float | None = None
    currency: str | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Account name cannot be blank")
        return v

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip().upper()
            return v or "USD"
        return v


class AccountResponse(AccountBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    created_at: datetime
