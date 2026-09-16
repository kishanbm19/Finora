from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database.connection import get_db
from app.models.user import User
from app.services import report_service

router = APIRouter(prefix="/api/v1/reports", tags=["Reports"])


@router.get("/profit-and-loss")
def profit_and_loss(
    start: date = Query(..., description="Start date, e.g. 2026-01-01"),
    end: date = Query(..., description="End date, e.g. 2026-12-31"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return report_service.profit_and_loss_report(db, current_user.id, start, end)
