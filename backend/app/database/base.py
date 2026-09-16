"""
Declarative Base shared by every SQLAlchemy model.

Importing every model module here ensures Alembic's autogenerate
and Base.metadata.create_all() can discover all tables.
"""
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


# Import models so they register themselves on Base.metadata.
# (placed at bottom to avoid circular imports)
from app.models import user, customer, account, transaction, invoice, expense  # noqa: E402,F401
