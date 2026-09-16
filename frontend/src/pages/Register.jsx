import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Input from "../components/common/Input";
import Button from "../components/common/Button";

export default function Register() {
  const { register, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", businessName: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(form);
      await login({ email: form.email, password: form.password });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Could not create account.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <h1>Create your account</h1>
        <p className="subtitle">Start managing your business finances</p>

        <Input
          label="Full name"
          name="fullName"
          value={form.fullName}
          onChange={handleChange}
          placeholder="Jane Doe"
          required
        />
        <Input
          label="Business name (optional)"
          name="businessName"
          value={form.businessName}
          onChange={handleChange}
          placeholder="Jane's Bakery"
        />
        <Input
          label="Email"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="you@business.com"
          required
        />
        <Input
          label="Password"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="At least 8 characters"
          minLength={8}
          required
        />

        {error && <p className="error-text">{error}</p>}

        <Button type="submit" fullWidth disabled={submitting} style={{ marginTop: 8 }}>
          {submitting ? "Creating account…" : "Create account"}
        </Button>

        <p style={{ marginTop: 16, fontSize: 14, textAlign: "center" }}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
