import React, { useContext, useEffect, useState } from "react";
import { Table, Button, Card, Badge, Form, Row, Col, Spinner, Pagination, Alert, Modal } from "react-bootstrap";
import { AuthContext } from "../context/AuthContext";
import { getAllLeaves, approveLeave, rejectLeave, getLeaveBalance, getMonthlyPaidLeaveUsage, creditLeaves, getEmployeeDetails } from "../apis/leaveApi";

const LeaveManagementPage = () => {
  const { user } = useContext(AuthContext);

  const [leaveRequests, setLeaveRequests] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [filters, setFilters] = useState({ 
    employeeId: "", 
    employeeName: "", 
    leaveType: "", 
    status: "PENDING"
  });

  const [selectedEmployeeBalance, setSelectedEmployeeBalance] = useState([]);
  const [selectedEmployeePaidUsage, setSelectedEmployeePaidUsage] = useState(null);
  const [showBalanceCard, setShowBalanceCard] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);

  // Allocate Leave Modal State
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [allocating, setAllocating] = useState(false);
  const [fetchingEmployee, setFetchingEmployee] = useState(false);
  const [allocationForm, setAllocationForm] = useState({
    employeeId: "",
    employeeName: "",
    leaveType: "SICK",
    daysToCredit: 10,
    creditDate: new Date().toISOString().split('T')[0],
    financialYear: "2025-2026",
    yearlyAllocation: true
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  useEffect(() => {
    loadLeaveRequests();
  }, []);

  useEffect(() => {
    applyFilters();
    setCurrentPage(1);
  }, [filters, leaveRequests]);

  // Load all leaves
  const loadLeaveRequests = async () => {
    try {
      const data = await getAllLeaves();
      setLeaveRequests(data || []);
    } catch (err) {
      console.error("Error loading leave requests:", err);
    }
  };

  // Handle Allocate Leave
  const handleAllocateLeave = async () => {
    if (!allocationForm.employeeId || !allocationForm.employeeName || allocationForm.numberOfLeaves <= 0) {
      alert("Please fill all required fields with valid data");
      return;
    }

    try {
      setAllocating(true);
      await creditLeaves(allocationForm);
      alert("Leaves allocated successfully!");
      setShowAllocateModal(false);
      // Reset form
      setAllocationForm({
        employeeId: "",
        employeeName: "",
        leaveType: "SICK",
        numberOfLeaves: 10,
        creditDate: new Date().toISOString().split('T')[0],
        financialYear: "2025-2026",
        yearlyAllocation: true
      });
    } catch (err) {
      console.error("Error allocating leaves:", err);
      alert("Error allocating leaves: " + err.message);
    } finally {
      setAllocating(false);
    }
  };

  // Handle allocation form changes
  const handleAllocationChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAllocationForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // ENHANCED: Auto-fetch employee name when employee ID changes
  useEffect(() => {
    const fetchEmployeeName = async () => {
      if (allocationForm.employeeId && allocationForm.employeeId.length >= 3) {
        setFetchingEmployee(true);
        
        try {
          // First, try to find in existing leave requests (quick local search)
          const foundInLeaves = leaveRequests.find(
            leave => leave.employeeId.toLowerCase() === allocationForm.employeeId.toLowerCase()
          );
          
          if (foundInLeaves) {
            setAllocationForm(prev => ({
              ...prev,
              employeeName: foundInLeaves.employeeName || ""
            }));
          } else {
            // If not found locally, try API call to get employee details
            try {
              const employeeData = await getEmployeeDetails(allocationForm.employeeId);
              if (employeeData && (employeeData.name || employeeData.employeeName)) {
                setAllocationForm(prev => ({
                  ...prev,
                  employeeName: employeeData.name || employeeData.employeeName || ""
                }));
              } else {
                // Clear name if employee not found
                setAllocationForm(prev => ({
                  ...prev,
                  employeeName: ""
                }));
              }
            } catch (apiError) {
              console.warn("Could not fetch employee details from API:", apiError);
              // If API fails, clear the name field
              setAllocationForm(prev => ({
                ...prev,
                employeeName: ""
              }));
            }
          }
        } catch (error) {
          console.error("Error fetching employee name:", error);
        } finally {
          setFetchingEmployee(false);
        }
      } else if (allocationForm.employeeId === "") {
        // Clear employee name if employee ID is cleared
        setAllocationForm(prev => ({
          ...prev,
          employeeName: ""
        }));
        setFetchingEmployee(false);
      }
    };

    // Add debounce to prevent too many API calls
    const timeoutId = setTimeout(fetchEmployeeName, 500);
    return () => clearTimeout(timeoutId);
  }, [allocationForm.employeeId, leaveRequests]);

  // Open allocate modal with employee data if available
  const handleOpenAllocateModal = (employeeId = "", employeeName = "") => {
    setAllocationForm(prev => ({
      ...prev,
      employeeId: employeeId || prev.employeeId,
      employeeName: employeeName || prev.employeeName
    }));
    setShowAllocateModal(true);
  };

  // Approve leave
  const handleApprove = async (leaveId) => {
    try {
      const managerId = user?.employeeId;
      await approveLeave(leaveId, managerId);
      setLeaveRequests((prev) =>
        prev.map((leave) =>
          leave.id === leaveId ? { ...leave, status: "APPROVED" } : leave
        )
      );
      alert("Leave approved successfully!");
    } catch (err) {
      console.error("Error approving leave:", err);
      alert("Error approving leave: " + err.message);
    }
  };

  // Reject leave
  const handleReject = async (leaveId) => {
    try {
      const managerId = user?.employeeId;
      await rejectLeave(leaveId, managerId);
      setLeaveRequests((prev) =>
        prev.map((leave) =>
          leave.id === leaveId ? { ...leave, status: "REJECTED" } : leave
        )
      );
      alert("Leave rejected successfully!");
    } catch (err) {
      console.error("Error rejecting leave:", err);
      alert("Error rejecting leave: " + err.message);
    }
  };

  // View leave balance with paid usage
  const handleViewBalance = async (employeeId) => {
    try {
      setLoadingBalance(true);
      setSelectedEmployeeId(employeeId);
      
      // Get leave balance
      const balanceData = await getLeaveBalance(employeeId);
      
      // Get monthly paid leave usage
      const currentDate = new Date();
      const paidUsageData = await getMonthlyPaidLeaveUsage(
        employeeId, 
        currentDate.getMonth() + 1, 
        currentDate.getFullYear()
      );

      // Convert object {SICK:10, PAID:15, CASUAL:7, WFH:0} into array of objects
      const formattedData = Object.entries(balanceData || {}).map(([leaveType, remainingLeaves]) => ({
        employeeId,
        leaveType,
        remainingLeaves,
        isWFH: leaveType === 'WFH'
      }));

      setSelectedEmployeeBalance(formattedData);
      setSelectedEmployeePaidUsage(paidUsageData);
      setShowBalanceCard(true);
    } catch (err) {
      console.error("Error fetching leave balance:", err);
      setSelectedEmployeeBalance([]);
      setSelectedEmployeePaidUsage(null);
      setShowBalanceCard(true);
    } finally {
      setLoadingBalance(false);
    }
  };

  // Go back to main table
  const handleBackToTable = () => {
    setShowBalanceCard(false);
    setSelectedEmployeeId(null);
    setSelectedEmployeeBalance([]);
    setSelectedEmployeePaidUsage(null);
  };

  // Filters
  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const applyFilters = () => {
    let filtered = [...leaveRequests];
    
    if (filters.employeeId) {
      filtered = filtered.filter((l) =>
        l.employeeId.toLowerCase().includes(filters.employeeId.toLowerCase())
      );
    }
    if (filters.employeeName) {
      filtered = filtered.filter((l) =>
        l.employeeName?.toLowerCase().includes(filters.employeeName.toLowerCase())
      );
    }
    if (filters.leaveType) {
      filtered = filtered.filter(
        (l) => l.leaveType.toUpperCase() === filters.leaveType.toUpperCase()
      );
    }
    if (filters.status) {
      filtered = filtered.filter(
        (l) => l.status.toUpperCase() === filters.status.toUpperCase()
      );
    }
    
    setFilteredLeaves(filtered);
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "APPROVED": return "success";
      case "REJECTED": return "danger";
      case "PENDING": return "warning";
      case "CANCELLED": return "secondary";
      case "AUTO_APPROVED": return "info";
      default: return "secondary";
    }
  };

  // Get leave type badge variant
  const getLeaveTypeBadge = (leaveType, isConvertedFromPaid) => {
    if (isConvertedFromPaid) {
      return <Badge bg="warning" text="dark">CONVERTED UNPAID</Badge>;
    }
    
    switch (leaveType) {
      case "WFH": return <Badge bg="info">🏠 WFH</Badge>;
      case "PAID": return <Badge bg="primary">PAID</Badge>;
      case "SICK": return <Badge bg="secondary">SICK</Badge>;
      case "CASUAL": return <Badge bg="success">CASUAL</Badge>;
      case "UNPAID": return <Badge bg="dark">UNPAID</Badge>;
      default: return <Badge bg="light" text="dark">{leaveType}</Badge>;
    }
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredLeaves.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLeaves.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    const newItemsPerPage = parseInt(e.target.value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Generate page numbers for pagination
  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // First page
    if (startPage > 1) {
      items.push(
        <Pagination.Item key={1} onClick={() => paginate(1)}>
          1
        </Pagination.Item>
      );
      if (startPage > 2) {
        items.push(<Pagination.Ellipsis key="start-ellipsis" />);
      }
    }

    // Page numbers
    for (let page = startPage; page <= endPage; page++) {
      items.push(
        <Pagination.Item
          key={page}
          active={page === currentPage}
          onClick={() => paginate(page)}
        >
          {page}
        </Pagination.Item>
      );
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(<Pagination.Ellipsis key="end-ellipsis" />);
      }
      items.push(
        <Pagination.Item key={totalPages} onClick={() => paginate(totalPages)}>
          {totalPages}
        </Pagination.Item>
      );
    }

    return items;
  };

  // Reset to first page when items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Leave Management</h2>

      <Alert variant="info" className="mb-3">
        <strong>New Features:</strong> WFH (Work From Home) leaves now available. All leaves require manager approval including WFH.
      </Alert>

      {/* Allocate Leave Button */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div></div>
        <Button 
          variant="success" 
          onClick={() => handleOpenAllocateModal()}
          className="d-flex align-items-center gap-2"
        >
          <i className="fas fa-plus"></i>
          Allocate Leaves
        </Button>
      </div>

      {/* Filters */}
      {!showBalanceCard && (
        <Card className="mb-3">
          <Card.Body>
            <Row className="g-3">
              <Col md={2}>
                <Form.Control
                  placeholder="Employee ID"
                  name="employeeId"
                  value={filters.employeeId}
                  onChange={handleFilterChange}
                />
              </Col>
              <Col md={2}>
                <Form.Control
                  placeholder="Employee Name"
                  name="employeeName"
                  value={filters.employeeName}
                  onChange={handleFilterChange}
                />
              </Col>
              <Col md={2}>
                <Form.Select
                  name="leaveType"
                  value={filters.leaveType}
                  onChange={handleFilterChange}
                >
                  <option value="">All Leave Types</option>
                  <option value="SICK">SICK</option>
                  <option value="PAID">PAID</option>
                  <option value="CASUAL">CASUAL</option>
                  <option value="UNPAID">UNPAID</option>
                  <option value="WFH">WFH</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                >
                  <option value="PENDING">PENDING</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="">ALL STATUS</option>
                </Form.Select>
              </Col>
              <Col md={4} className="d-flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setFilters({ 
                    employeeId: "", 
                    employeeName: "", 
                    leaveType: "", 
                    status: "PENDING" 
                  })}
                >
                  Reset Filters
                </Button>
                <Button
                  variant="primary"
                  onClick={loadLeaveRequests}
                >
                  Refresh
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Conditional Rendering */}
      {!showBalanceCard ? (
        // ======== MAIN TABLE WITH PAGINATION ========
        <Card className="shadow-sm border-0">
          <Card.Body>
            {/* Results Count */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <strong>Total Results:</strong> {filteredLeaves.length} leaves
                {filters.status && (
                  <span className="text-muted ms-2">(Filtered by: {filters.status})</span>
                )}
              </div>
              <div>
                <strong>Showing:</strong> {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredLeaves.length)} of {filteredLeaves.length}
              </div>
            </div>

            <Table striped bordered hover responsive>
              <thead className="table-dark">
                <tr>
                  <th>Leave ID</th>
                  <th>Employee ID</th>
                  <th>Employee Name</th>
                  <th>Leave Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? (
                  currentItems.map((leave) => (
                    <tr key={leave.id}>
                      <td className="text-truncate" style={{maxWidth: '150px'}} title={leave.id}>
                        {leave.id.substring(0, 8)}...
                      </td>
                      <td>{leave.employeeId}</td>
                      <td>{leave.employeeName || "Unknown"}</td>
                      <td>
                        <div className="d-flex align-items-center gap-1">
                          {getLeaveTypeBadge(leave.leaveType, leave.isConvertedFromPaid)}
                          {leave.isConvertedFromPaid && (
                            <Badge bg="light" text="dark" title="Converted from PAID due to monthly limit">
                              ⚡
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td>{leave.startDate}</td>
                      <td>{leave.endDate}</td>
                      <td className="text-truncate" style={{maxWidth: '200px'}} title={leave.reason}>
                        {leave.reason || "-"}
                      </td>
                      <td>
                        <Badge bg={getStatusBadgeColor(leave.status)}>
                          {leave.status}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex flex-wrap gap-1">
                          {leave.status === "PENDING" &&
                            (user?.role?.toUpperCase() === "ADMIN" ||
                              user?.role?.toUpperCase() === "MANAGER") && (
                              <>
                                <Button
                                  size="sm"
                                  variant="success"
                                  onClick={() => handleApprove(leave.id)}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  onClick={() => handleReject(leave.id)}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                          <Button
                            size="sm"
                            variant="info"
                            onClick={() => handleViewBalance(leave.employeeId)}
                          >
                            View Balance
                          </Button>
                          {/* Quick Allocate Button */}
                          {(user?.role?.toUpperCase() === "ADMIN" || user?.role?.toUpperCase() === "MANAGER") && (
                            <Button
                              size="sm"
                              variant="outline-success"
                              onClick={() => handleOpenAllocateModal(leave.employeeId, leave.employeeName)}
                              title="Allocate leaves to this employee"
                            >
                              Allocate
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="text-center py-4">
                      <div className="text-muted">
                        <i className="fas fa-inbox fa-2x mb-2"></i>
                        <br />
                        No leave requests found.
                        {Object.values(filters).some(val => val) && (
                          <div className="mt-1">
                            <small>Try adjusting your filters</small>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>

            {/* Pagination */}
            {filteredLeaves.length > 0 && (
              <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap">
                <div className="mb-2">
                  <Form.Select 
                    style={{ width: 'auto' }}
                    value={itemsPerPage}
                    onChange={handleItemsPerPageChange}
                  >
                    <option value={5}>5 per page</option>
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                  </Form.Select>
                </div>
                
                <div className="mb-2">
                  <Pagination className="mb-0">
                    <Pagination.First 
                      disabled={currentPage === 1}
                      onClick={() => paginate(1)}
                    />
                    <Pagination.Prev 
                      disabled={currentPage === 1}
                      onClick={() => paginate(currentPage - 1)}
                    />
                    {renderPaginationItems()}
                    <Pagination.Next 
                      disabled={currentPage === totalPages}
                      onClick={() => paginate(currentPage + 1)}
                    />
                    <Pagination.Last 
                      disabled={currentPage === totalPages}
                      onClick={() => paginate(totalPages)}
                    />
                  </Pagination>
                </div>

                <div className="text-muted mb-2">
                  Page {currentPage} of {totalPages} • {filteredLeaves.length} total items
                </div>
              </div>
            )}
          </Card.Body>
        </Card>
      ) : (
        // ======== EMPLOYEE BALANCE CARD ========
        <Card className="shadow border-0">
          <Card.Header className="d-flex justify-content-between align-items-center bg-light">
            <h5 className="mb-0">
              Leave Balance for Employee: <strong>{selectedEmployeeId}</strong>
            </h5>
            <div className="d-flex gap-2">
              {/* Allocate Button in Balance Card */}
              {(user?.role?.toUpperCase() === "ADMIN" || user?.role?.toUpperCase() === "MANAGER") && (
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => handleOpenAllocateModal(selectedEmployeeId)}
                >
                  Allocate Leaves
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={handleBackToTable}>
                ← Back to Leaves
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            {loadingBalance ? (
              <div className="text-center py-4">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2 text-muted">Loading balance...</p>
              </div>
            ) : (
              <>
                {/* Paid Leave Usage Card */}
                {selectedEmployeePaidUsage && (
                  <Card className="mb-4 border-warning">
                    <Card.Header className="bg-warning bg-opacity-25">
                      <strong>📊 Monthly Paid Leave Usage</strong>
                    </Card.Header>
                    <Card.Body>
                      <Row>
                        <Col md={3}>
                          <div className="text-center">
                            <div className="h4 text-primary mb-0">{selectedEmployeePaidUsage.used}</div>
                            <small className="text-muted">Used</small>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div className="text-center">
                            <div className="h4 text-success mb-0">{selectedEmployeePaidUsage.remaining}</div>
                            <small className="text-muted">Remaining</small>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div className="text-center">
                            <div className="h4 mb-0">{selectedEmployeePaidUsage.limit}</div>
                            <small className="text-muted">Monthly Limit</small>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div className="text-center">
                            <div className="h4 text-info mb-0">
                              {selectedEmployeePaidUsage.month}/{selectedEmployeePaidUsage.year}
                            </div>
                            <small className="text-muted">Month/Year</small>
                          </div>
                        </Col>
                      </Row>
                      {selectedEmployeePaidUsage.used >= selectedEmployeePaidUsage.limit && (
                        <Alert variant="warning" className="mt-2 mb-0">
                          <small>⚠️ Employee has reached the monthly paid leave limit. Additional paid leaves will be converted to unpaid.</small>
                        </Alert>
                      )}
                    </Card.Body>
                  </Card>
                )}

                {/* Leave Balance Table */}
                {selectedEmployeeBalance.length > 0 ? (
                  <Table striped bordered hover>
                    <thead className="table-secondary">
                      <tr>
                        <th>Leave Type</th>
                        <th>Remaining Leaves</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedEmployeeBalance.map((bal, idx) => (
                        <tr key={idx}>
                          <td>
                            <strong>{bal.leaveType}</strong>
                            {bal.isWFH && <Badge bg="info" className="ms-2">WFH</Badge>}
                          </td>
                          <td>
                            <span className={bal.remainingLeaves === 0 ? "text-danger" : "text-success"}>
                              {bal.remainingLeaves}
                            </span>
                          </td>
                          <td>
                            {bal.leaveType === 'WFH' && (
                              <small className="text-muted">No balance deduction • Requires approval</small>
                            )}
                            {bal.leaveType === 'PAID' && selectedEmployeePaidUsage && (
                              <small className="text-muted">
                                {selectedEmployeePaidUsage.used}/{selectedEmployeePaidUsage.limit} used this month
                              </small>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <p className="text-center text-muted mb-0">
                    No leave balance data available.
                  </p>
                )}
              </>
            )}
          </Card.Body>
        </Card>
      )}

      {/* ENHANCED: Allocate Leave Modal */}
      <Modal show={showAllocateModal} onHide={() => setShowAllocateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Allocate Leaves to Employee</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Employee ID *</Form.Label>
                  <Form.Control
                    type="text"
                    name="employeeId"
                    value={allocationForm.employeeId}
                    onChange={handleAllocationChange}
                    placeholder="Enter employee ID"
                    required
                  />
                  <Form.Text className="text-muted">
                    Employee name will auto-fill if found in system
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Employee Name *</Form.Label>
                  <div className="position-relative">
                    <Form.Control
                      type="text"
                      name="employeeName"
                      value={allocationForm.employeeName}
                      onChange={handleAllocationChange}
                      placeholder={fetchingEmployee ? "Searching..." : "Employee name will auto-fill"}
                      required
                      disabled={fetchingEmployee}
                    />
                    {fetchingEmployee && (
                      <div className="position-absolute top-50 end-0 translate-middle-y me-2">
                        <Spinner animation="border" size="sm" />
                      </div>
                    )}
                  </div>
                  {!allocationForm.employeeName && allocationForm.employeeId && !fetchingEmployee && (
                    <Form.Text className="text-warning">
                      Employee not found. Please check the Employee ID.
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Leave Type *</Form.Label>
                  <Form.Select
                    name="leaveType"
                    value={allocationForm.leaveType}
                    onChange={handleAllocationChange}
                  >
                    <option value="SICK">SICK</option>
                    <option value="CASUAL">CASUAL</option>
                    <option value="PAID">PAID</option>
                    <option value="UNPAID">UNPAID</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Number of Leaves *</Form.Label>
                  <Form.Control
                    type="number"
                    name="numberOfLeaves"
                    value={allocationForm.numberOfLeaves}
                    onChange={handleAllocationChange}
                    min="1"
                    max="100"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Credit Date *</Form.Label>
                  <Form.Control
                    type="date"
                    name="creditDate"
                    value={allocationForm.creditDate}
                    onChange={handleAllocationChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Financial Year *</Form.Label>
                  <Form.Select
                    name="financialYear"
                    value={allocationForm.financialYear}
                    onChange={handleAllocationChange}
                  >
                    <option value="2024-2025">2024-2025</option>
                    <option value="2025-2026">2025-2026</option>
                    <option value="2026-2027">2026-2027</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Check
                  type="checkbox"
                  name="yearlyAllocation"
                  label="Yearly Allocation"
                  checked={allocationForm.yearlyAllocation}
                  onChange={handleAllocationChange}
                  className="mt-2"
                />
                <Form.Text className="text-muted">
                  If checked, this will be treated as yearly leave allocation. Otherwise, it's a one-time credit.
                </Form.Text>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAllocateModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="success" 
            onClick={handleAllocateLeave}
            disabled={allocating || !allocationForm.employeeId || !allocationForm.employeeName || fetchingEmployee}
          >
            {allocating ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Allocating...
              </>
            ) : (
              'Allocate Leaves'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default LeaveManagementPage;