import React, { useEffect, useState } from "react";
import {
  getDailyAttendance,
  getPresentAbsentSummary,
  getMonthlySummary,
  getEmployeesFromAttendance,
  getEmployeesInfo,
  getEmployeeMonthlySummary,
} from "../apis/attendanceApi";
import {
  Table,
  Button,
  Form,
  Card,
  Row,
  Col,
  Tabs,
  Tab,
  Pagination,
  Badge,
} from "react-bootstrap";

const AttendancePage = () => {
  const [attendance, setAttendance] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [search, setSearch] = useState("");
  const [summary, setSummary] = useState({ totalPresent: 0, totalAbsent: 0 });

  // ✅ Monthly Summary States
  const [employeesList, setEmployeesList] = useState([]);
  const [employeesInfoList, setEmployeesInfoList] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState("");
  const [summaryMonth, setSummaryMonth] = useState("");
  const [summaryYear, setSummaryYear] = useState("");
  const [employeeSummary, setEmployeeSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // ✅ Pagination States for Today's Attendance
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // ✅ Pagination States for Monthly Summary
  const [currentPageMonthly, setCurrentPageMonthly] = useState(1);
  const [itemsPerPageMonthly, setItemsPerPageMonthly] = useState(5);

  // ✅ Function to get day name from date string
  const getDayName = (dateString) => {
    const date = new Date(dateString);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  // ✅ Function to format date with day
  const formatDateWithDay = (dateString) => {
    const dayName = getDayName(dateString);
    return `${dateString} (${dayName})`;
  };

  // ✅ Function to get today's date with day
  const getTodayWithDay = () => {
    const dayName = getDayName(date);
    return `${date} (${dayName})`;
  };

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    loadTodayAttendance();
    loadSummary(today);
    loadEmployees();
    loadEmployeesInfo();
  }, []);

  // Load Today's Attendance
  const loadTodayAttendance = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const data = await getDailyAttendance(today);  
    setAttendance(data || []);
    setCurrentPage(1);
  } catch (err) {
    console.error("Error fetching today's attendance:", err);
  }
};

  const loadSummary = async (selectedDate) => {
    try {
      const data = await getPresentAbsentSummary(selectedDate);
      setSummary(data || { totalPresent: 0, totalAbsent: 0 });
    } catch (err) {
      console.error("Error fetching summary:", err);
    }
  };

  const handleDateChange = async (newDate) => {
  const formattedDate = new Date(newDate).toISOString().split("T")[0];
  setDate(formattedDate);
  try {
    const data = await getDailyAttendance(formattedDate);  
    setAttendance(data || []);
    setCurrentPage(1);
    loadSummary(formattedDate);
  } catch (error) {
    console.error("Error fetching attendance by date:", error);
  }
};

  const loadEmployees = async () => {
    try {
      const data = await getEmployeesFromAttendance();
      setEmployeesList(data || []);
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  const loadEmployeesInfo = async () => {
    try {
      const data = await getEmployeesInfo();
      setEmployeesInfoList(data || []);
    } catch (err) {
      console.error("Error fetching employees info:", err);
    }
  };

  // Filter attendance based on search
  const filtered = attendance.filter((emp) =>
    emp.employeeName?.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination logic for Today's Attendance
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  // Pagination logic for Monthly Summary Employees List
  const indexOfLastItemMonthly = currentPageMonthly * itemsPerPageMonthly;
  const indexOfFirstItemMonthly = indexOfLastItemMonthly - itemsPerPageMonthly;
  const currentEmployees = employeesInfoList.slice(indexOfFirstItemMonthly, indexOfLastItemMonthly);
  const totalPagesMonthly = Math.ceil(employeesInfoList.length / itemsPerPageMonthly);

  // ✅ UPDATED: Function to call the new API
  const fetchEmployeeSummary = async () => {
    if (!selectedEmployee || !summaryMonth || !summaryYear) {
      alert("Please select an employee and enter both month and year");
      return;
    }

    // Format month to YYYY-MM format (e.g., 2025-10)
    const formattedMonth = `${summaryYear}-${summaryMonth.toString().padStart(2, '0')}`;
    
    setLoadingSummary(true);
    try {
      // Call the new API
      const data = await getEmployeeMonthlySummary(selectedEmployee, formattedMonth);
      setEmployeeSummary(data);
    } catch (err) {
      console.error("Error fetching monthly summary:", err);
      alert("Failed to fetch monthly summary. Please try again.");
      setEmployeeSummary(null);
    } finally {
      setLoadingSummary(false);
    }
  };

  // Handle items per page change for Today's Attendance
  const handleItemsPerPageChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0) {
      setItemsPerPage(value);
      setCurrentPage(1);
    }
  };

  // Handle items per page change for Monthly Summary
  const handleItemsPerPageChangeMonthly = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0) {
      setItemsPerPageMonthly(value);
      setCurrentPageMonthly(1);
    }
  };

  // Generate pagination items (reusable function)
  const renderPaginationItems = (currentPage, totalPages, setCurrentPage) => {
    let items = [];
    
    // Previous button
    items.push(
      <Pagination.Prev
        key="prev"
        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
        disabled={currentPage === 1}
      />
    );

    // Page numbers - show limited pages for better UX
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // First page and ellipsis
    if (startPage > 1) {
      items.push(
        <Pagination.Item key={1} onClick={() => setCurrentPage(1)}>
          1
        </Pagination.Item>
      );
      if (startPage > 2) {
        items.push(<Pagination.Ellipsis key="start-ellipsis" />);
      }
    }

    // Page numbers
    for (let number = startPage; number <= endPage; number++) {
      items.push(
        <Pagination.Item
          key={number}
          active={number === currentPage}
          onClick={() => setCurrentPage(number)}
        >
          {number}
        </Pagination.Item>
      );
    }

    // Last page and ellipsis
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(<Pagination.Ellipsis key="end-ellipsis" />);
      }
      items.push(
        <Pagination.Item key={totalPages} onClick={() => setCurrentPage(totalPages)}>
          {totalPages}
        </Pagination.Item>
      );
    }

    // Next button
    items.push(
      <Pagination.Next
        key="next"
        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
        disabled={currentPage === totalPages}
      />
    );

    return items;
  };

  return (
    <div className="container mt-4">
      <h2>Attendance Management</h2>
      <p>Track daily and monthly attendance records</p>

      <Tabs defaultActiveKey="today" id="attendance-tabs" className="mb-3">
        {/* ✅ Tab 1: Today's Attendance - REMOVED PRESENT/ABSENT COUNT CARDS */}
        <Tab eventKey="today" title="Today's Attendance">
          {/* REMOVED: The entire Row containing Present/Absent count cards */}

          <Row className="mb-3">
            <Col md={3}>
              <Form.Control
                type="date"
                value={date}
                onChange={(e) => handleDateChange(e.target.value)}
              />
            </Col>
            <Col md={4}>
              <Form.Control
                type="text"
                placeholder="Search employee..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </Col>
            <Col md={3}>
              <Form.Control
                type="number"
                placeholder="Items per page"
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                min="1"
                max="100"
              />
            </Col>
            <Col md={2} className="text-end">
              <Button onClick={loadTodayAttendance}>Refresh</Button>
            </Col>
          </Row>

          <Card>
            <Card.Body>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Employee</th>
                    {/* ✅ UPDATED: Column header to indicate date with day */}
                    <th>Date (Day)</th>
                    <th>Shift</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Hours</th>
                    <th>Late In</th>
                    <th>Early Out</th>
                    <th>Over Time</th>
                    <th>Status</th>
                    <th>Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length > 0 ? (
                    currentItems.map((att, i) => (
                      <tr key={att.id || i}>
                        <td>{att.employeeName}</td>
                        {/* ✅ UPDATED: Date now shows with day name */}
                        <td>
                          <div>{formatDateWithDay(att.date)}</div>
                          <small className="text-muted">
                            {att.date === new Date().toISOString().split("T")[0] && 
                              <Badge bg="info">Today</Badge>
                            }
                          </small>
                        </td>
                        <td>{att.shift || "-"}</td>
                        <td>{att.inTime || "-"}</td>
                        <td>{att.outTime || "-"}</td>
                        <td>{att.workHours}</td>
                        <td>{att.lateIn || "-"}</td>
                        <td>{att.erlOut || "-"}</td>
                        <td>{att.overTime || "-"}</td>
                        <td>
                          <Badge 
                            bg={
                              att.status === 'Present' ? 'success' :
                              att.status === 'Absent' ? 'danger' :
                              att.status === 'Late' ? 'warning' :
                              att.status === 'Half Day' ? 'info' : 'secondary'
                            }
                          >
                            {att.status}
                          </Badge>
                        </td>
                        <td>{att.remark || "-"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={11} className="text-center">
                        No records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>

              {/* Pagination for Today's Attendance */}
              {filtered.length > 0 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div>
                    Showing {indexOfFirstItem + 1} to{" "}
                    {Math.min(indexOfLastItem, filtered.length)} of{" "}
                    {filtered.length} entries
                    {itemsPerPage !== 5 && ` (${itemsPerPage} per page)`}
                  </div>
                  
                  {totalPages > 1 && (
                    <Pagination className="mb-0">
                      {renderPaginationItems(currentPage, totalPages, setCurrentPage)}
                    </Pagination>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>

        {/* ✅ Tab 2: Monthly Summary - UPDATED WITH LEAVE INFORMATION */}
        <Tab eventKey="monthlySummary" title="Monthly Summary">
          <Row className="mb-3">
            <Col md={4}>
              <Form.Control
                type="number"
                placeholder="Items per page"
                value={itemsPerPageMonthly}
                onChange={handleItemsPerPageChangeMonthly}
                min="1"
                max="100"
              />
            </Col>
          </Row>

          <Row>
            <Col md={4}>
              <h5>Employees</h5>
              <ul className="list-group">
                {currentEmployees.length > 0 ? (
                  currentEmployees.map((emp) => (
                    <li
                      key={emp.employeeId}
                      className={`list-group-item ${
                        selectedEmployee === emp.employeeId ? "active" : ""
                      }`}
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        setSelectedEmployee(emp.employeeId);
                        setSelectedEmployeeName(emp.name);
                        setEmployeeSummary(null);
                      }}
                    >
                      <strong>{emp.name}</strong>
                      <br />
                      <small className="text-muted">{emp.employeeId}</small>
                    </li>
                  ))
                ) : (
                  <li className="list-group-item text-center text-muted">
                    No employees found
                  </li>
                )}
              </ul>

              {/* ✅ PAGINATION FOR MONTHLY SUMMARY EMPLOYEES LIST */}
              {employeesInfoList.length > 0 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div>
                    Showing {indexOfFirstItemMonthly + 1} to{" "}
                    {Math.min(indexOfLastItemMonthly, employeesInfoList.length)} of{" "}
                    {employeesInfoList.length} employees
                    {itemsPerPageMonthly !== 5 && ` (${itemsPerPageMonthly} per page)`}
                  </div>
                  
                  {totalPagesMonthly > 1 && (
                    <Pagination size="sm" className="mb-0 mt-2">
                      {renderPaginationItems(currentPageMonthly, totalPagesMonthly, setCurrentPageMonthly)}
                    </Pagination>
                  )}
                </div>
              )}
            </Col>

            <Col md={8}>
              {selectedEmployee ? (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Enter Month & Year</Form.Label>
                    <Row>
                      <Col md={4}>
                        <Form.Control
                          type="number"
                          placeholder="Month (1-12)"
                          value={summaryMonth}
                          onChange={(e) => setSummaryMonth(e.target.value)}
                          min="1"
                          max="12"
                        />
                      </Col>
                      <Col md={4}>
                        <Form.Control
                          type="number"
                          placeholder="Year (e.g., 2025)"
                          value={summaryYear}
                          onChange={(e) => setSummaryYear(e.target.value)}
                          min="2000"
                          max="2100"
                        />
                      </Col>
                      <Col md={4}>
                        <Button 
                          variant="primary" 
                          onClick={fetchEmployeeSummary}
                          disabled={loadingSummary}
                        >
                          {loadingSummary ? "Loading..." : "Get Summary"}
                        </Button>
                      </Col>
                    </Row>
                  </Form.Group>

                  {/* ✅ ADDED LOADING INDICATOR */}
                  {loadingSummary && (
                    <div className="text-center mt-3">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-2">Fetching monthly summary...</p>
                    </div>
                  )}

                  {/* ✅ UPDATED SUMMARY DISPLAY WITH LEAVE INFORMATION */}
                  {employeeSummary && !loadingSummary && (
                    <Card className="mt-3 shadow-sm border-0">
                      <Card.Body>
                        <h5 className="mb-3">
                          Monthly Summary -{" "}
                          <span className="text-primary">
                            {selectedEmployeeName} ({selectedEmployee})
                          </span>
                        </h5>
                        <p className="text-muted">
                          For {employeeSummary.month} • Total Working Days: {employeeSummary.totalWorkingDays}
                        </p>
                        
                        {/* Summary Statistics */}
                        <Row className="mb-4">
                          <Col md={3} className="text-center">
                            <div className="border rounded p-3">
                              <h6 className="text-success">Present</h6>
                              <h3>{employeeSummary.presentDays}</h3>
                              <small className="text-muted">Days</small>
                            </div>
                          </Col>
                          <Col md={3} className="text-center">
                            <div className="border rounded p-3">
                              <h6 className="text-danger">Absent</h6>
                              <h3>{employeeSummary.absentDays}</h3>
                              <small className="text-muted">Days</small>
                            </div>
                          </Col>
                          <Col md={3} className="text-center">
                            <div className="border rounded p-3">
                              <h6 className="text-warning">Leaves</h6>
                              <h3>{employeeSummary.leaveDays}</h3>
                              <small className="text-muted">Days</small>
                            </div>
                          </Col>
                          <Col md={3} className="text-center">
                            <div className="border rounded p-3">
                              <h6 className="text-info">Pending</h6>
                              <h3>{employeeSummary.pendingPunches}</h3>
                              <small className="text-muted">Punches</small>
                            </div>
                          </Col>
                        </Row>

                        {/* Work Hours Summary */}
                        <Row className="mb-4">
                          <Col md={6} className="text-center">
                            <div className="border rounded p-3">
                              <h6 className="text-primary">Total Hours</h6>
                              <h3>{employeeSummary.totalWorkHours}</h3>
                              <small className="text-muted">Hours</small>
                            </div>
                          </Col>
                          <Col md={6} className="text-center">
                            <div className="border rounded p-3">
                              <h6 className="text-primary">Average Hours</h6>
                              <h3>{employeeSummary.averageWorkHours}</h3>
                              <small className="text-muted">Per Day</small>
                            </div>
                          </Col>
                        </Row>

                        {/* Employee IDs */}
                        {(employeeSummary.attendanceEmployeeId || employeeSummary.leaveEmployeeId) && (
                          <Row className="mb-3">
                            {employeeSummary.attendanceEmployeeId && (
                              <Col md={6}>
                                <strong>Attendance ID:</strong> {employeeSummary.attendanceEmployeeId}
                              </Col>
                            )}
                            {employeeSummary.leaveEmployeeId && (
                              <Col md={6}>
                                <strong>Leave ID:</strong> {employeeSummary.leaveEmployeeId}
                              </Col>
                            )}
                          </Row>
                        )}

                        {/* Leave Dates Section */}
                        {employeeSummary.leaveDates && employeeSummary.leaveDates.length > 0 && (
                          <div className="mt-3">
                            <strong>Leave Dates ({employeeSummary.leaveDates.length} days):</strong>
                            <div className="mt-2">
                              {employeeSummary.leaveDates.map((date, index) => (
                                <Badge key={index} bg="warning" text="dark" className="me-1 mb-1">
                                  {formatDateWithDay(date)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Pending Punch Dates Section */}
                        {employeeSummary.pendingPunchDates && employeeSummary.pendingPunchDates.length > 0 && (
                          <div className="mt-3">
                            <strong>Pending Punch Dates ({employeeSummary.pendingPunchDates.length} days):</strong>
                            <div className="mt-2">
                              {employeeSummary.pendingPunchDates.map((date, index) => (
                                <Badge key={index} bg="danger" className="me-1 mb-1">
                                  {formatDateWithDay(date)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  )}
                </>
              ) : (
                <p className="text-muted">
                  Select an employee to view monthly summary
                </p>
              )}
            </Col>
          </Row>
        </Tab>
      </Tabs>
    </div>
  );
};

export default AttendancePage;