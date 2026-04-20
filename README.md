# Authenticated Expense Tracker

A local-first monorepo for a small personal finance tool with:

- `frontend/`: React + TypeScript + Vite
- `backend/`: FastAPI + SQLAlchemy + Alembic
- `database`: PostgreSQL via Neon `DATABASE_URL`

## Why Postgres

This project uses managed Postgres because the app is expected to run in deployed conditions and retain data reliably across refreshes and restarts. Postgres gives durable external storage, relational constraints, and transactional correctness without relying on local files.

## Why Money Is Stored As Integer Paise

Amounts are stored as `amount_paise` integers instead of floats. Floating-point arithmetic is not exact for currency, while integer minor units keep totals and comparisons correct.

## Phase 1 Scope

Included:

- signup, login, logout, current-user
- authenticated expense creation
- expense listing
- category filter
- newest-first date sorting
- total for the current visible list
- fixed built-in categories

Excluded:

- custom categories
- idempotency and retry-safe create behavior
- deployment setup
- automated tests

## Trade-offs

- Auth is included from the start so expenses are user-owned, but the auth flow is intentionally small: email/password plus a JWT in an HTTP-only cookie.
- Custom categories are deferred because `Other` covers the immediate UX without adding category CRUD.
- JWT expiry is set to 7 days for easy manual testing. There is no refresh-token flow in this phase.
- Reliability work for retries and duplicate submissions is intentionally deferred to Phase 2.
- Logging is centralized through a dedicated backend logging module. HTTP status codes still use FastAPI's built-in `status` constants rather than custom wrappers.
- Password hashing uses `pbkdf2_sha256` to avoid bcrypt's 72-byte password limit during local development and manual testing.

## Local Setup

### 1. Backend environment

Copy `backend/.env.example` to `backend/.env` and fill in:

- `DATABASE_URL`
- `JWT_SECRET`

If you paste a Neon connection string that starts with `postgresql://`, the backend normalizes it automatically for SQLAlchemy's `psycopg` driver.

### 2. Install dependencies

Backend:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
python -m pip install -r requirements.txt
```

Frontend:

```powershell
cd frontend
npm.cmd install
```

### 3. Run migrations

```powershell
cd backend
.venv\Scripts\activate
alembic upgrade head
```

### 4. Start the backend

```powershell
cd backend
.venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

### 5. Start the frontend

```powershell
cd frontend
npm.cmd run dev
```

Frontend runs at `http://localhost:5173` and talks to the FastAPI backend at `http://localhost:8000`.

## Manual Verification

- Sign up a user
- Log in and confirm the app loads expenses
- Add expenses with different categories and dates
- Add an expense with a blank description
- Filter by category and confirm the visible list changes
- Confirm newest dates are listed first
- Confirm the total matches the visible list
- Log out and confirm the app returns to the auth screen
