# Fenmo Expense Tracker

Hey! I'm Yugesh. This is my submission for the Fenmo assessment: a minimalist yet extremely robust personal finance tracker. I didn't want to just build a throwaway prototype, so I designed this to reliably track expenses under real-world conditions (slow networks, duplicate clicks, etc.).

**Live Deployments:**
- **Frontend (Netlify):** https://expense-tracker-fenmo.netlify.app 
- **Backend (Render):** https://expense-tracker-3rs8.onrender.com

---

## 🛠️ Tech Stack & Key Choices

### **Backend: FastAPI + SQLAlchemy ORM + PostgreSQL**
- **FastAPI**: I went with FastAPI because the execution speed is incredible, and throwing Pydantic in the mix gives me instant, rigorous type safety right at the API boundary.
- **SQLAlchemy ORM + Postgres**: Instead of settling for an in-memory JSON file or SQLite, I chose full relational PostgreSQL powered by the SQLAlchemy ORM. Financial data is inherently relational, and strict ACID-compliance is non-negotiable to prevent corrupted data.

### **Frontend: React + Vite + TypeScript**
- **Vite**: Gives me blazing-fast HMR and solid production builds. 
- I explicitly chose a vanilla CSS approach instead of something huge like Material UI or Tailwind. I wanted to prioritize raw correctness, loading speed, and UI clarity over bloated framework animations.

---

## 🔒 Core Engineering Decisions

### 1. Robust Idempotency (Preventing Duplicate Charges)
- **The Problem**: Users love frantically double-clicking "Submit", and unreliable mobile networks trigger automatic retries.
- **The Fix**: The frontend form strictly generates a unique `uuidv4` per session and passes it via an `Idempotency-Key` header. Down in the database, I attached a `UniqueConstraint(user_id, idempotency_key)` to the `expenses` table. If an exact retry hits the backend, Postgres physically blocks the duplicate, and the API cleanly bounces back the already-saved expense. No bloated secondary caching tables needed.

### 2. Money Handling (The Paise Trick)
- Handling money as floating-point decimals natively is a cardinal sin (e.g., `0.1 + 0.2 = 0.30000000000000004`). 
- **The Fix**: On a code level, the backend intercepts standard floating decimals and multiplies them out to store them securely as `amount_paise` (Integers). All core persistence logic handles solid integers.

### 3. Service-Repository Architecture
- I deliberately bypassed the standard "fat controller" pattern. The backend is strictly layered into `Controllers` -> `Services` -> `Repositories`. This centralizes error handling and explicitly separates database ORM calls from API routing.

### 4. Timezone Mitigation (The UTC Midnight Bug)
- **The Problem**: A user in India reporting adding an expense near midnight local time. Native Javascript `Date().toISOString()` calculates against global UTC time, which can drag "today" into "yesterday" restricting them from selecting their actual current date natively in the calendar.
- **The Fix**: The frontend calculation dynamically adjusts `d.getTimezoneOffset()` before firing the ISO constraint. Simultaneously, the backend validation relaxes the strict `Future Date` validation by allowing a `+1 day` variance to gracefully accept ledgers from any global timezone without throwing `422 Unprocessable Entity` errors.

---

## ⏳ Trade-offs & "I Was On a Clock" Decisions

1. **Authentication Token Strategy**
   - I implemented a 7-day `HttpOnly`, `SameSite=None` JWT Access Cookie. A 7-day TTL is technically too long for a highly sensitive banking app. Given more time, I would absolutely swap this for a dual-token system (a quick 15-minute Access Token + strict Refresh Token checking a Redis blocklist). I also skipped generic OAuth integrations to strictly maintain scope.
   
2. **Analytics & ORM Scalability**
   - Currently, the "Total Spent" charts compute dynamically via standard ORM queries and simple logic. In a truly massive app with gigabytes of ledger history, this slows down. I'd eventually shift these computations into raw parameterized SQL aggregations (`GROUP BY category`) to force the indexer to do the real heavy lifting.

3. **UI / UX Scope**
   - I kept the frontend tight and functional. If I wasn't timeboxed, I would have heavily revamped the Dashboard UX, breaking down historical trends and adding more overarching visual analytics.

---

## 🚀 Future Roadmap
If I were maintaining this past the assessment phase, here is what I'd build next:
- **Custom Categories**: Letting users define their own profiling instead of a hardcoded list.
- **Social / Group Splitting**: Connecting users so they can record "Group Expenses" and split shares amongst friends dynamically (real "Fenmo" utility!). 

---

## 🧪 Automated Testing
I also wired up a fast, ephemeral SQLite `pytest` suite testing:
- **Auth**: Sessions, protected routes, and cookies.
- **Expenses**: Filtering, strict descending sorts, and future-date insertion rejections.
- **Idempotency**: Proves the API forcefully prevents duplicate UUID insertions naturally.
