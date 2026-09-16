import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function DashboardLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <Outlet />
      </div>
    </div>
  );
}
