import { useAuth } from "../hooks/useAuth";
import Input from "../components/common/Input";
import Button from "../components/common/Button";

export default function Settings() {
  const { user, logout } = useAuth();

  return (
    <div className="page">
      <div className="page-header">
        <h1>Settings</h1>
      </div>

      <div className="card" style={{ maxWidth: 480 }}>
        <h3 style={{ marginTop: 0, fontSize: 15 }}>Profile</h3>
        <Input label="Full Name" value={user?.full_name || ""} disabled readOnly />
        <Input label="Email" value={user?.email || ""} disabled readOnly />
        <Input label="Business Name" value={user?.business_name || "—"} disabled readOnly />
        <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
          Profile editing isn&apos;t wired up yet — extend{" "}
          <code>PUT /api/v1/auth/me</code> on the backend and this form to support it.
        </p>
      </div>

      <div className="card" style={{ maxWidth: 480, marginTop: 16 }}>
        <h3 style={{ marginTop: 0, fontSize: 15 }}>Session</h3>
        <Button variant="danger" onClick={logout}>
          Log out
        </Button>
      </div>
    </div>
  );
}
