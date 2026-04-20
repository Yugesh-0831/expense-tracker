import { categories } from "../lib/categories";
import { amountToPaise, formatInrFromPaise } from "../lib/currency";
import { Expense } from "./ExpenseTable";

type TransactionsViewProps = {
  expenses: Expense[];
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedSort: "date_desc" | "date_asc";
  onSortChange: (value: "date_desc" | "date_asc") => void;
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  loading: boolean;
  error: string | null;
};

function formatCompactDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

export function TransactionsView({
  expenses,
  selectedCategory,
  onCategoryChange,
  selectedSort,
  onSortChange,
  page,
  pageSize,
  totalCount,
  onPageChange,
  loading,
  error
}: TransactionsViewProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <section className="content-stack">
      <section className="panel analytics-header">
        <div className="analytics-header-content">
          <h2>Transaction History</h2>
        </div>

        <div className="toolbar-grid">
          <label>
            Category
            <select value={selectedCategory} onChange={(event) => onCategoryChange(event.target.value)}>
              <option value="">All</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label>
            Date
            <select
              value={selectedSort}
              onChange={(event) => onSortChange(event.target.value as "date_desc" | "date_asc")}
            >
              <option value="date_desc">Newest</option>
              <option value="date_asc">Oldest</option>
            </select>
          </label>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading row">
          <div>
            <h2>Transaction list</h2>
          </div>
          <div className="total-box">
            Page total: {formatInrFromPaise(expenses.reduce((sum, expense) => sum + amountToPaise(expense.amount), 0))}
          </div>
        </div>

        {error ? <p className="error-text">{error}</p> : null}

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
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`}>
                    <td><div className="skeleton" style={{ width: "80px" }} /></td>
                    <td><div className="skeleton" style={{ width: "100px" }} /></td>
                    <td><div className="skeleton" /></td>
                    <td><div className="skeleton" style={{ width: "60px" }} /></td>
                  </tr>
                ))
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="empty-state" style={{ textAlign: "center", padding: "40px" }}>
                    No transactions found for the selected filters.
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>{formatCompactDate(expense.date)}</td>
                    <td>{expense.category}</td>
                    <td>{expense.description ?? "-"}</td>
                    <td>{formatInrFromPaise(amountToPaise(expense.amount))}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination-row">
          <button
            type="button"
            className="secondary-button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || loading}
          >
            Previous
          </button>
          <span>
            {loading ? "Fetching transactions..." : `Showing ${expenses.length} of ${totalCount}`}
          </span>
          <button
            type="button"
            className="secondary-button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || loading}
          >
            Next
          </button>
        </div>
      </section>
    </section>
  );
}
