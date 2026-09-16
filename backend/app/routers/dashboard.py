from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database.connection import get_db
from app.models.user import User
from app.schemas.dashboard import DashboardSummary, DashboardTrends
from app.services import dashboard_service

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return dashboard_service.get_summary(db, current_user.id)


@router.get("/trends", response_model=DashboardTrends)
def trends(
    months: int = 6,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return dashboard_service.get_trends(db, current_user.id, months)
