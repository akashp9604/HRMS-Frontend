import React, { useEffect, useState, useContext } from "react";
import axiosInstance from "../apis/axiosConfig"; // ✅ JWT axios instance
import StatCard from "../components/StatCard";
import { AuthContext } from "../context/AuthContext";

export default function EmployeeDashboard() {
  const { user } = useContext(AuthContext); // ✅ Get user from JWT context
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

  const [dailyAttendance, setDailyAttendance] = useState([]);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [selectedMonthYear, setSelectedMonthYear] = useState("");

  // ✅ Get employee info from JWT context instead of localStorage
  const employeeId = user?.id || user?.employeeId;
  const employeeName = user?.name || user?.employeeName;

  useEffect(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const defaultMonthYear = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
    setSelectedMonthYear(defaultMonthYear);
  }, []);

  // ✅ Fetch Leave Stats with JWT
  useEffect(() => {
    if (!employeeId) { setLoading(false); return; }

    const fetchEmployeeData = async () => {
      try {
        setLoading(true);
        
        // ✅ Use axiosInstance instead of axios with headers
        const [balanceResponse, leavesResponse] = await Promise.all([
          axiosInstance.get(`http://localhost:8087/api/leaves/leave-balance/${employeeId}`),
          axiosInstance.get(`http://localhost:8087/api/leaves/employee/${employeeId}`)
        ]);
        
        const leaves = leavesResponse.data || [];
        const approvedLeaves = leaves.filter(l => l.status === 'APPROVED').length;
        const pendingLeaves = leaves.filter(l => l.status === 'PENDING').length;
        const totalRequests = leaves.length;
        const leaveBalance = Object.values(balanceResponse.data || {}).reduce(
          (sum, balance) => sum + (Number(balance) || 0), 0
        );
        
        setLeaveStats({ approvedLeaves, pendingLeaves, totalRequests, leaveBalance });
      } catch (error) {
        console.error("Error fetching leave data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, [employeeId]);

  // ✅ Fetch Monthly Attendance Summary with JWT
  useEffect(() => {
    if (!employeeId || !selectedMonthYear) { 
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

        // ✅ Use axiosInstance instead of axios
        const response = await axiosInstance.get(
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

  const handleMonthYearChange = (e) => setSelectedMonthYear(e.target.value);

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

  const getMonthName = (monthYear) => {
    if (!monthYear) return '';
    const [year, month] = monthYear.split('-');
    return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const calculateAttendanceRate = () => {
    if (attendanceStats.actualWorkingDays === 0) return 0;
    return ((attendanceStats.presentDays / attendanceStats.actualWorkingDays) * 100).toFixed(1);
  };

  const formatTime = (timeStr) => {
    if (!timeStr || timeStr === "00:00:00.000000") return "--";
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${ampm}`;
  };

  const getStatusBadge = (status) => {
    const map = {
      PRESENT:      { bg: "bg-success",          label: "✅ Present" },
      ABSENT:       { bg: "bg-danger",            label: "❌ Absent" },
      LEAVE:        { bg: "bg-info text-dark",    label: "🏖️ Leave" },
      HALF_DAY:     { bg: "bg-warning text-dark", label: "🌗 Half Day" },
      PENDING_PUNCH:{ bg: "bg-warning text-dark", label: "⚠️ Pending Punch" },
    };
    const s = map[status] || { bg: "bg-secondary", label: status };
    return <span className={`badge ${s.bg}`}>{s.label}</span>;
  };

  const formatDateDisplay = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };

  // Compute leave days from daily records for Leave Management section
  const leaveRecords = dailyAttendance.filter(r => r.attendanceStatus === "LEAVE");

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
                    Here's your overview for {getMonthName(selectedMonthYear)}
                  </p>
                </div>
                <div className="col-md-4 text-md-end">
                  <div className="d-flex align-items-center justify-content-md-end gap-2">
                    <div className="bg-light rounded px-2 py-3">
                      <label
                        htmlFor="monthYearSelect"
                        className="form-label text-primary mb-0 small fw-bold"
                        style={{ paddingRight: "30px" }}
                      >
                        📅 Select Month
                      </label>
                      <select
                        id="monthYearSelect"
                        className="form-select form-select-sm bg-white text-dark fw-bold border-primary"
                        value={selectedMonthYear}
                        onChange={handleMonthYearChange}
                        style={{ minWidth: "106px" }}
                        disabled={attendanceLoading}
                      >
                        {generateMonthYearOptions().map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    {attendanceLoading && (
                      <div className="spinner-border spinner-border-sm text-light" role="status" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Attendance Summary */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 py-3">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="fw-bold mb-0 text-dark">
                  📊 Monthly Attendance Summary — {getMonthName(selectedMonthYear)}
                  {attendanceLoading && (
                    <span className="ms-2 spinner-border spinner-border-sm text-primary" role="status" />
                  )}
                </h5>
                <span className="badge bg-primary fs-6">{attendanceStats.actualWorkingDays} Working Days</span>
              </div>
            </div>
            <div className="card-body">
              <div className="row">
                {[
                  { title: "Present Days",   
                     value: attendanceStats.presentDays,   
                      color: "success", icon: "✅", 
                      subtitle: `Out of ${attendanceStats.actualWorkingDays} days` },
                  { title: "Absent Days",     value: attendanceStats.absentDays,     color: "danger",  icon: "❌", subtitle: "Total absences this month" },
                  { title: "Leave Days",      value: leaveRecords.length || attendanceStats.leaveDays, color: "info", icon: "🏖️", subtitle: "Leave days this month" },
                  { title: "Attendance Rate", value: `${calculateAttendanceRate()}%`, color: "primary", icon: "📈", subtitle: "Overall attendance %" },
                ].map((card, i) => (
                  <div key={i} className="col-xl-3 col-md-6 mb-3">
                    <StatCard {...card} loading={attendanceLoading} />
                  </div>
                ))}
              </div>

              {/* Work Hours Row */}
              <div className="row mt-3">
                {[
                  { icon: "⏱️", label: "Total Hours",    value: `${attendanceStats.totalWorkHours}h`,   color: "text-info" },
                  { icon: "📅", label: "Avg Hours/Day",  value: `${attendanceStats.averageWorkHours}h`, color: "text-success" },
                  { icon: "⚠️", label: "Pending Punches",value: attendanceStats.pendingPunches,          color: "text-warning" },
                ].map((item, i) => (
                  <div key={i} className="col-md-4">
                    <div className="card bg-light border-0">
                      <div className="card-body text-center py-3">
                        <div className="d-flex align-items-center justify-content-center">
                          <span className="fs-2 me-3">{item.icon}</span>
                          <div>
                            <h6 className="fw-bold mb-1">{item.label}</h6>
                            <p className={`mb-0 fs-5 ${item.color}`}>
                              {attendanceLoading
                                ? <span className="spinner-border spinner-border-sm" role="status" />
                                : item.value}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leave Management Overview */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 py-3">
              <h5 className="fw-bold mb-0 text-dark">🎫 Leave Management Overview</h5>
            </div>
            <div className="card-body">
              <div className="row">
                {[
                  { title: "Approved Leaves", value: leaveStats.approvedLeaves, color: "success", icon: "✅", subtitle: "Leaves approved by manager" },
                  { title: "Pending Leaves",  value: leaveStats.pendingLeaves,  color: "warning", icon: "⏳", subtitle: "Awaiting approval" },
                  { title: "Total Requests",  value: leaveStats.totalRequests,  color: "info",    icon: "📋", subtitle: "All leave applications" },
                  { title: "Leave Balance",   value: leaveStats.leaveBalance,   color: "primary", icon: "🎫", subtitle: "Remaining leave days" },
                ].map((card, i) => (
                  <div key={i} className="col-xl-3 col-md-6 mb-3">
                    <StatCard {...card} loading={loading} />
                  </div>
                ))}
              </div>

              {/* Leave Records from daily attendance */}
              {leaveRecords.length > 0 && (
                <div className="mt-4">
                  <h6 className="fw-bold text-muted mb-3">📅 Leave Days This Month</h6>
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>#</th>
                          <th>Date</th>
                          <th>Day</th>
                          <th>Leave Type</th>
                          <th>Source</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaveRecords.map((record, index) => {
                          const dateObj = new Date(record.attendanceDate);
                          const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                          return (
                            <tr key={index}>
                              <td>{index + 1}</td>
                              <td className="fw-semibold">
                                {dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </td>
                              <td><span className="badge bg-light text-dark border">{dayName}</span></td>
                              <td>
                                <span className="badge bg-info text-dark">
                                  {record.attendanceType || "Leave"}
                                </span>
                              </td>
                              <td><small className="text-muted">{record.source || "SYSTEM"}</small></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row">
        <div className="col-lg-8 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 py-3">
              <h5 className="fw-bold mb-0 text-dark">🚀 Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                {[
                  { icon: "📝", title: "Apply for Leave",    desc: "Submit a new leave application",        href: "/leaves", btn: "btn-primary",   label: "Apply Now" },
                  { icon: "📋", title: "My Leave Requests",  desc: "View and manage leave applications",    href: "/leaves", btn: "btn-info",      label: "View Requests" },
                  { icon: "📅", title: "Leave Calendar",     desc: "Check schedule and company holidays",   href: "/leaves", btn: "btn-success",   label: "View Calendar" },
                  { icon: "👥", title: "My Attendance",      desc: "Check attendance status and records",   href: "/attendance", btn: "btn-warning", label: "Check Attendance" },
                ].map((action, i) => (
                  <div key={i} className="col-md-6">
                    <div className="card bg-light border-0 h-100">
                      <div className="card-body text-center p-4">
                        <div className="display-4 mb-3">{action.icon}</div>
                        <h5 className="fw-bold">{action.title}</h5>
                        <p className="text-muted small mb-3">{action.desc}</p>
                        <a href={action.href} className={`btn ${action.btn} w-100 text-white`}>{action.label}</a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Info */}
        <div className="col-lg-4 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 py-3">
              <h5 className="fw-bold mb-0 text-dark">💡 Quick Information</h5>
            </div>
            <div className="card-body">
              <h6 className="fw-semibold text-muted mb-3">Attendance Status:</h6>
              <div className="d-flex flex-column gap-2 mb-4">
                {[
                  { badge: "bg-success",          text: "Present — Full day attendance" },
                  { badge: "bg-danger",            text: "Absent — No attendance recorded" },
                  { badge: "bg-info text-dark",    text: "Leave — Approved leave day" },
                  { badge: "bg-warning text-dark", text: "Half Day — Partial attendance" },
                  { badge: "bg-warning text-dark", text: "Pending Punch — Incomplete" },
                ].map((item, i) => (
                  <div key={i} className="d-flex align-items-center">
                    <span className={`badge ${item.badge} me-2`}>●</span>
                    <small className="text-muted">{item.text}</small>
                  </div>
                ))}
              </div>

              {leaveStats.pendingLeaves > 0 && (
                <div className="alert alert-warning border-0 mb-2">
                  <small><strong>{leaveStats.pendingLeaves} pending leave(s)</strong><br/>Waiting for manager approval.</small>
                </div>
              )}
              {attendanceStats.absentDays > 0 && (
                <div className="alert alert-danger border-0 mb-2">
                  <small><strong>{attendanceStats.absentDays} absence(s) this month</strong><br/>Regular attendance matters.</small>
                </div>
              )}
              {attendanceStats.pendingPunches > 0 && (
                <div className="alert alert-warning border-0 mb-2">
                  <small><strong>{attendanceStats.pendingPunches} pending punch(es)</strong><br/>Please complete your attendance.</small>
                </div>
              )}
              {calculateAttendanceRate() >= 90 && (
                <div className="alert alert-success border-0 mb-2">
                  <small><strong>Great attendance! 🎉</strong><br/>Your rate is {calculateAttendanceRate()}% this month.</small>
                </div>
              )}

              <div className="border-top pt-3 mt-2">
                <h6 className="fw-semibold text-muted mb-2">🆘 Need Help?</h6>
                <ul className="list-unstyled small text-muted">
                  <li className="mb-1">• Contact HR for leave policy questions</li>
                  <li className="mb-1">• Reach out to manager for urgent leaves</li>
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