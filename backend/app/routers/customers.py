from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database.connection import get_db
from app.models.customer import Customer
from app.models.user import User
from app.schemas.customer import CustomerCreate, CustomerResponse, CustomerUpdate

router = APIRouter(prefix="/api/v1/customers", tags=["Customers"])


def _get_owned_customer(db: Session, customer_id: str, user_id: str) -> Customer:
    customer = db.get(Customer, customer_id)
    if not customer or customer.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return customer


@router.get("", response_model=list[CustomerResponse])
def list_customers(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Customer)
        .filter(Customer.user_id == current_user.id)
        .order_by(Customer.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(
    payload: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = Customer(user_id=current_user.id, **payload.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_owned_customer(db, customer_id, current_user.id)


@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: str,
    payload: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = _get_owned_customer(db, customer_id, current_user.id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(customer, field, value)
    db.commit()
    db.refresh(customer)
    return customer


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(
    customer_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = _get_owned_customer(db, customer_id, current_user.id)
    db.delete(customer)
    db.commit()
