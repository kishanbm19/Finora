import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Input from "../components/common/Input";
import Button from "../components/common/Button";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(form);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <form className="auth-card" onSubmit={handleSubmit}>
        {/* Brand Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 20,
              boxShadow: "0 4px 12px rgba(79, 70, 229, 0.35)",
            }}
          >
            F
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)", letterSpacing: "-0.02em" }}>
              Finora
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-primary)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Finance OS
            </div>
          </div>
        </div>

        <h1>Welcome back</h1>
        <p className="subtitle">Sign in to your Finora organization workspace</p>

        <Input
          label="Work Email Address"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="name@business.com"
          required
        />
        <Input
          label="Password"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="••••••••"
          required
        />

        {error && <p className="error-text">{error}</p>}

        <Button type="submit" fullWidth disabled={submitting} style={{ marginTop: 12, height: 44, fontSize: 14 }}>
          {submitting ? "Signing in…" : "Sign In to Workspace"}
        </Button>

        <p style={{ marginTop: 20, fontSize: 13.5, textAlign: "center", color: "var(--color-text-muted)" }}>
          Don&apos;t have an account?{" "}
          <Link to="/register" style={{ fontWeight: 600, color: "var(--color-primary)" }}>
            Create one free
          </Link>
        </p>
      </form>
    </div>
  );
}
