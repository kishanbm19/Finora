# Finora — SME FinanceOS

A full-stack financial management and intelligence platform for small
and medium-sized businesses: customers, income/expense tracking,
invoices, accounts, dashboards, analytics, forecasting, and anomaly
detection.

See `PROJECT_DESCRIPTION` (the original spec) for the full product
vision. This repo implements the architecture described there.

## Stack

- **Backend**: FastAPI, SQLAlchemy 2.0, SQLite (dev) → PostgreSQL-ready,
  JWT auth, Alembic, scikit-learn / pandas for ML.
- **Frontend**: React 18 (plain JavaScript, no TypeScript) + Vite,
  React Router, Axios, Recharts.

## Quick start

**1. Backend**

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Runs at `http://localhost:8000` — interactive API docs at `/docs`.

**2. Frontend**

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:5173` and proxies API calls to the backend.

**3. Try it out**

- Open `http://localhost:5173/register` and create an account.
- Add an account, a couple of transactions, a customer, and an
  invoice.
- Visit the Dashboard and Analytics pages to see live charts,
  forecasts, anomaly detection, and rule-based financial insights.

## Repository layout

```
backend/    FastAPI app (see backend/README.md)
frontend/   React app (see frontend/README.md)
ml_models/  Placeholder for saved model artifacts
docs/       (add architecture notes here as the project grows)
```

## Authentication

Finora uses JWT bearer tokens:

- `POST /api/v1/auth/register` and `/login` issue an `access_token`
  (24h) and `refresh_token` (7d).
- Every other endpoint requires `Authorization: Bearer <access_token>`.
- The frontend handles refreshing automatically — see
  `frontend/README.md` for details.

## Notes

- Deployment tooling (Docker, CI, etc.) is intentionally left out of
  this version — add it whenever you're ready to containerize.
- The database defaults to SQLite for zero-setup local development.
  Switch `DATABASE_URL` in `backend/.env` to point at PostgreSQL when
  you're ready for production.
