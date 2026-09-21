"""
Database engine + session management.

Uses SQLite for development. Because DATABASE_URL is fully driven by
config, switching to PostgreSQL later is just an env var change plus
installing psycopg2-binary / asyncpg.
"""
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a DB session and always closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all tables. Used for local/dev bootstrap; production uses Alembic."""
    from sqlalchemy import text
    from app.database.base import Base

    Base.metadata.create_all(bind=engine)

    # Safe migration check for SQLite dev environment
    if settings.DATABASE_URL.startswith("sqlite"):
        with engine.connect() as conn:
            try:
                conn.execute(text("ALTER TABLE transactions ADD COLUMN customer_id VARCHAR(36) REFERENCES customers(id)"))
                conn.commit()
            except Exception:
                pass  # column already exists or table freshly created
