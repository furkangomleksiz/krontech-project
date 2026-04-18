"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminLogin, saveCredentials, AdminApiError } from "@/lib/api/admin";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await adminLogin(email, password);
      saveCredentials(res.accessToken, res.role, res.email);
      router.push("/admin");
    } catch (err) {
      if (err instanceof AdminApiError && err.status === 401) {
        setError("Invalid email or password.");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Login failed. Check that the API server is running.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <h1 className="admin-login-title">Kron Admin</h1>
        <p className="admin-login-subtitle">Sign in to manage content</p>
        <form onSubmit={handleSubmit} className="admin-login-form">
          {error && <div className="admin-error-banner">{error}</div>}
          <div className="admin-field">
            <label htmlFor="email" className="admin-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="admin-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
              required
            />
          </div>
          <div className="admin-field">
            <label htmlFor="password" className="admin-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="admin-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="admin-btn admin-btn--primary admin-btn--lg admin-btn--full"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
