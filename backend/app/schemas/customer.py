from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class CustomerBase(BaseModel):
    name: str
    email: EmailStr | None = None
    phone: str | None = None
    company: str | None = None
    address: str | None = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    company: str | None = None
    address: str | None = None


class CustomerResponse(CustomerBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    created_at: datetime
