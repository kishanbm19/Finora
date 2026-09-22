import { useAuth } from "../hooks/useAuth";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import { IconLogout } from "../components/common/Icons";

export default function Settings() {
  const { user, logout } = useAuth();

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Organization &amp; Profile Settings</h1>
          <p>Manage your account credentials, workspace profile, and active session.</p>
        </div>
      </div>

      <div style={{ maxWidth: 580, display: "flex", flexDirection: "column", gap: 20 }}>
        {/* User Card */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: 700,
                boxShadow: "0 4px 10px rgba(79, 70, 229, 0.25)",
              }}
            >
              {getInitials(user?.full_name)}
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text)" }}>
                {user?.full_name || "Account Holder"}
              </div>
              <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                {user?.email}
              </div>
            </div>
          </div>

          <h3 style={{ margin: "0 0 16px 0", fontSize: 15, fontWeight: 700, borderTop: "1px solid var(--color-border-subtle)", paddingTop: 16 }}>
            Identity Credentials
          </h3>
          <Input label="Full Name" value={user?.full_name || ""} disabled readOnly />
          <Input label="Email Address" value={user?.email || ""} disabled readOnly />
          <Input label="Business Legal Name" value={user?.business_name || "—"} disabled readOnly />
          <p style={{ fontSize: 12.5, color: "var(--color-text-muted)", margin: "8px 0 0" }}>
            🔒 Managed corporate profile. To modify identity details, submit an administrative request.
          </p>
        </div>

        {/* Workspace Info */}
        <div className="card">
          <h3 style={{ margin: "0 0 10px 0", fontSize: 15, fontWeight: 700 }}>Workspace Environment</h3>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--color-border-subtle)" }}>
            <span style={{ color: "var(--color-text-muted)" }}>Platform Version</span>
            <strong>Finora OS v1.2.0</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--color-border-subtle)" }}>
            <span style={{ color: "var(--color-text-muted)" }}>Currency Engine</span>
            <strong>USD ($)</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0" }}>
            <span style={{ color: "var(--color-text-muted)" }}>Backend API Gateway</span>
            <span className="badge badge-success"><span className="badge-dot" /> Online &amp; Synced</span>
          </div>
        </div>

        {/* Session Management */}
        <div className="card">
          <h3 style={{ margin: "0 0 8px 0", fontSize: 15, fontWeight: 700 }}>Active Session</h3>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "0 0 16px 0" }}>
            End your authenticated session on this browser.
          </p>
          <Button variant="danger" onClick={logout} icon={<IconLogout size={16} />}>
            Terminate Session &amp; Log out
          </Button>
        </div>
      </div>
    </div>
  );
}
