import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Dropdown } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar navbar-light bg-light justify-content-between px-4 shadow-sm fixed-top">
      <a className="navbar-brand fw-bold" href="/dashboard">🏢 HRM System</a>
      <div className="d-flex align-items-center">
        {user && (
          <Dropdown>
            <Dropdown.Toggle variant="link" className="text-dark text-decoration-none d-flex align-items-center">
              <span className="me-2">
                Welcome, <strong>{user.employeeName || user.email}</strong>
                <span className="badge bg-secondary ms-1">{user.role}</span>
              </span>
            </Dropdown.Toggle>

            <Dropdown.Menu align="end">
              <Dropdown.Item onClick={() => navigate("/profile")}>
                My Profile
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item onClick={handleLogout} className="text-danger">
                Logout
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        )}
      </div>
    </nav>
  );
}