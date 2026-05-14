import React, { useState, useEffect, useContext } from 'react';
import { 
  Card, 
  Tabs, 
  Tab, 
  Row, 
  Col, 
  Form,
  Table,
  Badge,
  Spinner,
  Alert
} from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { 
  getEmployeeMonthlySummary,
  getEmployeeMonthlyDetails,
  getEmployeeDailyAttendance 
} from '../apis/attendanceApi';

const EmployeeAttendance = ({ employeeId }) => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dailyAttendance, setDailyAttendance] = useState(null);
  const [monthlyAttendance, setMonthlyAttendance] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [monthLoading, setMonthLoading] = useState(false);

  // Fetch daily attendance
  const fetchDailyAttendance = async (date = selectedDate) => {
    try {
      setLoading(true);
      const data = await getEmployeeDailyAttendance(employeeId, date);
      setDailyAttendance(data);
    } catch (error) {
      console.error('Error fetching daily attendance:', error);
      alert('Failed to fetch daily attendance');
    } finally {
      setLoading(false);
    }
  };

  // Fetch monthly attendance records
  const fetchMonthlyAttendance = async () => {
    try {
      setMonthLoading(true);
      const startDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-01`;
      const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];
      
      const data = await getEmployeeMonthlyDetails(employeeId, startDate, endDate);
      setMonthlyAttendance(data || []);
    } catch (error) {
      console.error('Error fetching monthly attendance:', error);
      alert('Failed to fetch monthly records');
    } finally {
      setMonthLoading(false);
    }
  };

  // Fetch monthly summary
  const fetchMonthlySummary = async () => {
    try {
      setMonthLoading(true);
      const monthStr = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
      const data = await getEmployeeMonthlySummary(employeeId, monthStr);
      setMonthlySummary(data);
    } catch (error) {
      console.error('Error fetching monthly summary:', error);
      alert('Failed to fetch monthly summary');
    } finally {
      setMonthLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'daily') {
      fetchDailyAttendance();
    } else if (activeTab === 'monthly') {
      fetchMonthlyAttendance();
      fetchMonthlySummary();
    }
  }, [activeTab, selectedDate, selectedMonth, selectedYear]);

  const getStatusVariant = (status) => {
    switch (status) {
      case 'PRESENT': return 'success';
      case 'ABSENT': return 'danger';
      case 'HALF_DAY': return 'warning';
      default: return 'secondary';
    }
  };

  const formatTime = (time) => {
    if (!time) return '-';
    return time;
  };

  const formatWorkHours = (hours) => {
    if (!hours || hours === 0) return '-';
    const totalMinutes = hours * 60;
    const workHours = Math.floor(totalMinutes / 60);
    const workMinutes = Math.round(totalMinutes % 60);
    return `${workHours}h ${workMinutes}m`;
  };

  return (
    <div className="container mt-4">
      {/* Employee Header Info */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>My Attendance</h2>
          <p className="text-muted mb-0">View your daily and monthly attendance records</p>
        </div>
        {user && (
          <div className="text-end">
            <Badge bg="primary" className="fs-6">
              {user.employeeName || user.email}
            </Badge>
            <div className="text-muted small">ID: {employeeId}</div>
          </div>
        )}
      </div>

      <Tabs
        activeKey={activeTab}
        onSelect={(tab) => setActiveTab(tab)}
        id="employee-attendance-tabs"
        className="mb-3"
      >
        {/* Daily Attendance Tab */}
        <Tab eventKey="daily" title="📅 Daily Attendance">
          <Row className="mb-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Select Date</Form.Label>
                <Form.Control
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    fetchDailyAttendance(e.target.value);
                  }}
                />
              </Form.Group>
            </Col>
          </Row>

          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" role="status" variant="primary">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <p className="mt-2">Loading attendance data...</p>
            </div>
          ) : dailyAttendance ? (
            <Card>
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">
                  Attendance for {new Date(selectedDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={3}>
                    <strong>Status:</strong>{' '}
                    <Badge bg={getStatusVariant(dailyAttendance.status)} className="fs-6">
                      {dailyAttendance.status}
                    </Badge>
                  </Col>
                  <Col md={3}>
                    <strong>Shift:</strong> {dailyAttendance.shift || '-'}
                  </Col>
                  <Col md={3}>
                    <strong>In Time:</strong> {formatTime(dailyAttendance.inTime)}
                  </Col>
                  <Col md={3}>
                    <strong>Out Time:</strong> {formatTime(dailyAttendance.outTime)}
                  </Col>
                </Row>
                <Row className="mt-3">
                  <Col md={3}>
                    <strong>Work Hours:</strong> {formatWorkHours(dailyAttendance.workHours)}
                  </Col>
                  <Col md={3}>
                    <strong>Late In:</strong> {dailyAttendance.lateIn || '-'}
                  </Col>
                  <Col md={3}>
                    <strong>Early Out:</strong> {dailyAttendance.erlOut || '-'}
                  </Col>
                  <Col md={3}>
                    <strong>Remark:</strong> {dailyAttendance.remark || '-'}
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          ) : (
            <Alert variant="info">
              📝 No attendance record found for selected date.
            </Alert>
          )}
        </Tab>

        {/* Monthly Summary Tab */}
        <Tab eventKey="monthly" title="📊 Monthly Summary">
          <Row className="mb-3">
            <Col md={3}>
              <Form.Group>
                <Form.Label>Month</Form.Label>
                <Form.Select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Year</Form.Label>
                <Form.Select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                >
                  {Array.from({ length: 10 }, (_, i) => {
                    const year = new Date().getFullYear() - 5 + i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          {monthLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" role="status" variant="primary">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <p className="mt-2">Loading monthly data...</p>
            </div>
          ) : (
            <>
              {/* Monthly Summary Card */}
              {monthlySummary && (
                <Card className="mb-4">
                  <Card.Header className="bg-success text-white">
                    <h5 className="mb-0">
                      📈 Monthly Summary - {monthlySummary.month}
                      {monthlySummary.attendanceEmployeeId && (
                        <small className="ms-2 opacity-75">
                          (ID: {monthlySummary.attendanceEmployeeId})
                        </small>
                      )}
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={2} className="text-center mb-3">
                        <div className="border rounded p-3 bg-success bg-opacity-10">
                          <h6 className="text-success">✅ Present</h6>
                          <h3 className="text-success">{monthlySummary.presentDays}</h3>
                          <small className="text-muted">Days</small>
                        </div>
                      </Col>
                      <Col md={2} className="text-center mb-3">
                        <div className="border rounded p-3 bg-danger bg-opacity-10">
                          <h6 className="text-danger">❌ Absent</h6>
                          <h3 className="text-danger">{monthlySummary.absentDays}</h3>
                          <small className="text-muted">Days</small>
                        </div>
                      </Col>
                      <Col md={2} className="text-center mb-3">
                        <div className="border rounded p-3 bg-warning bg-opacity-10">
                          <h6 className="text-warning">🍃 Leaves</h6>
                          <h3 className="text-warning">{monthlySummary.leaveDays}</h3>
                          <small className="text-muted">Days</small>
                        </div>
                      </Col>
                      <Col md={2} className="text-center mb-3">
                        <div className="border rounded p-3 bg-info bg-opacity-10">
                          <h6 className="text-info">⏰ Total Hours</h6>
                          <h3 className="text-info">{monthlySummary.totalWorkHours}</h3>
                          <small className="text-muted">Hours</small>
                        </div>
                      </Col>
                      <Col md={2} className="text-center mb-3">
                        <div className="border rounded p-3 bg-primary bg-opacity-10">
                          <h6 className="text-primary">📊 Avg Hours</h6>
                          <h3 className="text-primary">{monthlySummary.averageWorkHours}</h3>
                          <small className="text-muted">Per Day</small>
                        </div>
                      </Col>
                      <Col md={2} className="text-center mb-3">
                        <div className="border rounded p-3 bg-secondary bg-opacity-10">
                          <h6 className="text-secondary">⏳ Pending</h6>
                          <h3 className="text-secondary">{monthlySummary.pendingPunches}</h3>
                          <small className="text-muted">Punches</small>
                        </div>
                      </Col>
                    </Row>
                    
                    {/* Leave Dates Section */}
                    {monthlySummary.leaveDates && monthlySummary.leaveDates.length > 0 && (
                      <div className="mt-3">
                        <strong>🍃 Leave Dates:</strong>
                        <div className="mt-2">
                          {monthlySummary.leaveDates.map((date, index) => (
                            <Badge key={index} bg="warning" text="dark" className="me-1 mb-1">
                              {date}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pending Punch Dates Section */}
                    {monthlySummary.pendingPunchDates && monthlySummary.pendingPunchDates.length > 0 && (
                      <div className="mt-3">
                        <strong>⏳ Pending Punch Dates:</strong>
                        <div className="mt-2">
                          {monthlySummary.pendingPunchDates.map((date, index) => (
                            <Badge key={index} bg="danger" className="me-1 mb-1">
                              {date}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Additional Information */}
                    <Row className="mt-3">
                      <Col md={6}>
                        <strong>Total Working Days:</strong> {monthlySummary.totalWorkingDays}
                      </Col>
                      {monthlySummary.leaveEmployeeId && (
                        <Col md={6}>
                          <strong>Leave Employee ID:</strong> {monthlySummary.leaveEmployeeId}
                        </Col>
                      )}
                    </Row>
                  </Card.Body>
                </Card>
              )}

              {/* Monthly Attendance Records Table */}
              <Card>
                <Card.Header className="bg-secondary text-white">
                  <h5 className="mb-0">📋 Daily Records</h5>
                </Card.Header>
                <Card.Body>
                  {monthlyAttendance.length > 0 ? (
                    <Table striped bordered hover responsive>
                      <thead className="table-dark">
                        <tr>
                          <th>Date</th>
                          <th>Shift</th>
                          <th>In Time</th>
                          <th>Out Time</th>
                          <th>Work Hours</th>
                          <th>Status</th>
                          <th>Late In</th>
                          <th>Early Out</th>
                          <th>Remark</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyAttendance.map((record) => (
                          <tr key={record.id}>
                            <td>{record.date}</td>
                            <td>{record.shift || '-'}</td>
                            <td>{formatTime(record.inTime)}</td>
                            <td>{formatTime(record.outTime)}</td>
                            <td>{formatWorkHours(record.workHours)}</td>
                            <td>
                              <Badge bg={getStatusVariant(record.status)}>
                                {record.status}
                              </Badge>
                            </td>
                            <td>{record.lateIn || '-'}</td>
                            <td>{record.erlOut || '-'}</td>
                            <td>{record.remark || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <Alert variant="info">
                      📝 No attendance records found for selected month.
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            </>
          )}
        </Tab>
      </Tabs>
    </div>
  );
};

export default EmployeeAttendance;