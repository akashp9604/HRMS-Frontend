import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1); // 1: Request OTP, 2: Reset Password
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" or "error"
  const navigate = useNavigate();

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setMessageType("");

    try {
      const response = await axios.post("http://localhost:8088/api/employees/forgot-password", {
        email
      });
      
      setMessage("OTP sent to your email address");
      setMessageType("success");
      setStep(2);
    } catch (err) {
      setMessage(err.response?.data || "Failed to send OTP. Please try again.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setMessageType("");

    try {
      const response = await axios.post("http://localhost:8088/api/employees/reset-password", {
        email,
        otp,
        newPassword
      });
      
      setMessage("Password reset successfully! Redirecting to login...");
      setMessageType("success");
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setMessage(err.response?.data || "Failed to reset password. Please check your OTP and try again.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card p-4 shadow w-100" style={{ maxWidth: "450px" }}>
        <h3 className="text-center mb-4 text-primary">Forgot Password</h3>
        
        {/* Message Alert */}
        {message && (
          <div 
            className={`alert ${
              messageType === "success" ? "alert-success" : "alert-danger"
            } alert-dismissible fade show`}
            role="alert"
          >
            {message}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setMessage("")}
            ></button>
          </div>
        )}

        {step === 1 ? (
          // Step 1: Request OTP
          <form onSubmit={handleRequestOTP}>
            <div className="mb-4">
              <label className="form-label fw-semibold">Email Address</label>
              <input
                type="email"
                className="form-control form-control-lg"
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <div className="form-text text-muted">
                We'll send a 6-digit OTP to your email address.
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg w-100 py-2"
              disabled={loading || !email}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Sending OTP...
                </>
              ) : (
                "Send OTP"
              )}
            </button>
          </form>
        ) : (
          // Step 2: Reset Password
          <form onSubmit={handleResetPassword}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Email Address</label>
              <input
                type="email"
                className="form-control"
                value={email}
                readOnly
                disabled
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">OTP Code</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
                pattern="[0-9]{6}"
              />
              <div className="form-text text-muted">
                Enter the 6-digit OTP sent to your email.
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label fw-semibold">New Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Enter your new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
              <div className="form-text text-muted">
                Password must be at least 6 characters long.
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg w-100 py-2"
              disabled={loading || !otp || !newPassword}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Resetting Password...
                </>
              ) : (
                "Reset Password"
              )}
            </button>

            <button
              type="button"
              className="btn btn-outline-secondary w-100 mt-2"
              onClick={() => setStep(1)}
              disabled={loading}
            >
              Back to Email
            </button>
          </form>
        )}

        <div className="text-center mt-4">
          <Link to="/login" className="text-decoration-none text-primary">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}