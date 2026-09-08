from fastapi import FastAPI

from app.database.base import Base
from app.database.connection import engine
from app.models.user import User
from app.routers.auth import router as auth_router


app = FastAPI(
    title="Finora",
    version="1.0.0"
)


Base.metadata.create_all(bind=engine)


@app.get("/api/v1/health")
def health_check():
    return {
        "status": "healthy"
    }


app.include_router(
    auth_router,
    prefix="/api/v1"
)