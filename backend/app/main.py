"""
Finora - SME FinanceOS
FastAPI application entrypoint.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database.connection import init_db
from app.routers import (
    accounts,
    analytics,
    auth,
    customers,
    dashboard,
    expenses,
    invoices,
    reports,
    transactions,
)

app = FastAPI(
    title=settings.APP_NAME,
    description="Financial management and intelligence platform for SMEs.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    # Dev convenience: auto-create tables. In production, use Alembic migrations instead.
    init_db()


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "service": settings.APP_NAME}


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy"}


# Routers
app.include_router(auth.router)
app.include_router(customers.router)
app.include_router(accounts.router)
app.include_router(transactions.router)
app.include_router(invoices.router)
app.include_router(expenses.router)
app.include_router(dashboard.router)
app.include_router(reports.router)
app.include_router(analytics.router)
