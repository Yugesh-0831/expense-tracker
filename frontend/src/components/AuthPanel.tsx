import { FormEvent, useState } from "react";

type AuthMode = "login" | "signup";

type AuthPanelProps = {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onSubmit: (payload: { email: string; password: string }) => Promise<void>;
  loading: boolean;
  error: string | null;
  info: string | null;
};

export function AuthPanel({ mode, onModeChange, onSubmit, loading, error, info }: AuthPanelProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setClientError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setClientError("Email is required.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setClientError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setClientError("Password is required.");
      return;
    }

    if (password.length < 8) {
      setClientError("Password must be at least 8 characters.");
      return;
    }

    await onSubmit({ email: trimmedEmail, password });
  }

  return (
    <div className="auth-layout">
      <section className="auth-hero">
        <h1>Expense tracking made simple.</h1>
        <p className="auth-copy">
          Join thousands managing their finances with ease.
        </p>
      </section>

      <section className="panel auth-panel">
        <div className="auth-header">
          <p className="auth-panel-label">{mode === "login" ? "Welcome back" : "Create your account"}</p>
          <h2>{mode === "login" ? "Login" : "Signup"}</h2>
          <p>{mode === "login" ? "Use your account to continue." : "Start with email and password."}</p>
        </div>

        <div className="auth-toggle">
          <button
            type="button"
            className={mode === "login" ? "active" : ""}
            onClick={() => {
              setClientError(null);
              setEmail("");
              setPassword("");
              onModeChange("login");
            }}
          >
            Login
          </button>
          <button
            type="button"
            className={mode === "signup" ? "active" : ""}
            onClick={() => {
              setClientError(null);
              setEmail("");
              setPassword("");
              onModeChange("signup");
            }}
          >
            Signup
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={mode === "signup" ? 8 : undefined}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
            />
          </label>

          {info ? <p className="info-text">{info}</p> : null}
          {clientError ? <p className="error-text">{clientError}</p> : null}
          {error ? <p className="error-text">{error}</p> : null}

          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
          </button>
        </form>
      </section>
    </div>
  );
}
