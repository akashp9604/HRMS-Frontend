import React, { useState } from "react";
import API from "../apis/employeeApi";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("EMPLOYEE");
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("");
  const [dateOfJoining, setDateOfJoining] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Now payload without status & salary
      const payload = {
        name,
        email,
        role,
        designation,
        department,
        dateOfJoining,
      };

      console.log("➡ Register payload:", payload);
      const res = await API.post("/register", payload);

      alert("✅ Registration successful! Password sent to your email.");
      console.log("✅ Register response:", res.data);

      navigate("/");
    } catch (err) {
      console.error("❌ Register error:", err);
      const serverMsg = err?.response?.data || "Registration failed";
      alert(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card p-4 shadow w-100" style={{ maxWidth: "500px" }}>
        <h3 className="text-center mb-4">Register Employee</h3>
        <form onSubmit={handleRegister}>

          <div className="mb-3">
            <label>Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label>Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label>Role</label>
            <select
              className="form-control"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="HR">HR</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div className="mb-3">
            <label>Designation</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g., Software Engineer"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label>Department</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g., IT, HR, Finance"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label>Date of Joining</label>
            <input
              type="date"
              className="form-control"
              value={dateOfJoining}
              onChange={(e) => setDateOfJoining(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-success w-100"
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="text-center mt-3">
          Already have an account?{" "}
          <Link to="/" className="text-decoration-none">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
