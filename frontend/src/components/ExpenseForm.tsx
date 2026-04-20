import { FormEvent, useState } from "react";

import { categories, Category } from "../lib/categories";

export type ExpenseFormValues = {
  amount: string;
  category: Category;
  description: string;
  date: string;
};

type ExpenseFormProps = {
  onSubmit: (values: ExpenseFormValues) => Promise<void>;
  loading: boolean;
  error: string | null;
  onClose: () => void;
};

function today() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export function ExpenseForm({ onSubmit, loading, error, onClose }: ExpenseFormProps) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>("Food");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(today());

  function resetForm() {
    setAmount("");
    setCategory("Food");
    setDescription("");
    setDate(today());
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (new Date(date) > new Date()) {
      return; // Safety guard
    }
    await onSubmit({ amount, category, description, date });
    resetForm();
    onClose();
  }

  return (
    <section className="panel modal-card">
      <div className="panel-heading">
        <h2>Add expense</h2>
      </div>

      <form className="expense-form" onSubmit={handleSubmit}>
        <label>
          Amount (INR)
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="199.99"
            required
          />
        </label>

        <label>
          Category
          <select value={category} onChange={(event) => setCategory(event.target.value as Category)}>
            {categories.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label>
          Description
          <input
            type="text"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Optional"
          />
        </label>

        <label>
          Date
          <input type="date" value={date} max={today()} onChange={(event) => setDate(event.target.value)} required />
        </label>

        {error ? <p className="error-text">{error}</p> : null}

        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={resetForm} disabled={loading}>
            Clear
          </button>
          <button type="button" className="secondary-button" onClick={onClose} disabled={loading}>
            Close
          </button>
          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Add expense"}
          </button>
        </div>
      </form>
    </section>
  );
}
