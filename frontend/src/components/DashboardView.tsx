import { categories } from "../lib/categories";
import { amountToPaise, formatInrFromPaise } from "../lib/currency";
import { Expense } from "./ExpenseTable";

type DashboardViewProps = {
  expenses: Expense[];
  recentExpenses: Expense[];
  loading: boolean;
  categoryFilter: string;
  onCategoryFilterChange: (category: string) => void;
  windowFilter: "all" | "today" | "week" | "month";
  onWindowFilterChange: (window: "all" | "today" | "week" | "month") => void;
};

function parseDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function formatCompactDate(value: string) {
  return parseDate(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

export function DashboardView({
  expenses,
  recentExpenses,
  categoryFilter,
  onCategoryFilterChange,
  windowFilter,
  onWindowFilterChange,
  loading
}: DashboardViewProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekStart = startOfWeek(new Date());
  const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const filteredExpenses = expenses.filter((expense) => {
    if (categoryFilter && expense.category !== categoryFilter) {
      return false;
    }

    if (windowFilter === "today") {
      return parseDate(expense.date).getTime() === today.getTime();
    }

    if (windowFilter === "week") {
      return parseDate(expense.date) >= weekStart;
    }

    if (windowFilter === "month") {
      return expense.date.startsWith(monthKey);
    }

    return true;
  });

  const visibleTotal = filteredExpenses.reduce((sum, expense) => sum + amountToPaise(expense.amount), 0);
  const todayTotal = expenses.reduce((sum, expense) => {
    return parseDate(expense.date).getTime() === today.getTime() ? sum + amountToPaise(expense.amount) : sum;
  }, 0);
  const weekTotal = expenses.reduce((sum, expense) => {
    return parseDate(expense.date) >= weekStart ? sum + amountToPaise(expense.amount) : sum;
  }, 0);
  const monthTotal = expenses.reduce((sum, expense) => {
    return expense.date.startsWith(monthKey) ? sum + amountToPaise(expense.amount) : sum;
  }, 0);

  const categoryTotals = categories
    .map((category) => {
      const total = filteredExpenses
        .filter((expense) => expense.category === category)
        .reduce((sum, expense) => sum + amountToPaise(expense.amount), 0);
      return { category, total };
    })
    .filter((entry) => entry.total > 0)
    .sort((left, right) => right.total - left.total);

  const maxCategoryTotal = Math.max(...categoryTotals.map((entry) => entry.total), 0);

  const monthBuckets = new Map<string, number>();
  for (const expense of filteredExpenses) {
    const key = expense.date.slice(0, 7);
    monthBuckets.set(key, (monthBuckets.get(key) ?? 0) + amountToPaise(expense.amount));
  }

  const monthSeries = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(today.getFullYear(), i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const total = monthBuckets.get(key) ?? 0;
    const label = d.toLocaleDateString("en-IN", {
      month: "short"
    });
    monthSeries.push({ key, label, total });
  }

  const maxMonthTotal = Math.max(...monthSeries.map((entry) => entry.total), 0);

  return (
    <section className="content-stack">
      <section className="panel analytics-header">


        <div className="toolbar-grid">
          <label>
            Category
            <select value={categoryFilter} onChange={(event) => onCategoryFilterChange(event.target.value)}>
              <option value="">All</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label>
            Window
            <select
              value={windowFilter}
              onChange={(event) =>
                onWindowFilterChange(event.target.value as "all" | "today" | "week" | "month")
              }
            >
              <option value="all">All time</option>
              <option value="today">Today</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
          </label>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card stat-card-primary">
          <span>Visible total</span>
          <strong>{formatInrFromPaise(visibleTotal)}</strong>
        </article>
        <article className="stat-card">
          <span>Today</span>
          <strong>{formatInrFromPaise(todayTotal)}</strong>
        </article>
        <article className="stat-card">
          <span>This week</span>
          <strong>{formatInrFromPaise(weekTotal)}</strong>
        </article>
        <article className="stat-card">
          <span>This month</span>
          <strong>{formatInrFromPaise(monthTotal)}</strong>
        </article>
      </section>

      <section className="analytics-two-up">
        {/* Monthly Trend - Move to the LEFT */}
        <section className="panel">
          <div className="panel-heading">
            <h2>Monthly trend</h2>
          </div>

          {loading ? <p>Loading trend...</p> : null}
          {!loading && monthSeries.length === 0 ? (
            <p className="empty-state">Add expenses across multiple dates to populate the trend.</p>
          ) : (
            <div className="month-chart">
              {monthSeries.map((entry) => (
                <div key={entry.key} className="month-column">
                  <span className="month-amount">{formatInrFromPaise(entry.total)}</span>
                  <div className="month-track">
                    <div
                      className="month-fill"
                      style={{ height: `${Math.max((entry.total / maxMonthTotal) * 100, 12)}%` }}
                    />
                  </div>
                  <span className="month-label">{entry.label}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Category Split - Move to the RIGHT */}
        <section className="panel">
          <div className="panel-heading">
            <h2>Category split</h2>
          </div>

          {loading ? <p>Loading analytics...</p> : null}
          {!loading && categoryTotals.length === 0 ? (
            <p className="empty-state">No expenses available for the selected filters.</p>
          ) : (
            <div className="bar-chart">
              {categoryTotals.map((entry) => (
                <div key={entry.category} className="bar-row">
                  <div className="bar-labels">
                    <span>{entry.category}</span>
                    <span>{formatInrFromPaise(entry.total)}</span>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ width: `${(entry.total / maxCategoryTotal) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>Recently added</h2>
        </div>

        {loading ? <p>Loading transactions...</p> : null}
        {!loading && recentExpenses.length === 0 ? (
          <p className="empty-state">No transactions added yet.</p>
        ) : (
          <div className="top-list">
            {recentExpenses.map((expense) => (
              <article key={expense.id} className="top-list-item">
                <div style={{ flex: 1 }}>
                  <strong>{expense.description || expense.category}</strong>
                  <p>
                    {expense.category} - {formatCompactDate(expense.date)}
                  </p>
                </div>
                <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span>{formatInrFromPaise(amountToPaise(expense.amount))}</span>
                  {expense.created_at && (
                    <small style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 600 }}>
                      Added on {new Date(expense.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </small>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
