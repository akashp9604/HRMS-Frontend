import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import axiosInstance from '../apis/axiosConfig'; // ✅ Add JWT import

const EmployeeReportTab = () => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    month: '',
    year: ''
  });
  const [payslipData, setPayslipData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Get current date for default values
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // ✅ Get employee info from AuthContext instead of localStorage
  const employeeId = user?.id || user?.employeeId;
  const employeeName = user?.name || user?.employeeName;

  // Set default values on component mount
  useEffect(() => {
    setFormData({
      month: currentMonth.toString(),
      year: currentYear.toString()
    });
  }, []);

  // Months for dropdown
  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  // Years for dropdown (last 2 years and next 1 year)
  const years = Array.from({ length: 4 }, (_, i) => currentYear - 2 + i);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // ✅ UPDATED: Generate payslip with JWT
  const generatePayslip = async () => {
    if (!formData.month || !formData.year) {
      setError('Please select month and year');
      return;
    }

    if (!employeeId) {
      setError("Employee info not found. Please log in again.");
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Generating payslip for:', {
        employeeId: employeeId,
        month: formData.month,
        year: formData.year
      });

      // ✅ Use axiosInstance with JWT
      const response = await axiosInstance.post(
        `http://localhost:8092/api/payroll/generate?employeeId=${employeeId}&month=${formData.month}&year=${formData.year}`
      );

      setPayslipData(response.data);
      setSuccess('Payslip generated successfully!');
      console.log("Payslip data:", response.data);
    } catch (error) {
      console.error("Error generating payslip:", error);
      if (error.response?.status === 401) {
        setError("Session expired. Please login again.");
      } else {
        setError(`Failed to generate payslip: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ UPDATED: Download payslip with JWT
  const downloadPayslip = async () => {
    if (!formData.month || !formData.year) {
      setError('Please select month and year first');
      return;
    }

    if (!employeeId) {
      setError('Employee info not found. Please login again.');
      return;
    }

    try {
      console.log('Downloading payslip for:', {
        employeeId: employeeId,
        month: formData.month,
        year: formData.year,
      });

      // ✅ Use axiosInstance with JWT
      const response = await axiosInstance.get(
        `http://localhost:8092/api/payroll/download-payslip/by-month?employeeId=${employeeId}&month=${formData.month}&year=${formData.year}`,
        {
          responseType: 'blob'
        }
      );

      const blob = response.data;
      
      if (blob.type !== 'application/pdf') {
        // Check if response is actually an error message
        const text = await blob.text();
        try {
          const errorData = JSON.parse(text);
          throw new Error(errorData.message || 'Failed to download payslip');
        } catch {
          throw new Error('Downloaded file is not a PDF. Please generate payslip first.');
        }
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `payslip-${employeeId}-${formData.month}-${formData.year}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess('Payslip downloaded successfully!');
    } catch (err) {
      console.error('Error downloading payslip:', err);
      setError(err.message || 'Error downloading payslip. Please try again.');
    }
  };

  // ✅ UPDATED: Generate offer letter with JWT
  const generateOfferLetter = async () => {
    if (!employeeId) {
      setError('Employee info not found. Please login again.');
      return;
    }

    try {
      console.log('Generating offer letter for:', employeeId);

      // ✅ Use axiosInstance with JWT
      const response = await axiosInstance.get(
        `http://localhost:8092/api/payroll/offer-letter/generate?employeeId=${employeeId}`,
        {
          responseType: 'blob'
        }
      );

      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `offer-letter-${employeeId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setSuccess('Offer letter downloaded successfully!');
    } catch (err) {
      console.error('Error generating offer letter:', err);
      if (err.response?.status === 401) {
        setError("Session expired. Please login again.");
      } else {
        setError(err.message || 'Error generating offer letter. Please try again.');
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getMonthName = (monthValue) => {
    const month = months.find(m => m.value === monthValue);
    return month ? month.label : '';
  };

  return (
    <div className="container-fluid">
      {/* Header Section */}
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="text-primary fw-bold mb-3">
            📊 My Reports & Payslips
          </h2>
          
          {/* Welcome Card */}
          <div className="card bg-primary text-white mb-3">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-auto">
                  <i className="fas fa-user-circle fa-2x"></i>
                </div>
                <div className="col">
                  <h5 className="card-title mb-1">Welcome, {user?.name || employeeName || 'Employee'}!</h5>
                  <p className="card-text mb-0">
                    Employee ID: {user?.id || user?.employeeId || employeeId} | Role: {user?.role}
                  </p>
                </div>
                <div className="col-auto">
                  <span className="badge bg-light text-primary fs-6">Employee Portal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payslip Generation Section */}
      <div className="card shadow mb-4">
        <div className="card-body">
          <h4 className="card-title text-primary mb-4">
            📅 Generate Payslip
          </h4>
          
          <div className="row g-3 align-items-end">
            <div className="col-md-4">
              <label className="form-label">Select Month</label>
              <select 
                className="form-select"
                name="month"
                value={formData.month}
                onChange={handleInputChange}
                required
              >
                <option value="">Choose month...</option>
                {months.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Select Year</label>
              <select 
                className="form-select"
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                required
              >
                <option value="">Choose year...</option>
                {years.map((year) => (
                  <option key={year} value={year.toString()}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <button
                className="btn btn-primary w-100"
                onClick={generatePayslip}
                disabled={loading || !formData.month || !formData.year}
                style={{ height: '56px' }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Generating...
                  </>
                ) : (
                  <>
                    📋 Generate Payslip
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="row g-3 mt-3">
            <div className="col-md-6">
              <button
                className="btn btn-outline-primary w-100"
                onClick={downloadPayslip}
                disabled={!formData.month || !formData.year}
                style={{ height: '50px' }}
              >
                ⬇️ Download Payslip PDF
              </button>
            </div>
            <div className="col-md-6">
              <button
                className="btn btn-outline-success w-100"
                onClick={generateOfferLetter}
                style={{ height: '50px' }}
              >
                📄 Download Offer Letter
              </button>
            </div>
          </div>

          {/* Current Selection Info */}
          <div className="mt-3 p-2 bg-light rounded">
            <small className="text-muted">
              <strong>Current Selection:</strong> Employee ID: {employeeId} | Month: {getMonthName(formData.month)} | Year: {formData.year}
            </small>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <strong>Error:</strong> {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}
      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {success}
          <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
        </div>
      )}

      {/* Payslip Display - Shows real API data */}
      {payslipData && (
        <div>
          <h4 className="text-primary mb-4">
            Payslip for {getMonthName(formData.month)} {formData.year}
          </h4>
          
          <div className="row g-4">
            {/* Salary Structure */}
            <div className="col-md-6">
              <div className="card shadow">
                <div className="card-header bg-primary text-white">
                  <h5 className="card-title mb-0">Salary Breakdown</h5>
                </div>
                <div className="card-body p-0">
                  <table className="table table-striped mb-0">
                    <tbody>
                      <tr>
                        <td><strong>Basic Salary</strong></td>
                        <td className="text-end">{formatCurrency(payslipData.basicSalary)}</td>
                      </tr>
                      <tr>
                        <td><strong>House Rent Allowance</strong></td>
                        <td className="text-end">{formatCurrency(payslipData.houseRentAllowance)}</td>
                      </tr>
                      <tr>
                        <td><strong>Special Allowance</strong></td>
                        <td className="text-end">{formatCurrency(payslipData.specialAllowance)}</td>
                      </tr>
                      <tr>
                        <td><strong>Performance Bonus</strong></td>
                        <td className="text-end">{formatCurrency(payslipData.performanceBonus)}</td>
                      </tr>
                      <tr>
                        <td><strong>Children Education</strong></td>
                        <td className="text-end">{formatCurrency(payslipData.childrenEducation)}</td>
                      </tr>
                      <tr className="table-success">
                        <td><strong>Total Earnings</strong></td>
                        <td className="text-end"><strong>{formatCurrency(payslipData.totalEarnings)}</strong></td>
                      </tr>
                      <tr>
                        <td><strong>Total Deductions</strong></td>
                        <td className="text-end">{formatCurrency(payslipData.totalDeductions)}</td>
                      </tr>
                      <tr className="table-primary text-white">
                        <td><strong>Net Salary</strong></td>
                        <td className="text-end"><strong>{formatCurrency(payslipData.employeeNetPay)}</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Employee Details and Attendance */}
            <div className="col-md-6">
              <div className="card shadow">
                <div className="card-header bg-primary text-white">
                  <h5 className="card-title mb-0">Employee Information</h5>
                </div>
                <div className="card-body p-0">
                  <table className="table table-striped mb-0">
                    <tbody>
                      <tr>
                        <td><strong>Employee Name</strong></td>
                        <td className="text-end">{payslipData.employeeName}</td>
                      </tr>
                      <tr>
                        <td><strong>Department</strong></td>
                        <td className="text-end">{payslipData.department}</td>
                      </tr>
                      <tr>
                        <td><strong>Designation</strong></td>
                        <td className="text-end">{payslipData.designation}</td>
                      </tr>
                      <tr>
                        <td><strong>Grade</strong></td>
                        <td className="text-end">{payslipData.grade}</td>
                      </tr>
                      <tr>
                        <td><strong>Date of Joining</strong></td>
                        <td className="text-end">{payslipData.dateOfJoining}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card shadow mt-4">
                <div className="card-header bg-info text-white">
                  <h5 className="card-title mb-0">Attendance Summary</h5>
                </div>
                <div className="card-body p-0">
                  <table className="table table-striped mb-0">
                    <tbody>
                      <tr>
                        <td><strong>Present Days</strong></td>
                        <td className="text-end">{payslipData.presentDays}</td>
                      </tr>
                      <tr>
                        <td><strong>Paid Leave</strong></td>
                        <td className="text-end">{payslipData.paidLeave}</td>
                      </tr>
                      <tr>
                        <td><strong>Holidays</strong></td>
                        <td className="text-end">{payslipData.holiday}</td>
                      </tr>
                      <tr>
                        <td><strong>Week Off</strong></td>
                        <td className="text-end">{payslipData.weekOff}</td>
                      </tr>
                      <tr className="table-info">
                        <td><strong>Total Salary Days</strong></td>
                        <td className="text-end"><strong>{payslipData.totalSalaryDays}</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Bank & Statutory Details */}
            <div className="col-12">
              <div className="card shadow">
                <div className="card-header bg-primary text-white">
                  <h5 className="card-title mb-0">Bank & Statutory Details</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <h6 className="text-muted mb-3">Bank Information</h6>
                      <table className="table table-sm">
                        <tbody>
                          <tr>
                            <td><strong>Bank Name</strong></td>
                            <td className="text-end">{payslipData.bankName}</td>
                          </tr>
                          <tr>
                            <td><strong>Bank Branch</strong></td>
                            <td className="text-end">{payslipData.bankBranch}</td>
                          </tr>
                          <tr>
                            <td><strong>Account Number</strong></td>
                            <td className="text-end">{payslipData.bankAccountNo}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="col-md-6">
                      <h6 className="text-muted mb-3">Statutory Information</h6>
                      <table className="table table-sm">
                        <tbody>
                          <tr>
                            <td><strong>PF Number</strong></td>
                            <td className="text-end">{payslipData.pfNo}</td>
                          </tr>
                          <tr>
                            <td><strong>UAN Number</strong></td>
                            <td className="text-end">{payslipData.uanNo}</td>
                          </tr>
                          <tr>
                            <td><strong>PAN Number</strong></td>
                            <td className="text-end">{payslipData.panNo}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Data Message */}
      {!payslipData && !loading && (
        <div className="card text-center bg-light">
          <div className="card-body py-5">
            <div className="mb-3" style={{ fontSize: '4rem' }}>📊</div>
            <h5 className="text-muted">Select month and year to generate your payslip</h5>
            <p className="text-muted">
              Your salary structure and attendance details will be displayed here after generation
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeReportTab;