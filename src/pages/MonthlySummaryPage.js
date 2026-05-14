import React, { useEffect, useState } from "react";
import { getMonthlySummary, getEmployeesInfo } from "../apis/attendanceApi";
import { Button, Form, Card, Row, Col } from "react-bootstrap";

const MonthlySummaryPage = () => {
  const [employeesInfoList, setEmployeesInfoList] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [summaryMonth, setSummaryMonth] = useState("");
  const [summaryYear, setSummaryYear] = useState("");
  const [employeeSummary, setEmployeeSummary] = useState(null);

  useEffect(() => {
    loadEmployeesInfo();
  }, []);

  const loadEmployeesInfo = async () => {
    try {
      const data = await getEmployeesInfo();
      setEmployeesInfoList(data || []);
    } catch (err) {
      console.error("Error fetching employees info:", err);
    }
  };

  const fetchEmployeeSummary = async () => {
    if (!selectedEmployee || !summaryMonth || !summaryYear) return;
    try {
      const data = await getMonthlySummary(
        selectedEmployee,
        parseInt(summaryMonth),
        parseInt(summaryYear)
      );
      setEmployeeSummary(data);
    } catch (err) {
      console.error("Error fetching monthly summary:", err);
    }
  };

  return (
    <div className="container mt-4">
      <h2>Employee Monthly Summary</h2>
      <Row>
        <Col md={4}>
          <h5>Employees</h5>
          <ul className="list-group">
            {employeesInfoList.length > 0 ? (
              employeesInfoList.map((emp) => (
                <li
                  key={emp.employeeId}
                  className={`list-group-item ${
                    selectedEmployee === emp.employeeId ? "active" : ""
                  }`}
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    setSelectedEmployee(emp.employeeId);
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
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Control
                      type="number"
                      placeholder="Year (e.g., 2025)"
                      value={summaryYear}
                      onChange={(e) => setSummaryYear(e.target.value)}
                    />
                  </Col>
                  <Col md={4}>
                    <Button variant="primary" onClick={fetchEmployeeSummary}>
                      Get Summary
                    </Button>
                  </Col>
                </Row>
              </Form.Group>

              {employeeSummary && (
                <Card className="mt-3 shadow-sm border-0">
                  <Card.Body>
                    <h5 className="mb-3">
                      Summary for {employeeSummary.employeeId}
                    </h5>
                    <ul className="list-unstyled">
                      <li>
                        <strong>Total Working Days:</strong>{" "}
                        {employeeSummary.totalWorkingDays}
                      </li>
                      <li>
                        <strong>Present Days:</strong>{" "}
                        {employeeSummary.presentDays}
                      </li>
                      <li>
                        <strong>Half Days:</strong> {employeeSummary.halfDays}
                      </li>
                      <li>
                        <strong>Absent Days:</strong> {employeeSummary.absentDays}
                      </li>
                      <li>
                        <strong>Approved Leaves:</strong>{" "}
                        {employeeSummary.approvedLeaves}
                      </li>
                      <li>
                        <strong>Holidays:</strong> {employeeSummary.holidays}
                      </li>
                      <li>
                        <strong>Pending Punches:</strong>{" "}
                        {employeeSummary.pendingPunches}
                      </li>
                      <li>
                        <strong>Total Working Hours:</strong>{" "}
                        {employeeSummary.totalWorkingHours}
                      </li>
                    </ul>
                  </Card.Body>
                </Card>
              )}
            </>
          ) : (
            <p className="text-muted">Select an employee to view summary</p>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default MonthlySummaryPage;
