import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Sidebar() {
  const { user } = useContext(AuthContext);

  // Check user role
  const isAdmin = user && (user.role === "HR" || user.role === "ADMIN" || user.role === "MANAGER");
  const isEmployee = user && user.role === "EMPLOYEE";

  return (
    <div
      className="bg-dark text-white vh-100 p-3"
      style={{
        width: "250px",
        position: "fixed",
        top: 0,
        left: 0,
        overflowY: "auto",
        zIndex: 1000,
      }}
    >
      <h4 className="text-center mb-4">HRM System</h4>
      <ul className="nav flex-column">
        {/* Dashboard - Visible to all */}
        <li className="nav-item mb-2">
          <Link className="nav-link text-white" to="/dashboard">
            📊 Dashboard
          </Link>
        </li>
        
        {/* ADMIN ONLY MENU ITEMS */}
        {isAdmin && (
          <>
            <li className="nav-item mb-2">
              <Link className="nav-link text-white" to="/employees">
                👥 Employees
              </Link>
            </li>
            <li className="nav-item mb-2">
              <Link className="nav-link text-white" to="/attendance">
                📅 Attendance
              </Link>
            </li>
            <li className="nav-item mb-2">
              <Link className="nav-link text-white" to="/leaves">
                🍃 Leaves
              </Link>
            </li>
            <li className="nav-item mb-2">
              <Link className="nav-link text-white" to="/payroll">
                💰 Payroll
              </Link>
            </li>

            {/* Reports tab removed for admin */}
          </>
        )}

        {/* EMPLOYEE ONLY MENU ITEMS */}
        {isEmployee && (
          <>
            {/* Attendance tab removed from employee sidebar */}
            <li className="nav-item mb-2">
              <Link className="nav-link text-white" to="/leaves">
                🍃 Leaves
              </Link>
            </li>
            <li className="nav-item mb-2">
              <Link className="nav-link text-white" to="/reports">
                📊 Payslips
              </Link>
            </li>
          </>
        )}

        {/* COMMON MENU ITEMS (Visible to all roles) */}
        {/* <li className="nav-item mb-2">
           <Link className="nav-link text-white" to="/profile" >
             👤 Profile
           </Link> 
      
        </li> */}

      </ul>

      {/* User info footer */}
      {user && (
        <div className="mt-5 pt-4 border-top">
          <small className="nav-link text-white">
            Logged in as: <br />
            <strong>{user.employeeName || user.email}</strong> <br />
            <span className="badge bg-info">{user.role}</span>
          </small>
        </div>
      )}
    </div>
  );
}