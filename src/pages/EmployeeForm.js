import React, { useState, useEffect } from "react";
import API from "../apis/employeeApi";

export default function EmployeeForm({ existingData, onSuccess }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    designation: "",
    department: "",
    role: "",
    annualSalary: "",
    status: "Active",
    dateOfJoining: "",
    phoneNumber: "",
    address: "",
    panNumber: "",
    pfNumber: "",
    uanNumber: "",
    bankName: "",
    bankBranch: "",
    bankAccountNumber: "",
    vendorCode: "",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const departments = ["Engineering", "IT", "HR", "Finance", "Marketing", "Sales"];
  const roles = ["EMPLOYEE", "MANAGER", "HR", "ADMIN"];

  // ✅ Prefill form when editing
  useEffect(() => {
    if (existingData) {
      setForm(existingData);
    }
  }, [existingData]);

  // ✅ Validation rules
  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case "name":
        if (!value.trim()) {
          newErrors.name = "Full name is required";
        } else if (value.trim().length < 2) {
          newErrors.name = "Name must be at least 2 characters long";
        } else if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
          newErrors.name = "Name can only contain letters and spaces";
        } else {
          delete newErrors.name;
        }
        break;

      case "email":
        if (!value) {
          newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = "Please enter a valid email address";
        } else {
          delete newErrors.email;
        }
        break;

      case "phoneNumber":
        if (value && !/^[6-9]\d{9}$/.test(value.replace(/\D/g, ''))) {
          newErrors.phoneNumber = "Please enter a valid 10-digit Indian phone number";
        } else {
          delete newErrors.phoneNumber;
        }
        break;

      case "designation":
        if (!value.trim()) {
          newErrors.designation = "Designation is required";
        } else {
          delete newErrors.designation;
        }
        break;

      case "department":
        if (!value) {
          newErrors.department = "Department is required";
        } else {
          delete newErrors.department;
        }
        break;

      case "role":
        if (!value) {
          newErrors.role = "Role is required";
        } else {
          delete newErrors.role;
        }
        break;

     case "annualSalary":
    const cleanedValue = value.toString().replace(/[^0-9.]/g, "");
    const num = parseFloat(cleanedValue);

    if (!cleanedValue) {
        newErrors.annualSalary = "Annual salary is required";
    } else if (isNaN(num) || num <= 0) {
        newErrors.annualSalary = "Annual salary must be a positive number";
    } else if (num < 10000) {
        newErrors.annualSalary = "Annual salary must be at least ₹10,000";
    } else if (num > 100000000) {
        newErrors.annualSalary = "Annual salary cannot exceed ₹10,00,00,000";
    } else {
        delete newErrors.annualSalary;
    }
    break;


      case "dateOfJoining":
        if (!value) {
          newErrors.dateOfJoining = "Date of joining is required";
        } else {
          const selectedDate = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (selectedDate > today) {
            newErrors.dateOfJoining = "Date of joining cannot be in the future";
          } else {
            delete newErrors.dateOfJoining;
          }
        }
        break;

      case "panNumber":
        if (value && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value.toUpperCase())) {
          newErrors.panNumber = "Please enter a valid PAN number (Format: ABCDE1234F)";
        } else {
          delete newErrors.panNumber;
        }
        break;

      case "pfNumber":
        if (value && !/^[A-Z]{2}[A-Z]{3}\d{7}$/.test(value.toUpperCase())) {
          newErrors.pfNumber = "Please enter a valid PF number (Format: XXYYY1234567)";
        } else {
          delete newErrors.pfNumber;
        }
        break;

      case "uanNumber":
        if (value && !/^\d{12}$/.test(value)) {
          newErrors.uanNumber = "UAN number must be exactly 12 digits";
        } else {
          delete newErrors.uanNumber;
        }
        break;

      case "bankAccountNumber":
        if (value && !/^\d{9,18}$/.test(value)) {
          newErrors.bankAccountNumber = "Bank account number must be 9-18 digits";
        } else {
          delete newErrors.bankAccountNumber;
        }
        break;

      case "vendorCode":
        if (value && !/^[A-Z0-9]{4,10}$/.test(value.toUpperCase())) {
          newErrors.vendorCode = "Vendor code must be 4-10 alphanumeric characters";
        } else {
          delete newErrors.vendorCode;
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Validate entire form
  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!form.name.trim()) newErrors.name = "Full name is required";
    if (!form.email) newErrors.email = "Email is required";
    if (!form.designation.trim()) newErrors.designation = "Designation is required";
    if (!form.department) newErrors.department = "Department is required";
    if (!form.role) newErrors.role = "Role is required";
    if (!form.annualSalary) newErrors.annualSalary = "Annual salary is required";
    if (!form.dateOfJoining) newErrors.dateOfJoining = "Date of joining is required";

    // Email format validation
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Phone number validation
    if (form.phoneNumber && !/^[6-9]\d{9}$/.test(form.phoneNumber.replace(/\D/g, ''))) {
      newErrors.phoneNumber = "Please enter a valid 10-digit Indian phone number";
    }

    // Salary validation
    if (form.annualSalary) {
      const salary = parseFloat(form.annualSalary);
      if (isNaN(salary) || salary <= 0) {
        newErrors.annualSalary = "Annual salary must be a positive number";
      } else if (salary < 10000) {
        newErrors.annualSalary = "Annual salary must be at least ₹10,000";
      } else if (salary > 100000000) {
        newErrors.annualSalary = "Annual salary cannot exceed ₹10,00,00,000";
      }
    }

    // Date validation
    if (form.dateOfJoining) {
      const selectedDate = new Date(form.dateOfJoining);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate > today) {
        newErrors.dateOfJoining = "Date of joining cannot be in the future";
      }
    }

    // PAN validation
    if (form.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(form.panNumber.toUpperCase())) {
      newErrors.panNumber = "Please enter a valid PAN number (Format: ABCDE1234F)";
    }

    // PF validation
    if (form.pfNumber && !/^[A-Z]{2}[A-Z]{3}\d{7}$/.test(form.pfNumber.toUpperCase())) {
      newErrors.pfNumber = "Please enter a valid PF number (Format: XXYYY1234567)";
    }

    // UAN validation
    if (form.uanNumber && !/^\d{12}$/.test(form.uanNumber)) {
      newErrors.uanNumber = "UAN number must be exactly 12 digits";
    }

    // Bank account validation
    if (form.bankAccountNumber && !/^\d{9,18}$/.test(form.bankAccountNumber)) {
      newErrors.bankAccountNumber = "Bank account number must be 9-18 digits";
    }

    // Vendor code validation
    if (form.vendorCode && !/^[A-Z0-9]{4,10}$/.test(form.vendorCode.toUpperCase())) {
      newErrors.vendorCode = "Vendor code must be 4-10 alphanumeric characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    // Validate field on change if it's been touched before
    if (touched[name]) {
      validateField(name, value);
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allTouched = {};
    Object.keys(form).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    // Validate form
    if (!validateForm()) {
      alert("Please fix the validation errors before submitting.");
      return;
    }

    try {
      if (existingData) {
        // ✅ Update employee
        await API.put(`/${existingData.id}`, form);
        alert("Employee updated successfully!");
      } else {
        // ✅ Create employee
        await API.post("/create-manual", form);
        alert("Employee added successfully!");
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("❌ Error saving employee:", err);

      if (err.response) {
        alert("Failed: " + (err.response.data?.message || err.response.statusText));
      } else if (err.request) {
        alert("Network error: Backend not reachable or CORS issue.");
      } else {
        alert("Error: " + err.message);
      }
    }
  };

  // ✅ Helper function to format salary display
  const formatSalary = (value) => {
    if (!value) return "";
    const num = parseFloat(value);
    return isNaN(num) ? value : num.toLocaleString('en-IN');
  };

  const handleSalaryChange = (e) => {
    const value = e.target.value.replace(/,/g, '');
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setForm({ ...form, annualSalary: value });
      
      if (touched.annualSalary) {
        validateField('annualSalary', value);
      }
    }
  };

  // ✅ Helper function to format phone number
  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setForm({ ...form, phoneNumber: value });
    
    if (touched.phoneNumber) {
      validateField('phoneNumber', value);
    }
  };

  // ✅ Helper function to format PAN (uppercase)
  const handlePanChange = (e) => {
    const value = e.target.value.toUpperCase();
    setForm({ ...form, panNumber: value });
    
    if (touched.panNumber) {
      validateField('panNumber', value);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="row g-3">
        {/* --- Basic Details --- */}
        <div className="col-md-6">
          <label className="form-label">Full Name *</label>
          <input
            type="text"
            name="name"
            className={`form-control ${errors.name ? 'is-invalid' : ''}`}
            value={form.name}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            placeholder="Enter full name"
          />
          {errors.name && <div className="invalid-feedback">{errors.name}</div>}
        </div>

        <div className="col-md-6">
          <label className="form-label">Email *</label>
          <input
            type="email"
            name="email"
            className={`form-control ${errors.email ? 'is-invalid' : ''}`}
            value={form.email}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            disabled={!!existingData}
            placeholder="employee@company.com"
          />
          {errors.email && <div className="invalid-feedback">{errors.email}</div>}
        </div>

        <div className="col-md-6">
          <label className="form-label">Phone Number</label>
          <input
            type="text"
            name="phoneNumber"
            className={`form-control ${errors.phoneNumber ? 'is-invalid' : ''}`}
            value={form.phoneNumber}
            onChange={handlePhoneChange}
            onBlur={handleBlur}
            placeholder="10-digit mobile number"
            maxLength="10"
          />
          {errors.phoneNumber && <div className="invalid-feedback">{errors.phoneNumber}</div>}
        </div>

        <div className="col-md-6">
          <label className="form-label">Address</label>
          <input
            type="text"
            name="address"
            className="form-control"
            value={form.address}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Full address"
          />
        </div>

        {/* --- Job Details --- */}
        <div className="col-md-6">
          <label className="form-label">Designation *</label>
          <input
            type="text"
            name="designation"
            className={`form-control ${errors.designation ? 'is-invalid' : ''}`}
            value={form.designation}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            placeholder="e.g., Software Engineer"
          />
          {errors.designation && <div className="invalid-feedback">{errors.designation}</div>}
        </div>

        <div className="col-md-6">
          <label className="form-label">Department *</label>
          <select
            name="department"
            className={`form-select ${errors.department ? 'is-invalid' : ''}`}
            value={form.department}
            onChange={handleChange}
            onBlur={handleBlur}
            required
          >
            <option value="">Select Department</option>
            {departments.map((dept, i) => (
              <option key={i} value={dept}>
                {dept}
              </option>
            ))}
          </select>
          {errors.department && <div className="invalid-feedback">{errors.department}</div>}
        </div>

        <div className="col-md-6">
          <label className="form-label">Role *</label>
          <select
            name="role"
            className={`form-select ${errors.role ? 'is-invalid' : ''}`}
            value={form.role}
            onChange={handleChange}
            onBlur={handleBlur}
            required
          >
            <option value="">Select Role</option>
            {roles.map((r, i) => (
              <option key={i} value={r}>
                {r}
              </option>
            ))}
          </select>
          {errors.role && <div className="invalid-feedback">{errors.role}</div>}
        </div>

        <div className="col-md-6">
          <label className="form-label">Annual Salary *</label>
          <div className="input-group">
            <span className="input-group-text">₹</span>
            <input
              type="text"
              name="annualSalary"
              className={`form-control ${errors.annualSalary ? 'is-invalid' : ''}`}
              value={formatSalary(form.annualSalary)}
              onChange={handleSalaryChange}
              onBlur={handleBlur}
              required
              placeholder="0.00"
            />
          </div>
          {errors.annualSalary && <div className="invalid-feedback d-block">{errors.annualSalary}</div>}
        </div>

        {/* --- Bank and Tax Details --- */}
        <div className="col-md-6">
          <label className="form-label">PAN Number</label>
          <input
            type="text"
            name="panNumber"
            className={`form-control ${errors.panNumber ? 'is-invalid' : ''}`}
            value={form.panNumber}
            onChange={handlePanChange}
            onBlur={handleBlur}
            placeholder="ABCDE1234F"
            maxLength="10"
          />
          {errors.panNumber && <div className="invalid-feedback">{errors.panNumber}</div>}
        </div>

        <div className="col-md-6">
          <label className="form-label">PF Number</label>
          <input
            type="text"
            name="pfNumber"
            className={`form-control ${errors.pfNumber ? 'is-invalid' : ''}`}
            value={form.pfNumber}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="XXYYY1234567"
            maxLength="12"
          />
          {errors.pfNumber && <div className="invalid-feedback">{errors.pfNumber}</div>}
        </div>

        <div className="col-md-6">
          <label className="form-label">UAN Number</label>
          <input
            type="text"
            name="uanNumber"
            className={`form-control ${errors.uanNumber ? 'is-invalid' : ''}`}
            value={form.uanNumber}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="12-digit UAN number"
            maxLength="12"
          />
          {errors.uanNumber && <div className="invalid-feedback">{errors.uanNumber}</div>}
        </div>

        <div className="col-md-6">
          <label className="form-label">Bank Name</label>
          <input
            type="text"
            name="bankName"
            className="form-control"
            value={form.bankName}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Bank name"
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Bank Branch</label>
          <input
            type="text"
            name="bankBranch"
            className="form-control"
            value={form.bankBranch}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Branch name and city"
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Bank Account Number</label>
          <input
            type="text"
            name="bankAccountNumber"
            className={`form-control ${errors.bankAccountNumber ? 'is-invalid' : ''}`}
            value={form.bankAccountNumber}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="9-18 digit account number"
            maxLength="18"
          />
          {errors.bankAccountNumber && <div className="invalid-feedback">{errors.bankAccountNumber}</div>}
        </div>

        <div className="col-md-6">
          <label className="form-label">Vendor Code</label>
          <input
            type="text"
            name="vendorCode"
            className={`form-control ${errors.vendorCode ? 'is-invalid' : ''}`}
            value={form.vendorCode}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="4-10 character code"
            maxLength="10"
          />
          {errors.vendorCode && <div className="invalid-feedback">{errors.vendorCode}</div>}
        </div>

        {/* --- Status and Date --- */}
        <div className="col-md-6">
          <label className="form-label">Status</label>
          <select
            name="status"
            className="form-select"
            value={form.status}
            onChange={handleChange}
            onBlur={handleBlur}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div className="col-md-6">
          <label className="form-label">Date of Joining *</label>
          <input
            type="date"
            name="dateOfJoining"
            className={`form-control ${errors.dateOfJoining ? 'is-invalid' : ''}`}
            value={form.dateOfJoining}
            onChange={handleChange}
            onBlur={handleBlur}
            required
          />
          {errors.dateOfJoining && <div className="invalid-feedback">{errors.dateOfJoining}</div>}
        </div>
      </div>

      {/* Validation Summary */}
      {Object.keys(errors).length > 0 && (
        <div className="alert alert-warning mt-3">
          <strong>Please fix the following errors:</strong>
          <ul className="mb-0 mt-1">
            {Object.values(errors).map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* --- Buttons --- */}
      <div className="d-flex justify-content-end mt-4">
        <button
          type="button"
          className="btn btn-secondary me-2"
          onClick={onSuccess}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={Object.keys(errors).length > 0}
        >
          {existingData ? "Update Employee" : "Add Employee"}
        </button>
      </div>
    </form>
  );
}