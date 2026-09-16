import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

import DashboardLayout from "../components/layout/DashboardLayout";
import Loader from "../components/common/Loader";

import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import Transactions from "../pages/Transactions";
import Invoices from "../pages/Invoices";
import Expenses from "../pages/Expenses";
import Customers from "../pages/Customers";
import Accounts from "../pages/Accounts";
import Reports from "../pages/Reports";
import Analytics from "../pages/Analytics";
import Settings from "../pages/Settings";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <Loader label="Checking session…" />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <Loader label="Loading…" />;
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <Register />
          </PublicOnlyRoute>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="customers" element={<Customers />} />
        <Route path="accounts" element={<Accounts />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
