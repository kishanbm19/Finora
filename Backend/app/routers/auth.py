from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import (
    create_token,
    get_current_user,
    hash_password,
    verify_password
)
from app.database.connection import get_db
from app.models.user import User
from app.schemas.user import (
    Token,
    UserCreate,
    UserLogin,
    UserResponse
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    user = db.scalar(
        select(User).where(
            User.email == user_data.email
        )
    )

    if user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    new_user = User(
        name=user_data.name,
        email=user_data.email,
        hashed_password=hash_password(
            user_data.password
        )
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post(
    "/login",
    response_model=Token
)
def login(
    user_data: UserLogin,
    db: Session = Depends(get_db)
):
    user = db.scalar(
        select(User).where(
            User.email == user_data.email
        )
    )

    if not user or not verify_password(
        user_data.password,
        user.hashed_password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    return {
        "access_token": create_token(user.id),
        "token_type": "bearer"
    }


@router.get(
    "/me",
    response_model=UserResponse
)
def me(
    user: User = Depends(get_current_user)
):
    return user