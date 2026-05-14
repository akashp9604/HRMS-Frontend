import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Header() {
  const { user } = useContext(AuthContext);

  const getDashboardTitle = () => {
    switch (user?.role?.toUpperCase()) {
      case "HR":
        return "HR Dashboard";
      case "ADMIN":
        return "Admin Dashboard";
      case "MANAGER":
        return "Manager Dashboard";
      case "EMPLOYEE":
        return "Employee Dashboard";
      default:
        return "Dashboard";
    }
  };

  return (
    <div className="d-flex justify-content-between align-items-center p-2 border-bottom bg-white shadow-sm">
      {/* Left - Dashboard Title */}
      <h5 className="m-0">{getDashboardTitle()}</h5>

      {/* Right - User Info */}
      <div>
        {user?.name || "Guest"}{" "}
        <span className="text-muted">({user?.role || "N/A"})</span>
      </div>
    </div>
  );
}
