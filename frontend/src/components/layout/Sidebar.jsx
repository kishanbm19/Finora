import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/transactions", label: "Transactions" },
  { to: "/invoices", label: "Invoices" },
  { to: "/expenses", label: "Expenses" },
  { to: "/customers", label: "Customers" },
  { to: "/accounts", label: "Accounts" },
  { to: "/analytics", label: "Analytics" },
  { to: "/reports", label: "Reports" },
  { to: "/settings", label: "Settings" },
];

export default function Sidebar() {
  return (
    <aside
      style={{
        width: 220,
        background: "#111827",
        color: "#e5e7eb",
        padding: "20px 16px",
        flexShrink: 0,
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 28, paddingLeft: 8 }}>
        Finora
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            style={({ isActive }) => ({
              padding: "9px 12px",
              borderRadius: 8,
              fontSize: 14,
              color: isActive ? "#fff" : "#9ca3af",
              background: isActive ? "#312e81" : "transparent",
            })}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
