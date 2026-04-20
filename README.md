# Fenmo Expense Tracker

A production-grade, minimalist personal finance tool built for the Fenmo assessment. Designed to reliably track and manage expenses under real-world conditions.

**Live Deployment:**
- **Frontend (Netlify):** https://expense-tracker-fenmo.netlify.app 
- **Backend (Render):** https://expense-tracker-3rs8.onrender.com

---

## 🛠️ Tech Stack & Key Choices

### **Backend: FastAPI + SQLAlchemy + PostgreSQL**
- **Reasoning**: Chosen for its incredible speed, native `async` support, and automatic OpenAPI generation. 
- **Database (Neon PostgreSQL)**: Instead of settling for a minimal JSON or SQLite implementation, I chose a real relational database. Financial data (ledgers, expenses) is highly relational and requires strict ACID compliance, which PostgreSQL handles perfectly.

### **Frontend: React + Vite + TypeScript**
- **Reasoning**: Vite provides instant HMR and blazing-fast builds. A CSS-only styling approach was taken to achieve a highly customized aesthetic without the bloat of an external component library.
- **Code-Splitting**: Routes are dynamically lazy-loaded using `React.lazy` to keep the initial bundle ultra-lean.

---

## 🔒 Core Engineering Decisions

### 1. Robust Idempotency (Preventing Duplicate Charges)
"The API should behave correctly even if the client retries the same request due to network issues or page reloads."
- **How it works**: The React frontend creates a highly unique `uuidv4` when the user opens the Create Expense form. This is sent to the backend via the `Idempotency-Key` header.
- **Transactional Safety**: The PostgreSQL `expenses` table features a `UniqueConstraint(user_id, idempotency_key)`. If a user spams the submit button, or a network failure forces an automatic retry, the database physically rejects the duplicate, and the backend safely intercepts the `IntegrityError` to return the original 201 Created expense data.

### 2. Security (Cross-Domain Session Cookies)
- Instead of storing JWTs in `localStorage` (which is vulnerable to XSS attacks), JWT access tokens are stored in strictly configured `HttpOnly`, `Secure`, `SameSite=None` cookies.
- This secures cross-domain production authentication between the Netlify frontend and Render backend, protecting user sessions against CSRF and XSS inherently.

### 3. Data Representation
- **Money Handling**: `amount` is never stored as a float. Instead, the backend ingests standard decimals and normalizes them securely into `amount_paise` (Integers) inside the database. This guarantees 100% precision with zero floating-point arithmetic errors.

---

## 🧪 Testing Suite
A Pytest automation suite runs seamlessly using an isolated, ephemeral in-memory SQLite database to ensure the logic runs blazingly fast without polluting the actual DB. It hits endpoints via FastAPI `TestClient`:
- Auth Suite (`test_auth.py`): Checks signup, login, session cookies, and authorization guards.
- Expenses Suite (`test_expenses.py`): Re-verifies category filtering, strict descending date sorting, and enforces that the Idempotency logic effectively halts double-insertions.

---

## 🕒 Trade-offs made for time
1. **Analytics Scope**: The "Total Spent" dashboard runs aggregations efficiently in Python, but for a massively scaled app over years of data, these computations would ideally be shifted to raw SQL aggregations (`GROUP BY category`).
2. **Refresh Tokens**: I implemented a standard 7-day `HttpOnly` JWT. With more time, a short-lived Access Token + long-lived Refresh Token strategy with a Redis blocklist would be introduced for premium security.
