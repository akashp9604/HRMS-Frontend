import React, { useEffect, useState, useContext } from "react";
import axiosInstance from "../apis/axiosConfig";
import StatCard from "../components/StatCard";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [monthlyPayroll, setMonthlyPayroll] = useState(0);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [payslipCount, setPayslipCount] = useState(0);
  const [attendanceSummary, setAttendanceSummary] = useState({
    present: 0,
    absent: 0
  });
  const [loading, setLoading] = useState(true);
  const [showWelcomeAlert, setShowWelcomeAlert] = useState(true); // ✅ Add this

  const navigate = useNavigate();

  // ✅ Fetch Total Employees with JWT
  useEffect(() => {
    const fetchEmployeeCount = async () => {
      try {
        const response = await axiosInstance.get("http://localhost:8088/api/employees/count");
        const count = typeof response.data === "object" ? response.data.count : response.data;
        setEmployeeCount(count);
      } catch (error) {
        console.error("Error fetching employee count:", error.response || error);
        if (error.response?.status === 401) {
          navigate("/login");
        }
      }
    };
    
    fetchEmployeeCount();
  }, [navigate]);

  // ✅ Fetch Monthly Payroll with JWT
  useEffect(() => {
    const fetchMonthlyPayroll = async () => {
      try {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        const response = await axiosInstance.get(
          `http://localhost:8089/api/payroll/total-payroll?month=${month}&year=${year}`
        );
        const total = typeof response.data === "object" ? response.data.totalPayroll : response.data;
        setMonthlyPayroll(total || 0);
      } catch (error) {
        console.error("Error fetching monthly payroll:", error.response || error);
        setMonthlyPayroll(0);
      }
    };
    
    fetchMonthlyPayroll();
  }, []);

  // ✅ Fetch Pending Leaves Count with JWT
  useEffect(() => {
    const fetchPendingLeaves = async () => {
      try {
        const response = await axiosInstance.get("http://localhost:8087/api/leaves/pending/count");
        const count = typeof response.data === "object" ? response.data.count : response.data;
        setPendingLeaves(count || 0);
      } catch (error) {
        console.error("Error fetching pending leaves count:", error.response || error);
        setPendingLeaves(0);
      }
    };
    
    fetchPendingLeaves();
  }, []);

  // ✅ Fetch Total Payslip Count with JWT
  useEffect(() => {
    const fetchPayslipCount = async () => {
      try {
        const response = await axiosInstance.get("http://localhost:8089/api/payroll/payslip/count");
        const count = typeof response.data === "object" ? response.data.count : response.data;
        setPayslipCount(count || 0);
      } catch (error) {
        console.error("Error fetching payslip count:", error.response || error);
        setPayslipCount(0);
      }
    };
    
    fetchPayslipCount();
  }, []);

  // ✅ Fetch Attendance Summary with JWT
  useEffect(() => {
    const fetchAttendanceSummary = async () => {
      try {
        const today = new Date();
        const dateString = today.toISOString().split("T")[0];

        const response = await axiosInstance.get(
          `http://localhost:8085/api/attendance/present-absent-summary?date=${dateString}`
        );
        
        console.log("Attendance API Response:", response.data);

        const data = response.data;
        setAttendanceSummary({
          present: data.totalPresent ?? data.present ?? 0,
          absent: data.totalAbsent ?? data.absent ?? 0,
        });
      } catch (error) {
        console.error("Error fetching attendance summary:", error.response || error);
        setAttendanceSummary({ present: 0, absent: 0 });
      } finally {
        setLoading(false);
      }
    };
    
    fetchAttendanceSummary();
  }, []);

  // Quick Actions Handlers
  const handleQuickAction = (action) => {
    switch (action) {
      case 'employees':
        navigate('/employees');
        break;
      case 'leave-requests':
        navigate('/leaves', { state: { activeTab: 'myrequests' } });
        break;
      case 'attendance':
        navigate('/attendance');
        break;
      case 'payslips':
        navigate('/payroll', { state: { activeTab: 'Payslips' } });
        break;
      default:
        break;
    }
  };

  // Show loading spinner while fetching data
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      {/* Welcome Banner */}
      {user && showWelcomeAlert && (
        <div className="alert alert-info alert-dismissible fade show mb-4" role="alert">
          <strong>Welcome back, {user.name || user.email}! 👋</strong> Here's your HR dashboard overview.
          <button 
            type="button" 
            className="btn-close" 
            data-bs-dismiss="alert"
            onClick={() => setShowWelcomeAlert(false)}
          ></button>
        </div>
      )}

      {/* Stats Row */}
      <div className="row mb-4">
        <div className="col-md-3">
          <StatCard title="Total Employees" value={employeeCount} color="green" />
        </div>
        <div className="col-md-3">
          <StatCard title="Total Departments" value="5" color="blue" />
        </div>
        <div className="col-md-3">
          <StatCard
            title="Monthly Payroll"
            value={`₹${monthlyPayroll.toLocaleString()}`}
            color="red"
          />
        </div>
        <div className="col-md-3">
          <StatCard 
            title="Pending Approvals" 
            value={pendingLeaves} 
            color="orange" 
          />
        </div>
      </div>

      {/* Second Stats Row - Payslip and Attendance */}
      <div className="row mb-4">
        <div className="col-md-3">
          <StatCard 
            title="Total Payslips" 
            value={payslipCount} 
            color="info" 
          />
        </div>
        <div className="col-md-3">
          <StatCard 
            title="Total Present Today" 
            value={attendanceSummary.present} 
            color="success" 
          />
        </div>
        <div className="col-md-3">
          <StatCard 
            title="Total Absent Today" 
            value={attendanceSummary.absent} 
            color="warning" 
          />
        </div>
        <div className="col-md-3">
          <StatCard 
            title="Attendance Rate" 
            value={
              attendanceSummary.present + attendanceSummary.absent > 0 
                ? `${Math.round((attendanceSummary.present / (attendanceSummary.present + attendanceSummary.absent)) * 100)}%`
                : "0%"
            } 
            color="primary" 
          />
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-white border-0 py-3">
              <h5 className="mb-0 fw-bold text-dark">🚀 Quick Actions</h5>
              <p className="text-muted mb-0">Quick access to frequently used features</p>
            </div>
            <div className="card-body">
              <div className="row g-3">
                {/* Employee Management */}
                <div className="col-md-3">
                  <div className="card border-0 bg-light h-100 quick-action-card">
                    <div className="card-body text-center p-4">
                      <div className="mb-3">
                        <i className="fas fa-users fa-2x text-primary"></i>
                      </div>
                      <h6 className="fw-bold text-dark">Employee Management</h6>
                      <p className="text-muted small mb-3">Manage employee data and records</p>
                      <button 
                        className="btn btn-outline-primary btn-sm w-100"
                        onClick={() => handleQuickAction('employees')}
                      >
                        View Employees
                      </button>
                    </div>
                  </div>
                </div>

                {/* Leave Management */}
                <div className="col-md-3">
                  <div className="card border-0 bg-light h-100 quick-action-card">
                    <div className="card-body text-center p-4">
                      <div className="mb-3">
                        <i className="fas fa-calendar-alt fa-2x text-success"></i>
                      </div>
                      <h6 className="fw-bold text-dark">Leave Management</h6>
                      <p className="text-muted small mb-3">Manage leave requests</p>
                      <button 
                        className="btn btn-outline-success btn-sm w-100"
                        onClick={() => handleQuickAction('leave-requests')}
                      >
                        View Requests
                      </button>
                    </div>
                  </div>
                </div>

                {/* Attendance */}
                <div className="col-md-3">
                  <div className="card border-0 bg-light h-100 quick-action-card">
                    <div className="card-body text-center p-4">
                      <div className="mb-3">
                        <i className="fas fa-clipboard-check fa-2x text-warning"></i>
                      </div>
                      <h6 className="fw-bold text-dark">Attendance</h6>
                      <p className="text-muted small mb-3">View and manage attendance records</p>
                      <button 
                        className="btn btn-outline-warning btn-sm w-100"
                        onClick={() => handleQuickAction('attendance')}
                      >
                        View Attendance
                      </button>
                    </div>
                  </div>
                </div>

                {/* Payroll */}
                <div className="col-md-3">
                  <div className="card border-0 bg-light h-100 quick-action-card">
                    <div className="card-body text-center p-4">
                      <div className="mb-3">
                        <i className="fas fa-file-invoice-dollar fa-2x text-danger"></i>
                      </div>
                      <h6 className="fw-bold text-dark">Payroll</h6>
                      <p className="text-muted small mb-3">Manage payroll and payslips</p>
                      <button 
                        className="btn btn-outline-danger btn-sm w-100"
                        onClick={() => handleQuickAction('payslips')}
                      >
                        View Payslips
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS for Quick Actions */}
      <style>
        {`
          .quick-action-card {
            transition: all 0.3s ease;
            cursor: pointer;
          }
          
          .quick-action-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
          }
          
          .quick-action-card .btn {
            transition: all 0.2s ease;
          }
          
          .quick-action-card .btn:hover {
            transform: scale(1.05);
          }
        `}
      </style>
    </div>
  );
}