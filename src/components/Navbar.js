import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar navbar-light bg-light justify-content-between px-4 shadow-sm fixed-top">
      <a className="navbar-brand fw-bold" href="/dashboard">
        🏢 HRM System
      </a>
      
      <div className="d-flex align-items-center">
        {/* User info */}
        {user && (
          <div className="me-3">
            <small className="text-muted">
              Welcome, <strong>{user.employeeName || user.email}</strong>
              <span className="badge bg-secondary ms-1">{user.role}</span>
            </small>
          </div>
        )}
        
        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="btn btn-outline-danger btn-sm"
        >
          🚪 Logout
        </button>
      </div>
    </nav>
  );
}