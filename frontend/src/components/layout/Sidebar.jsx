import { NavLink } from "react-router-dom";
import {
  IconDashboard,
  IconTransactions,
  IconInvoice,
  IconExpense,
  IconCustomers,
  IconAccounts,
  IconAnalytics,
  IconReports,
  IconSettings,
} from "../common/Icons";

const NAV_GROUPS = [
  {
    title: "MAIN",
    items: [{ to: "/", label: "Dashboard", icon: IconDashboard, end: true }],
  },
  {
    title: "OPERATIONS",
    items: [
      { to: "/transactions", label: "Transactions", icon: IconTransactions },
      { to: "/invoices", label: "Invoices", icon: IconInvoice },
      { to: "/expenses", label: "Expenses", icon: IconExpense },
      { to: "/customers", label: "Customers", icon: IconCustomers },
    ],
  },
  {
    title: "FINANCIALS",
    items: [
      { to: "/accounts", label: "Accounts", icon: IconAccounts },
      { to: "/analytics", label: "Analytics", icon: IconAnalytics },
      { to: "/reports", label: "Reports", icon: IconReports },
    ],
  },
  {
    title: "SYSTEM",
    items: [{ to: "/settings", label: "Settings", icon: IconSettings }],
  },
];

export default function Sidebar() {
  return (
    <aside
      style={{
        width: 240,
        background: "#090d16",
        borderRight: "1px solid #1e293b",
        color: "#cbd5e1",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        minHeight: "100vh",
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: "24px 20px 20px 20px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            fontWeight: 800,
            fontSize: 18,
            boxShadow: "0 0 16px rgba(99, 102, 241, 0.4)",
          }}
        >
          F
        </div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#ffffff", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
            Finora
          </div>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "#818cf8",
            }}
          >
            Finance OS
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav
        style={{
          padding: "20px 14px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 20,
          overflowY: "auto",
        }}
      >
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: "#64748b",
                padding: "0 10px 8px 10px",
              }}
            >
              {group.title}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {group.items.map((item) => {
                const IconComponent = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    style={({ isActive }) => ({
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8.5px 12px",
                      borderRadius: 8,
                      fontSize: 13.5,
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? "#ffffff" : "#94a3b8",
                      background: isActive ? "linear-gradient(90deg, #3730a3 0%, #4338ca 100%)" : "transparent",
                      boxShadow: isActive ? "0 2px 8px rgba(67, 56, 202, 0.35)" : "none",
                      border: isActive ? "1px solid rgba(129, 140, 248, 0.25)" : "1px solid transparent",
                      transition: "all 0.15s ease",
                    })}
                  >
                    {({ isActive }) => (
                      <>
                        <IconComponent
                          size={17}
                          color={isActive ? "#ffffff" : "#94a3b8"}
                          style={{ transition: "color 0.15s ease" }}
                        />
                        <span>{item.label}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer Indicator */}
      <div
        style={{
          padding: "16px 20px",
          borderTop: "1px solid rgba(255, 255, 255, 0.06)",
          background: "rgba(0, 0, 0, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#10b981",
              boxShadow: "0 0 8px #10b981",
            }}
          />
          <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>Finora Live</span>
        </div>
        <span
          style={{
            fontSize: 11,
            color: "#64748b",
            background: "rgba(255, 255, 255, 0.05)",
            padding: "2px 6px",
            borderRadius: 4,
            fontWeight: 600,
          }}
        >
          PRO
        </span>
      </div>
    </aside>
  );
}
