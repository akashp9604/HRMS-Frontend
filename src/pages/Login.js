import React, { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(""); // Clear previous errors

    try {
      // Call backend login API without Basic Auth
      const res = await axios.post("http://localhost:8088/api/employees/login", {
        email,
        password,
      });

      console.log("Login Response:", res.data); // Debugging - check what backend returns

      // ⭐ IMPORTANT: Extract JWT token from response
      const token = res.data.token || res.data.jwt || res.data.accessToken;
      const { role, id, name } = res.data;

      if (!token) {
        throw new Error("No token received from server");
      }

      // ✅ Save credentials for secured endpoints
      localStorage.setItem("jwt_token", token);
      localStorage.setItem("user", JSON.stringify({ email, role, id, name }));


      // ✅ Pass the correct parameters: email, role, id (as employeeId), name (as employeeName)
      login(email, role, id, name,token);
    
      navigate("/dashboard");
    } catch (err) {
      console.error("Login failed:", err);
      
      // Handle different error scenarios
      if (err.response) {
        // Server responded with error status
        const status = err.response.status;
        const message = err.response.data?.message || err.response.data;
        
        if (status === 404) {
          setError("User not found");
        } else if (status === 401) {
          setError("Invalid credentials");
        } else if (status === 403) {
          setError("Account deactivated. Please contact administrator.");
        } else if (status === 400) {
          // Check if it's a "user not found" message from backend
          const errorMessage = message.toLowerCase();
          if (errorMessage.includes("not found") || 
              errorMessage.includes("no user") || 
              errorMessage.includes("deleted") ||
              errorMessage.includes("does not exist")) {
            setError("User not found");
          } else {
            setError("Invalid email or password");
          }
        } else {
          setError(message || "Login failed. Please try again.");
        }
      } else if (err.request) {
        // Network error - request was made but no response received
        setError("Network error. Please check your connection.");
      } else {
        // Other errors
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card p-4 shadow w-100" style={{ maxWidth: "400px" }}>
        <h3 className="text-center mb-4">Employee Login</h3>
        
        {/* Error Message Display */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setError("")}
            ></button>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label>Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(""); // Clear error when user starts typing
              }}
              required
            />
          </div>

          <div className="mb-3">
            <label>Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(""); // Clear error when user starts typing
              }}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Forgot Password Link */}
        <div className="text-center mt-3">
          <Link 
            to="/forgot-password" 
            className="text-decoration-none text-primary"
          >
            Forgot your password?
          </Link>
        </div>

        <p className="text-center mt-3">
          Don't have an account?{" "}
          <Link to="/register" className="text-decoration-none">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}