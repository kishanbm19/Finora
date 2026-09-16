# Finora Frontend

React (JavaScript, no TypeScript) + Vite frontend for Finora — SME FinanceOS.

## Stack

- React 18 + React Router v6
- Vite
- Axios (with automatic JWT access-token refresh)
- Recharts for dashboard charts
- Plain CSS (see `src/index.css`) — no CSS framework required

## Setup

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173` and proxies `/api/*` requests to
the backend at `http://localhost:8000` (see `vite.config.js`).

Make sure the backend is running first (see `backend/README.md`).

## Auth flow

- `src/lib/auth.js` stores the JWT access/refresh tokens in
  `localStorage`.
- `src/services/api.js` is a shared Axios instance that:
  - attaches `Authorization: Bearer <access_token>` to every request,
  - automatically calls `/api/v1/auth/refresh` and retries the request
    once if a call comes back `401`,
  - redirects to `/login` if the refresh also fails.
- `src/app/providers.jsx` exposes an `AuthContext` (`user`, `login`,
  `register`, `logout`) consumed via `src/hooks/useAuth.js`.
- `src/app/routes.jsx` guards all dashboard routes behind
  `ProtectedRoute`, and keeps `/login` and `/register` behind
  `PublicOnlyRoute` so logged-in users skip straight to the dashboard.

## Project structure

```
src/
  app/            # routing + global providers (AuthContext)
  components/     # common UI, layout shell, dashboard widgets
  pages/          # one file per route (Dashboard, Transactions, ...)
  services/       # one file per backend resource, all built on api.js
  hooks/          # useAuth, useFetch, useDebounce
  lib/            # constants + token storage helpers
  utils/          # formatting / validation helpers
```

## Adding a new page

1. Create the page in `src/pages/YourPage.jsx`.
2. Add a `<Route path="your-page" element={<YourPage />} />` inside the
   protected `<Route path="/">` block in `src/app/routes.jsx`.
3. Add a link to it in `src/components/layout/Sidebar.jsx`.
4. If it needs backend data, add a `src/services/yourService.js` file
   following the pattern in `transactionService.js`.
