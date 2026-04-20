import { useEffect, useState, lazy, Suspense } from "react";

import { apiFetch } from "./api/client";
import { AuthPanel } from "./components/AuthPanel";
import { ExpenseForm, ExpenseFormValues } from "./components/ExpenseForm";
import { Expense } from "./components/ExpenseTable";

const DashboardView = lazy(() => import("./components/DashboardView").then(m => ({ default: m.DashboardView })));
const TransactionsView = lazy(() => import("./components/TransactionsView").then(m => ({ default: m.TransactionsView })));

type User = {
  id: number;
  email: string;
};

type ExpenseListResponse = {
  expenses: Expense[];
  total_count: number;
  page: number;
  page_size: number;
};

function App() {
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [user, setUser] = useState<User | null>(null);
  const [booting, setBooting] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authInfo, setAuthInfo] = useState<string | null>(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const [view, setView] = useState<"analytics" | "transactions">(() => {
    return (localStorage.getItem("app_view") as "analytics" | "transactions") || "analytics";
  });

  useEffect(() => {
    localStorage.setItem("app_view", view);
  }, [view]);

  const [dashboardCategory, setDashboardCategory] = useState("");
  const [dashboardWindow, setDashboardWindow] = useState<"all" | "today" | "week" | "month">("all");
  const [dashboardExpenses, setDashboardExpenses] = useState<Expense[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const [listExpenses, setListExpenses] = useState<Expense[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSort, setSelectedSort] = useState<"date_desc" | "date_asc">("date_desc");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [expenseError, setExpenseError] = useState<string | null>(null);

  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  async function loadCurrentUser() {
    try {
      const currentUser = await apiFetch<User>("/auth/me");
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setBooting(false);
    }
  }

  async function loadDashboardExpenses() {
    setDashboardLoading(true);
    try {
      const searchParams = new URLSearchParams({
        sort: "date_desc",
        page: "1",
        page_size: "100"
      });
      const [listData, analyticsData] = await Promise.all([
        apiFetch<ExpenseListResponse>(`/expenses?${searchParams.toString()}`),
        apiFetch<{ recent_expenses: Expense[] }>("/expenses/analytics")
      ]);
      setDashboardExpenses(listData.expenses);
      setRecentExpenses(analyticsData.recent_expenses);
    } catch {
      setDashboardExpenses([]);
    } finally {
      setDashboardLoading(false);
    }
  }

  async function loadTransactions(
    category = selectedCategory,
    sort: "date_desc" | "date_asc" = selectedSort,
    nextPage = page
  ) {
    setExpenseLoading(true);
    setExpenseError(null);
    try {
      const searchParams = new URLSearchParams({
        sort,
        page: String(nextPage),
        page_size: String(pageSize)
      });
      if (category) {
        searchParams.set("category", category);
      }
      const data = await apiFetch<ExpenseListResponse>(`/expenses?${searchParams.toString()}`);
      setListExpenses(data.expenses);
      setTotalCount(data.total_count);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load expenses";
      setExpenseError(message);
      if (message.toLowerCase().includes("not authenticated") || message.toLowerCase().includes("invalid")) {
        setUser(null);
      }
    } finally {
      setExpenseLoading(false);
    }
  }

  useEffect(() => {
    void loadCurrentUser();
  }, []);

  useEffect(() => {
    if (user) {
      void loadDashboardExpenses();
      void loadTransactions(selectedCategory, selectedSort, page);
    } else {
      setDashboardExpenses([]);
      setListExpenses([]);
      setSelectedCategory("");
      setSelectedSort("date_desc");
      setPage(1);
      setTotalCount(0);
      setDashboardCategory("");
      setDashboardWindow("all");
    }
  }, [user, selectedCategory, selectedSort, page]);

  async function handleAuthSubmit(payload: { email: string; password: string }) {
    setAuthLoading(true);
    setAuthError(null);
    setAuthInfo(null);

    try {
      if (authMode === "signup") {
        const currentUser = await apiFetch<User>("/auth/signup", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        setUser(currentUser);
      } else {
        const currentUser = await apiFetch<User>("/auth/login", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        setUser(currentUser);
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleCreateExpense(values: ExpenseFormValues) {
    setCreateLoading(true);
    setCreateError(null);
    try {
      await apiFetch<Expense>("/expenses", {
        method: "POST",
        body: JSON.stringify(values)
      });
      setPage(1);
      await Promise.all([loadDashboardExpenses(), loadTransactions(selectedCategory, selectedSort, 1)]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create expense";
      setCreateError(message);
      if (message.toLowerCase().includes("not authenticated") || message.toLowerCase().includes("invalid")) {
        setUser(null);
      }
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleLogout() {
    await apiFetch<void>("/auth/logout", { method: "POST" });
    setUser(null);
    setAuthMode("login");
    setAuthError(null);
    setAuthInfo(null);
  }

  if (booting) {
    return (
      <div className="modal-backdrop" style={{ background: "var(--bg-color)" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return (
      <main className="app-shell auth-shell">
        <AuthPanel
          mode={authMode}
          onModeChange={(mode) => {
            setAuthMode(mode);
            setAuthError(null);
            setAuthInfo(null);
          }}
          onSubmit={handleAuthSubmit}
          loading={authLoading}
          error={authError}
          info={authInfo}
        />
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div className="workspace-layout">
        <aside className="sidebar-panel">
          <div className="sidebar-brand">
            <h2>Expense Tracker</h2>
          </div>


          <nav className="sidebar-nav">
            <button
              type="button"
              className={view === "analytics" ? "sidebar-link active" : "sidebar-link"}
              onClick={() => setView("analytics")}
            >
              Dashboard
            </button>
            <button
              type="button"
              className={view === "transactions" ? "sidebar-link active" : "sidebar-link"}
              onClick={() => setView("transactions")}
            >
              Transactions
            </button>
          </nav>

          <footer className="sidebar-footer">
            <div className="user-info">

              <div className="email">{user.email}</div>
            </div>
            <button type="button" className="secondary-button sidebar-secondary-action" onClick={() => void handleLogout()}>
              Logout
            </button>
          </footer>
        </aside>

        <section className="content-shell">
          <header className="content-topbar">
            <h1>{view === "analytics" ? "Analytics" : "Transactions"}</h1>

            <button
              type="button"
              className="primary-button content-primary-action"
              onClick={() => setIsExpenseModalOpen(true)}
            >
              Add expense
            </button>
          </header>

          <Suspense fallback={<div className="content-shell"><p className="empty-state">Loading view...</p></div>}>
            {view === "analytics" ? (
              <DashboardView
                expenses={dashboardExpenses}
                recentExpenses={recentExpenses}
                loading={dashboardLoading}
                categoryFilter={dashboardCategory}
                onCategoryFilterChange={setDashboardCategory}
                windowFilter={dashboardWindow}
                onWindowFilterChange={setDashboardWindow}
              />
            ) : (
              <TransactionsView
                expenses={listExpenses}
                selectedCategory={selectedCategory}
                onCategoryChange={(value) => {
                  setSelectedCategory(value);
                  setPage(1);
                }}
                selectedSort={selectedSort}
                onSortChange={(value) => {
                  setSelectedSort(value);
                  setPage(1);
                }}
                page={page}
                pageSize={pageSize}
                totalCount={totalCount}
                onPageChange={setPage}
                loading={expenseLoading}
                error={expenseError}
              />
            )}
          </Suspense>
        </section>
      </div>

      {isExpenseModalOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setIsExpenseModalOpen(false)}>
          <div className="modal-shell" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <ExpenseForm
              onSubmit={handleCreateExpense}
              loading={createLoading}
              error={createError}
              onClose={() => {
                setCreateError(null);
                setIsExpenseModalOpen(false);
              }}
            />
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default App;
