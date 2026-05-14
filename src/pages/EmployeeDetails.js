import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../apis/employeeApi";

export default function EmployeeDetails() {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);

  useEffect(() => {
    API.get(`/${id}`)
      .then((res) => setEmployee(res.data))
      .catch((err) => console.error("❌ Error loading employee:", err));
  }, [id]);

  if (!employee) return <p>Loading...</p>;

  return (
    <div className="container mt-5">
      <h2>{employee.name}</h2>
      <p><strong>ID:</strong> {employee.id}</p>
      <p><strong>Email:</strong> {employee.email}</p>
      <p><strong>Designation:</strong> {employee.designation}</p>
      <p><strong>Department:</strong> {employee.department}</p>
      <p><strong>Role:</strong> {employee.role}</p>
      <p>
        <strong>Status:</strong>{" "}
        <span className={`badge ${employee.status === "Active" ? "bg-success" : "bg-secondary"}`}>
          {employee.status}
        </span>
      </p>
      <p><strong>Join Date:</strong> {employee.dateOfJoining}</p>
      <p><strong>Salary:</strong> {employee.annualSalary}</p>
    </div>
  );
}
