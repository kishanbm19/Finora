import { useAuth } from "../../hooks/useAuth";
import Button from "../common/Button";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: 16,
        padding: "14px 32px",
        borderBottom: "1px solid var(--color-border)",
        background: "#fff",
      }}
    >
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{user?.full_name}</div>
        <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
          {user?.business_name || user?.email}
        </div>
      </div>
      <Button variant="secondary" onClick={logout}>
        Log out
      </Button>
    </header>
  );
}
