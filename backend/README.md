# Finora Backend

FastAPI backend for Finora — SME FinanceOS.

## Stack

- FastAPI + Uvicorn
- SQLAlchemy 2.0 (SQLite for dev, PostgreSQL-ready)
- Pydantic v2 / pydantic-settings
- JWT auth (python-jose) + bcrypt password hashing (passlib)
- Alembic migrations
- Pandas / NumPy / scikit-learn for forecasting & anomaly detection
- Pytest for tests

## Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt
cp .env.example .env            # already provided as .env with dev defaults

# Option A: quick dev bootstrap (auto-creates tables on startup)
uvicorn app.main:app --reload

# Option B: use Alembic migrations instead
alembic upgrade head
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`, with interactive
docs at `http://localhost:8000/docs`.

## Authentication flow (JWT)

1. `POST /api/v1/auth/register` — create an account.
2. `POST /api/v1/auth/login` — returns `access_token` + `refresh_token`.
3. Send `Authorization: Bearer <access_token>` on every protected request.
4. `POST /api/v1/auth/refresh` — exchange a refresh token for a new pair
   once the access token expires.
5. `GET /api/v1/auth/me` — returns the current user (useful to validate
   a token on the frontend).

Access tokens default to a 24h lifetime; refresh tokens to 7 days
(see `app/core/config.py`).

## Running tests

```bash
pytest -v
```

Tests spin up an isolated in-memory SQLite database per test via
`tests/conftest.py`, so they never touch your local `finora.db`.

## Project layout

See `docs/architecture.md` in the repo root for the full layered
architecture description (Router → Schema → Service → Model → DB).

## Creating a new migration

```bash
alembic revision --autogenerate -m "describe your change"
alembic upgrade head
```

## Switching to PostgreSQL later

Just change `DATABASE_URL` in `.env`, e.g.:

```
DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/finora
```

and add `psycopg2-binary` to `requirements.txt`.
