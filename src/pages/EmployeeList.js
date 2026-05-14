import React, { useEffect, useState } from "react";
import API from "../apis/employeeApi";
import EmployeeForm from "./EmployeeForm";

export default function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const employeesPerPage = 5;

  const fetchEmployees = async () => {
    try {
      const res = await API.get("");
      setEmployees(res.data);
      setFilteredEmployees(res.data); // Initialize filtered employees
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // ✅ Filter employees by name
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredEmployees(employees);
    } else {
      const filtered = employees.filter(emp =>
        emp.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEmployees(filtered);
    }
    setCurrentPage(1); // Reset to first page when search changes
  }, [searchTerm, employees]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      try {
        await API.delete(`/${id}`);
        alert("Employee deleted successfully!");
        fetchEmployees();
      } catch (err) {
        console.error(err);
        alert("Failed to delete employee.");
      }
    }
  };

  const handleEdit = (emp) => {
    setSelectedEmployee(emp);
    setShowModal(true);
  };

  // ✅ Pagination Logic - Use filteredEmployees instead of employees
  const indexOfLastEmployee = currentPage * employeesPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage;
  const currentEmployees = filteredEmployees.slice(indexOfFirstEmployee, indexOfLastEmployee);

  const totalPages = Math.ceil(filteredEmployees.length / employeesPerPage);

  const handlePageClick = (page) => setCurrentPage(page);

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Employee Management</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            setSelectedEmployee(null);
            setShowModal(true);
          }}
        >
          Add Employee
        </button>
      </div>

      {/* ✅ Search Filter */}
      <div className="row mb-3">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text">🔍</span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by employee name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={() => setSearchTerm("")}
              >
                Clear
              </button>
            )}
          </div>
        </div>
        <div className="col-md-6 text-end">
          <span className="badge bg-info fs-6">
            Showing {currentEmployees.length} of {filteredEmployees.length} employees
            {searchTerm && ` (filtered from ${employees.length} total)`}
          </span>
        </div>
      </div>

      <table className="table table-hover table-bordered shadow-sm">
        <thead className="table-dark">
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Designation</th>
            <th>Department</th>
            <th>Role</th>
            <th>Status</th>
            <th>Join Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentEmployees.length > 0 ? (
            currentEmployees.map((emp) => (
              <tr key={emp.id}>
                <td>{emp.id}</td>
                <td>
                  {searchTerm ? (
                    <span>
                      {emp.name.split(new RegExp(`(${searchTerm})`, 'gi')).map((part, index) =>
                        part.toLowerCase() === searchTerm.toLowerCase() ? (
                          <mark key={index} className="bg-warning">{part}</mark>
                        ) : (
                          part
                        )
                      )}
                    </span>
                  ) : (
                    emp.name
                  )}
                </td>
                <td>{emp.email}</td>
                <td>{emp.designation}</td>
                <td>{emp.department}</td>
                <td>{emp.role}</td>
                <td>
                  <span
                    className={`badge ${
                      emp.status === "Active" ? "bg-success" : "bg-secondary"
                    }`}
                  >
                    {emp.status}
                  </span>
                </td>
                <td>{emp.dateOfJoining}</td>
                <td>
                  {/* Only Edit and Delete buttons - View button removed */}
                  <button className="btn btn-sm btn-warning me-2" onClick={() => handleEdit(emp)}>
                    Edit
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(emp.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="9" className="text-center py-4">
                <div className="text-muted">
                  {searchTerm ? (
                    <>
                      <h5>🔍 No employees found</h5>
                      <p>No employees match your search for "<strong>{searchTerm}</strong>"</p>
                      <button 
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => setSearchTerm("")}
                      >
                        Clear search
                      </button>
                    </>
                  ) : (
                    <>
                      <h5>👥 No employees found</h5>
                      <p>No employees have been added yet.</p>
                    </>
                  )}
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ✅ Pagination UI - Only show if there are pages */}
      {totalPages > 0 && (
        <nav>
          <ul className="pagination justify-content-center">
            <li className={`page-item ${currentPage === 1 && "disabled"}`}>
              <button 
                className="page-link" 
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                &laquo; Previous
              </button>
            </li>

            {[...Array(totalPages)].map((_, i) => (
              <li key={i} className={`page-item ${currentPage === i + 1 ? "active" : ""}`}>
                <button className="page-link" onClick={() => handlePageClick(i + 1)}>
                  {i + 1}
                </button>
              </li>
            ))}

            <li className={`page-item ${currentPage === totalPages && "disabled"}`}>
              <button 
                className="page-link" 
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next &raquo;
              </button>
            </li>
          </ul>
        </nav>
      )}

      {showModal && (
        <div className="modal show fade d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title">{selectedEmployee ? "Edit Employee" : "Add Employee"}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <EmployeeForm
                  existingData={selectedEmployee}
                  onSuccess={() => {
                    fetchEmployees();
                    setShowModal(false);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}