import React, { useEffect, useState } from "react";
import axios from "axios";
import StatCard from "../components/StatCard";

export default function EmployeeDashboard() {
  const [leaveStats, setLeaveStats] = useState({
    approvedLeaves: 0,
    pendingLeaves: 0,
    totalRequests: 0,
    leaveBalance: 0
  });

  const [attendanceStats, setAttendanceStats] = useState({
    presentDays: 0,
    absentDays: 0,
    leaveDays: 0,
    actualWorkingDays: 0,
    pendingPunches: 0,
    totalWorkHours: 0,
    averageWorkHours: 0,
    leaveDates: [],
    pendingPunchDates: []
  });

  const [loading, setLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [selectedMonthYear, setSelectedMonthYear] = useState("");

  // Get employee info from localStorage
  const employee = JSON.parse(localStorage.getItem("employee"));
  const employeeId = employee?.employeeId;
  const employeeName = employee?.employeeName;

  // Initialize with current month and year
  useEffect(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const defaultMonthYear = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
    setSelectedMonthYear(defaultMonthYear);
  }, []);

  // Common Auth Setup
  const getAuthHeader = () => {
    const authUser = JSON.parse(localStorage.getItem("authUser"));
    if (!authUser) {
      console.error("No auth user found. Please log in again.");
      return {};
    }
    const { username, password } = authUser;
    return { Authorization: "Basic " + btoa(`${username}:${password}`) };
  };

  // Fetch Employee Leave Statistics (this doesn't depend on month selection)
  useEffect(() => {
    if (!employeeId) {
      console.error("No employee ID found");
      setLoading(false);
      setAttendanceLoading(false);
      return;
    }

    const headers = getAuthHeader();
    if (!headers.Authorization) {
      setLoading(false);
      setAttendanceLoading(false);
      return;
    }

    const fetchEmployeeData = async () => {
      try {
        setLoading(true);

        // Fetch leave balance
        const balanceResponse = await axios.get(
          `http://localhost:8087/api/leaves/leave-balance/${employeeId}`,
          { headers }
        );

        // Fetch employee leaves
        const leavesResponse = await axios.get(
          `http://localhost:8087/api/leaves/employee/${employeeId}`,
          { headers }
        );

        const leaves = leavesResponse.data || [];
        
        // Calculate leave statistics
        const approvedLeaves = leaves.filter(leave => leave.status === 'APPROVED').length;
        const pendingLeaves = leaves.filter(leave => leave.status === 'PENDING').length;
        const totalRequests = leaves.length;
        
        // Calculate total leave balance
        const leaveBalance = Object.values(balanceResponse.data || {}).reduce(
          (sum, balance) => sum + (Number(balance) || 0), 0
        );

        setLeaveStats({
          approvedLeaves,
          pendingLeaves,
          totalRequests,
          leaveBalance
        });

      } catch (error) {
        console.error("Error fetching employee data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, [employeeId]);

  // Fetch Monthly Attendance Summary (this depends on selected month and year)
  useEffect(() => {
    if (!employeeId || !selectedMonthYear) {
      console.error("No employee ID or month year found for attendance data");
      setAttendanceLoading(false);
      return;
    }

    const fetchMonthlyAttendance = async () => {
      try {
        setAttendanceLoading(true);
        console.log("📊 Fetching monthly attendance for:", {
          employeeId,
          month: selectedMonthYear
        });

        const response = await axios.get(
          `http://localhost:8085/api/attendance/employee/${employeeId}/monthly-summary`,
          {
            params: {
              month: selectedMonthYear
            }
          }
        );

        console.log("✅ Monthly Attendance Response:", response.data);

        const data = response.data || {};
        
        setAttendanceStats({
          presentDays: data.presentDays || 0,
          absentDays: data.absentDays || 0,
          leaveDays: data.leaveDays || 0,
          actualWorkingDays: data.actualWorkingDays || 0,
          pendingPunches: data.pendingPunches || 0,
          totalWorkHours: parseFloat(data.totalWorkHours) || 0,
          averageWorkHours: parseFloat(data.averageWorkHours) || 0,
          leaveDates: data.leaveDates || [],
          pendingPunchDates: data.pendingPunchDates || []
        });

      } catch (error) {
        console.error("❌ Error fetching monthly attendance:", error);
        
        // Set default values if API fails
        setAttendanceStats({
          presentDays: 0,
          absentDays: 0,
          leaveDays: 0,
          actualWorkingDays: 0,
          pendingPunches: 0,
          totalWorkHours: 0,
          averageWorkHours: 0,
          leaveDates: [],
          pendingPunchDates: []
        });
      } finally {
        setAttendanceLoading(false);
      }
    };

    fetchMonthlyAttendance();
  }, [employeeId, selectedMonthYear]);

  // Handle month-year selection change
  const handleMonthYearChange = (event) => {
    setSelectedMonthYear(event.target.value);
  };

  // Generate month-year options (last 12 months)
  const generateMonthYearOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const value = `${year}-${month.toString().padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      options.unshift({ value, label });
    }
    
    return options;
  };

  const isLoading = loading || (attendanceLoading && selectedMonthYear);

  if (isLoading && !selectedMonthYear) {
    return (
      <div className="container mt-4">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" style={{width: '3rem', height: '3rem'}} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <h5 className="text-muted">Loading your dashboard...</h5>
            <p className="text-muted small">Fetching leave and attendance data</p>
          </div>
        </div>
      </div>
    );
  }

  // Helper function to format month name
  const getMonthName = (monthYear) => {
    const [year, month] = monthYear.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Calculate attendance rate
  const calculateAttendanceRate = () => {
    if (attendanceStats.actualWorkingDays === 0) return 0;
    return ((attendanceStats.presentDays / attendanceStats.actualWorkingDays) * 100).toFixed(1);
  };

  // Format date for display
  const formatDateDisplay = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  return (
    <div className="container mt-4">
      {/* Welcome Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 bg-primary text-white shadow-sm">
            <div className="card-body py-4">
              <div className="row align-items-center">
                <div className="col-md-8">
                  <h2 className="fw-bold mb-2">Welcome back, {employeeName || 'Employee'}! 👋</h2>
                  <p className="mb-0 opacity-75">
                    Here's your overview for {getMonthName(selectedMonthYear)}. Track your leaves, attendance, and quick actions.
                  </p>
                </div>
                <div className="col-md-4 text-md-end">
                  <div className="d-flex align-items-center justify-content-md-end gap-3">
                    {/* Month-Year Selector */}
                    <div className="bg-light rounded px-3 py-2">
                      <label htmlFor="monthYearSelect" className="form-label text-primary mb-1 small fw-bold">
                        📅 Select Month
                      </label>
                      <select 
                        id="monthYearSelect"
                        className="form-select form-select-sm border-0 bg-light text-dark fw-bold"
                        value={selectedMonthYear}
                        onChange={handleMonthYearChange}
                        style={{ minWidth: '180px' }}
                        disabled={attendanceLoading}
                      >
                        {generateMonthYearOptions().map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {attendanceLoading && (
                      <div className="spinner-border spinner-border-sm text-light" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Attendance Summary Row */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 py-3">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="fw-bold mb-0 text-dark">
                  📊 Monthly Attendance Summary - {getMonthName(selectedMonthYear)}
                  {attendanceLoading && (
                    <span className="ms-2 spinner-border spinner-border-sm text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </span>
                  )}
                </h5>
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-primary fs-6">
                    {attendanceStats.actualWorkingDays} Working Days
                  </span>
                  <button 
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => {
                      // This will trigger the useEffect to refetch data
                      setAttendanceLoading(true);
                    }}
                    disabled={attendanceLoading}
                  >
                    {attendanceLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Loading...
                      </>
                    ) : (
                      <>
                        🔄 Refresh
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-xl-3 col-md-6 mb-3">
                  <StatCard 
                    title="Present Days" 
                    value={attendanceStats.presentDays} 
                    color="success"
                    icon="✅"
                    subtitle={`Out of ${attendanceStats.actualWorkingDays} days`}
                    loading={attendanceLoading}
                  />
                </div>
                <div className="col-xl-3 col-md-6 mb-3">
                  <StatCard 
                    title="Absent Days" 
                    value={attendanceStats.absentDays} 
                    color="danger"
                    icon="❌"
                    subtitle="Total absences this month"
                    loading={attendanceLoading}
                  />
                </div>
                <div className="col-xl-3 col-md-6 mb-3">
                  <StatCard 
                    title="Leave Days" 
                    value={attendanceStats.leaveDays} 
                    color="info"
                    icon="🏖️"
                    subtitle="Approved leave days"
                    loading={attendanceLoading}
                  />
                </div>
                <div className="col-xl-3 col-md-6 mb-3">
                  <StatCard 
                    title="Attendance Rate" 
                    value={`${calculateAttendanceRate()}%`} 
                    color="primary"
                    icon="📈"
                    subtitle="Overall attendance percentage"
                    loading={attendanceLoading}
                  />
                </div>
              </div>

              {/* Additional Attendance Metrics */}
              <div className="row mt-3">
                <div className="col-md-4">
                  <div className="card bg-light border-0">
                    <div className="card-body text-center py-3">
                      <div className="d-flex align-items-center justify-content-center">
                        <span className="fs-2 me-3">⏱️</span>
                        <div>
                          <h6 className="fw-bold mb-1">Total Hours</h6>
                          <p className="mb-0 fs-5 text-info">
                            {attendanceLoading ? (
                              <div className="spinner-border spinner-border-sm text-info" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                            ) : (
                              `${attendanceStats.totalWorkHours}h`
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card bg-light border-0">
                    <div className="card-body text-center py-3">
                      <div className="d-flex align-items-center justify-content-center">
                        <span className="fs-2 me-3">📅</span>
                        <div>
                          <h6 className="fw-bold mb-1">Avg Hours/Day</h6>
                          <p className="mb-0 fs-5 text-success">
                            {attendanceLoading ? (
                              <div className="spinner-border spinner-border-sm text-success" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                            ) : (
                              `${attendanceStats.averageWorkHours}h`
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card bg-light border-0">
                    <div className="card-body text-center py-3">
                      <div className="d-flex align-items-center justify-content-center">
                        <span className="fs-2 me-3">⚠️</span>
                        <div>
                          <h6 className="fw-bold mb-1">Pending Punches</h6>
                          <p className="mb-0 fs-5 text-warning">
                            {attendanceLoading ? (
                              <div className="spinner-border spinner-border-sm text-warning" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                            ) : (
                              attendanceStats.pendingPunches
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Leave Dates and Pending Punch Dates */}
              {(attendanceStats.leaveDates.length > 0 || attendanceStats.pendingPunchDates.length > 0) && (
                <div className="row mt-4">
                  {attendanceStats.leaveDates.length > 0 && (
                    <div className="col-md-6">
                      <div className="card border-0 bg-success bg-opacity-10">
                        <div className="card-body">
                          <h6 className="fw-bold text-success mb-3">
                            📅 Approved Leave Dates ({attendanceStats.leaveDates.length})
                          </h6>
                          <div className="d-flex flex-wrap gap-2">
                            {attendanceStats.leaveDates.map((date, index) => (
                              <span key={index} className="badge bg-success">
                                {formatDateDisplay(date)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {attendanceStats.pendingPunchDates.length > 0 && (
                    <div className="col-md-6">
                      <div className="card border-0 bg-warning bg-opacity-10">
                        <div className="card-body">
                          <h6 className="fw-bold text-warning mb-3">
                            ⚠️ Pending Punch Dates ({attendanceStats.pendingPunchDates.length})
                          </h6>
                          <div className="d-flex flex-wrap gap-2">
                            {attendanceStats.pendingPunchDates.map((date, index) => (
                              <span key={index} className="badge bg-warning text-dark">
                                {formatDateDisplay(date)}
                              </span>
                            ))}
                          </div>
                          <small className="text-muted mt-2 d-block">
                            Please complete your punch-in/out for these dates
                          </small>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Employee Leave Stats Row */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 py-3">
              <h5 className="fw-bold mb-0 text-dark">🎫 Leave Management Overview</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-xl-3 col-md-6 mb-3">
                  <StatCard 
                    title="Approved Leaves" 
                    value={leaveStats.approvedLeaves} 
                    color="success"
                    icon="✅"
                    subtitle="Leaves approved by manager"
                  />
                </div>
                <div className="col-xl-3 col-md-6 mb-3">
                  <StatCard 
                    title="Pending Leaves" 
                    value={leaveStats.pendingLeaves} 
                    color="warning"
                    icon="⏳"
                    subtitle="Awaiting approval"
                  />
                </div>
                <div className="col-xl-3 col-md-6 mb-3">
                  <StatCard 
                    title="Total Requests" 
                    value={leaveStats.totalRequests} 
                    color="info"
                    icon="📋"
                    subtitle="All leave applications"
                  />
                </div>
                <div className="col-xl-3 col-md-6 mb-3">
                  <StatCard 
                    title="Leave Balance" 
                    value={leaveStats.leaveBalance} 
                    color="primary"
                    icon="🎫"
                    subtitle="Remaining leave days"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions and Information */}
      <div className="row">
        {/* Quick Actions */}
        <div className="col-lg-8 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 py-3">
              <h5 className="fw-bold mb-0 text-dark">🚀 Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="card bg-light border-0 h-100">
                    <div className="card-body text-center p-4">
                      <div className="display-4 text-primary mb-3">📝</div>
                      <h5 className="fw-bold">Apply for Leave</h5>
                      <p className="text-muted small mb-3">
                        Submit a new leave application for approval
                      </p>
                      <a 
                        href="/leaves"
                        className="btn btn-primary w-100"
                      >
                        Apply Now
                      </a>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card bg-light border-0 h-100">
                    <div className="card-body text-center p-4">
                      <div className="display-4 text-info mb-3">📋</div>
                      <h5 className="fw-bold">My Leave Requests</h5>
                      <p className="text-muted small mb-3">
                        View and manage your existing leave applications
                      </p>
                      <a 
                        href="/leaves"
                        className="btn btn-info text-white w-100"
                      >
                        View Requests
                      </a>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card bg-light border-0 h-100">
                    <div className="card-body text-center p-4">
                      <div className="display-4 text-success mb-3">📅</div>
                      <h5 className="fw-bold">Leave Calendar</h5>
                      <p className="text-muted small mb-3">
                        Check your leave schedule and company holidays
                      </p>
                      <a 
                        href="/leaves"
                        className="btn btn-success w-100"
                      >
                        View Calendar
                      </a>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card bg-light border-0 h-100">
                    <div className="card-body text-center p-4">
                      <div className="display-4 text-warning mb-3">👥</div>
                      <h5 className="fw-bold">My Attendance</h5>
                      <p className="text-muted small mb-3">
                        Check your attendance status and records
                      </p>
                      <a 
                        href="/attendance"
                        className="btn btn-warning w-100"
                      >
                        Check Attendance
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Information */}
        <div className="col-lg-4 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 py-3">
              <h5 className="fw-bold mb-0 text-dark">💡 Quick Information</h5>
            </div>
            <div className="card-body">
              {/* Attendance Status Guide */}
              <div className="mb-4">
                <h6 className="fw-semibold text-muted mb-3">Attendance Status:</h6>
                <div className="d-flex flex-column gap-2">
                  <div className="d-flex align-items-center">
                    <span className="badge bg-success me-2">✅</span>
                    <small className="text-muted">Present - Full day attendance</small>
                  </div>
                  <div className="d-flex align-items-center">
                    <span className="badge bg-danger me-2">❌</span>
                    <small className="text-muted">Absent - No attendance recorded</small>
                  </div>
                  <div className="d-flex align-items-center">
                    <span className="badge bg-info me-2">🏖️</span>
                    <small className="text-muted">Leave - Approved leave day</small>
                  </div>
                  <div className="d-flex align-items-center">
                    <span className="badge bg-warning text-dark me-2">⚠️</span>
                    <small className="text-muted">Pending Punch - Incomplete attendance</small>
                  </div>
                </div>
              </div>

              {/* Leave Status Guide */}
              <div className="mb-4">
                <h6 className="fw-semibold text-muted mb-3">Leave Status Guide:</h6>
                <div className="d-flex flex-column gap-2">
                  <div className="d-flex align-items-center">
                    <span className="badge bg-success me-2">✅</span>
                    <small className="text-muted">Approved - Leave is confirmed</small>
                  </div>
                  <div className="d-flex align-items-center">
                    <span className="badge bg-warning text-dark me-2">⏳</span>
                    <small className="text-muted">Pending - Waiting for approval</small>
                  </div>
                  <div className="d-flex align-items-center">
                    <span className="badge bg-danger me-2">❌</span>
                    <small className="text-muted">Rejected - Leave was denied</small>
                  </div>
                  <div className="d-flex align-items-center">
                    <span className="badge bg-secondary me-2">🗑️</span>
                    <small className="text-muted">Cancelled - You cancelled the leave</small>
                  </div>
                </div>
              </div>

              {/* Alerts */}
              {leaveStats.pendingLeaves > 0 && (
                <div className="alert alert-warning border-0 mb-3">
                  <small>
                    <strong>You have {leaveStats.pendingLeaves} pending leave(s)</strong><br/>
                    Waiting for manager approval. You'll be notified once processed.
                  </small>
                </div>
              )}

              {attendanceStats.absentDays > 0 && (
                <div className="alert alert-danger border-0 mb-3">
                  <small>
                    <strong>You have {attendanceStats.absentDays} absence(s) this month</strong><br/>
                    Regular attendance is important for performance reviews.
                  </small>
                </div>
              )}

              {attendanceStats.pendingPunches > 0 && (
                <div className="alert alert-warning border-0 mb-3">
                  <small>
                    <strong>You have {attendanceStats.pendingPunches} pending punch(es)</strong><br/>
                    Please complete your attendance for these dates.
                  </small>
                </div>
              )}

              {calculateAttendanceRate() >= 90 && (
                <div className="alert alert-success border-0 mb-3">
                  <small>
                    <strong>Great attendance! 🎉</strong><br/>
                    Your attendance rate is {calculateAttendanceRate()}% this month.
                  </small>
                </div>
              )}

              {/* Help Section */}
              <div className="border-top pt-3">
                <h6 className="fw-semibold text-muted mb-2">🆘 Need Help?</h6>
                <ul className="list-unstyled small text-muted">
                  <li className="mb-1">• Contact HR for leave policy questions</li>
                  <li className="mb-1">• Reach out to your manager for urgent leaves</li>
                  <li className="mb-1">• Check calendar for holidays</li>
                  <li>• System issues? Contact IT support</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}