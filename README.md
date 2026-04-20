# Expense Tracker

A production-grade, full-stack personal finance tool built to reliably track and manage expenses under real-world conditions. Designed to be resilient against slow networks, duplicate form submissions, and timezone desyncs.

**Live Deployments:**
- **Frontend (Netlify):** https://expense-tracker-fenmo.netlify.app 
- **Backend (Render):** https://expense-tracker-3rs8.onrender.com

---

## Tech Stack & Architecture

### Backend: FastAPI + SQLAlchemy ORM + PostgreSQL
- **FastAPI**: Chosen for its high performance execution speed and native async support. Pydantic is utilized to enforce strict, rigorous type safety at the API boundary.
- **SQLAlchemy ORM + Postgres**: Instead of settling for an in-memory JSON file or SQLite, I chose full relational PostgreSQL powered by the SQLAlchemy ORM. Financial data is inherently relational, and strict ACID-compliance is non-negotiable to prevent corrupted data.

### Frontend: React + Vite + TypeScript
- **Vite**: Provides immediate HMR and highly optimized production builds. 
- I explicitly chose a vanilla CSS approach instead of utilizing a massive framework like Material UI or Tailwind. I wanted to prioritize raw correctness, loading speed, and UI clarity over bloated animations.

---

## Core Engineering Decisions

### 1. Robust Idempotency (Preventing Duplicate Charges)
- **The Problem**: Users may double-click 'Submit', or unreliable mobile networks trigger automatic, silent retries.
- **The Fix**: The frontend form generates a unique uuidv4 per session and passes it via an Idempotency-Key header. Down in the database, I attached a UniqueConstraint(user_id, idempotency_key) to the expenses table. If an exact retry hits the backend, Postgres physically blocks the duplicate, and the API cleanly returns the already-saved expense. No secondary caching tables needed.

### 2. Money Handling (The Paise Trick)
- Handling money as floating-point decimals natively is dangerous due to arithmetic precision loss (e.g., 0.1 + 0.2 = 0.30000000000000004). 
- **The Fix**: On a code level, the backend intercepts standard floating decimals and multiplies them out to store them securely as amount_paise (Integers). All core persistence logic only handles solid integers.

### 3. Service-Repository Architecture
- I bypassed the standard 'fat controller' pattern. The backend is strictly layered into Controllers -> Services -> Repositories. This centralizes error handling and explicitly separates database ORM calls from API routing.

### 4. Timezone Mitigation (The UTC Midnight Bug)
- **The Problem**: A user in India reporting adding an expense near midnight local time. Native Javascript Date().toISOString() calculates against global UTC time, which can drag 'today' into 'yesterday', restricting them from selecting their actual current date natively in the calendar.
- **The Fix**: The frontend calculation dynamically adjusts d.getTimezoneOffset() before firing the ISO constraint. Simultaneously, the backend validation relaxes the strict Future Date validation by allowing a +1 day variance to gracefully accept ledgers from any global timezone without throwing 422 Unprocessable Entity errors.

---

## Trade-offs & Architecture Limitations

1. **Authentication Token Strategy**
   - I implemented a 7-day HttpOnly, SameSite=None JWT Access Cookie. A 7-day TTL is technically too long for a highly sensitive banking app. Given more time, I would swap this for a dual-token system (a quick 15-minute Access Token + strict Refresh Token system). I also skipped generic OAuth integrations to strictly maintain MVP scope.
   
2. **Analytics & ORM Scalability**
   - Currently, the 'Total Spent' charts compute dynamically via standard ORM queries and simple logic. In a truly massive application with gigabytes of ledger history, this approach will bottleneck. I would eventually shift these computations into raw parameterized SQL aggregations (GROUP BY category) to force the database indexer to do the heavy lifting.

3. **UI / UX Scope**
   - I kept the frontend tight and functional. If I wasn't timeboxed, I would have revamped the Dashboard UX, breaking down historical trends and adding more overarching visual analytics.

---

## Future Roadmap
If I were maintaining this codebase into V2, here is what I would build next:
- **Custom Categories**: Letting users define their own profiling instead of a hardcoded enum list.
- **Social / Group Splitting**: Connecting users so they can record 'Group Expenses' and split shares amongst friends dynamically. 

---

## Automated Testing
I engineered a fast, ephemeral SQLite pytest suite testing:
- **Auth**: Sessions, protected routes, and cookies.
- **Expenses**: Filtering, strict descending sorts, and future-date insertion rejections.
- **Idempotency**: Proves the API forcefully prevents duplicate UUID insertions naturally.
