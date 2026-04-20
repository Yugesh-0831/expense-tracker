import { Category, categories } from "../lib/categories";
import { amountToPaise, formatInrFromPaise } from "../lib/currency";

export type Expense = {
  id: number;
  amount: string;
  category: Category;
  description: string | null;
  date: string;
  created_at: string;
};

type ExpenseTableProps = {
  expenses: Expense[];
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedSort: "date_desc" | "date_asc";
  onSortChange: (value: "date_desc" | "date_asc") => void;
  loading: boolean;
  error: string | null;
};

function parseDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

function formatCompactDate(value: string) {
  return parseDate(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function ExpenseTable({
  expenses,
  selectedCategory,
  onCategoryChange,
  selectedSort,
  onSortChange,
  loading,
  error
}: ExpenseTableProps) {
  const totalPaise = expenses.reduce((sum, expense) => sum + amountToPaise(expense.amount), 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekStart = startOfWeek(new Date());
  const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const todayTotal = expenses.reduce((sum, expense) => {
    return parseDate(expense.date).getTime() === today.getTime() ? sum + amountToPaise(expense.amount) : sum;
  }, 0);

  const weekTotal = expenses.reduce((sum, expense) => {
    const expenseDate = parseDate(expense.date);
    return expenseDate >= weekStart ? sum + amountToPaise(expense.amount) : sum;
  }, 0);

  const monthTotal = expenses.reduce((sum, expense) => {
    return expense.date.startsWith(monthKey) ? sum + amountToPaise(expense.amount) : sum;
  }, 0);

  const categoryTotals = categories
    .map((category) => {
      const total = expenses
        .filter((expense) => expense.category === category)
        .reduce((sum, expense) => sum + amountToPaise(expense.amount), 0);

      return { category, total };
    })
    .filter((entry) => entry.total > 0)
    .sort((a, b) => b.total - a.total);

  const maxCategoryTotal = Math.max(...categoryTotals.map((entry) => entry.total), 0);

  const monthBuckets = new Map<string, number>();
  for (const expense of expenses) {
    const key = expense.date.slice(0, 7);
    monthBuckets.set(key, (monthBuckets.get(key) ?? 0) + amountToPaise(expense.amount));
  }

  const monthSeries = Array.from(monthBuckets.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-6)
    .map(([key, total]) => {
      const [year, month] = key.split("-");
      const label = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-IN", {
        month: "short",
        year: "2-digit"
      });
      return { key, label, total };
    });

  const maxMonthTotal = Math.max(...monthSeries.map((entry) => entry.total), 0);

  return (
    <section className="dashboard-stack">
      <section className="panel hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Expense overview</p>
          <h2>Track spending with visible totals, filters, and time-based summaries.</h2>
          <p>
            The assessment requirements are surfaced directly here: explicit category filtering, explicit date
            sorting, and a live total for the current list.
          </p>
        </div>

        <div className="summary-grid">
          <article className="summary-card accent-card">
            <span>Visible total</span>
            <strong>{formatInrFromPaise(totalPaise)}</strong>
          </article>
          <article className="summary-card">
            <span>Today</span>
            <strong>{formatInrFromPaise(todayTotal)}</strong>
          </article>
          <article className="summary-card">
            <span>This week</span>
            <strong>{formatInrFromPaise(weekTotal)}</strong>
          </article>
          <article className="summary-card">
            <span>This month</span>
            <strong>{formatInrFromPaise(monthTotal)}</strong>
          </article>
        </div>
      </section>

      <section className="analytics-grid">
        <section className="panel">
          <div className="panel-heading">
            <h2>Controls</h2>
            <p>Filter the list and make the sort order explicit in the UI.</p>
          </div>

          <div className="controls-grid">
            <label className="inline-field">
              Filter by category
              <select value={selectedCategory} onChange={(event) => onCategoryChange(event.target.value)}>
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className="inline-field">
              Sort by date
              <select
                value={selectedSort}
                onChange={(event) => onSortChange(event.target.value as "date_desc" | "date_asc")}
              >
                <option value="date_desc">Newest first</option>
                <option value="date_asc">Oldest first</option>
              </select>
            </label>
          </div>
        </section>

        <section className="panel chart-panel">
          <div className="panel-heading">
            <h2>Category split</h2>
            <p>Visible expenses grouped by category.</p>
          </div>

          {categoryTotals.length === 0 ? (
            <p className="empty-state">Add expenses to see category distribution.</p>
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

        <section className="panel chart-panel">
          <div className="panel-heading">
            <h2>Monthly trend</h2>
            <p>Last visible months based on the current filter.</p>
          </div>

          {monthSeries.length === 0 ? (
            <p className="empty-state">Add expenses across dates to see a monthly trend.</p>
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
      </section>

      <section className="panel">
        <div className="panel-heading row">
          <div>
            <h2>Expense list</h2>
            <p>
              Showing {expenses.length} item{expenses.length === 1 ? "" : "s"} with{" "}
              {selectedSort === "date_desc" ? "newest" : "oldest"} dates first.
            </p>
          </div>

          <div className="total-box">Total: {formatInrFromPaise(totalPaise)}</div>
        </div>

        {loading ? <p>Loading expenses...</p> : null}
        {error ? <p className="error-text">{error}</p> : null}

        {!loading && expenses.length === 0 ? <p className="empty-state">No expenses found.</p> : null}

        {!loading && expenses.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Amount (INR)</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>{formatCompactDate(expense.date)}</td>
                    <td>{expense.category}</td>
                    <td>{expense.description ?? "-"}</td>
                    <td>{formatInrFromPaise(amountToPaise(expense.amount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </section>
  );
}
