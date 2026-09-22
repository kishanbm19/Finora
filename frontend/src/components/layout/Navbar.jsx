import { useAuth } from "../../hooks/useAuth";
import Button from "../common/Button";
import { IconLogout } from "../common/Icons";

export default function Navbar() {
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
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 36px",
        borderBottom: "1px solid var(--color-border)",
        background: "#ffffff",
        position: "sticky",
        top: 0,
        zIndex: 20,
        boxShadow: "var(--shadow-xs)",
      }}
    >
      {/* Workspace Indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "5px 12px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 20,
            fontSize: 12.5,
            fontWeight: 600,
            color: "#334155",
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#10b981",
              boxShadow: "0 0 6px rgba(16, 185, 129, 0.6)",
            }}
          />
          <span>{user?.business_name || "Personal Workspace"}</span>
        </div>
      </div>

      {/* User Info & Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12.5,
              fontWeight: 700,
              boxShadow: "0 2px 5px rgba(79, 70, 229, 0.2)",
            }}
          >
            {getInitials(user?.full_name)}
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--color-text)", lineHeight: 1.2 }}>
              {user?.full_name || "Account User"}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--color-text-muted)" }}>
              {user?.email}
            </div>
          </div>
        </div>

        <Button
          variant="secondary"
          onClick={logout}
          style={{
            padding: "7px 12px",
            fontSize: 12.5,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <IconLogout size={14} color="var(--color-text-muted)" />
          <span>Log out</span>
        </Button>
      </div>
    </header>
  );
}
