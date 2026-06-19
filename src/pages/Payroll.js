import React, { useState, useEffect } from "react";
import StatCard from "../components/StatCard";
import axiosInstance from "../apis/axiosConfig"; // ✅ CHANGED: JWT import

export default function Payroll() {
  // Real data states
  const [realPayslips, setRealPayslips] = useState([]);
  const [annualStructures, setAnnualStructures] = useState([]);

  const [activeTab, setActiveTab] = useState("Payslips");
  const [filterStatus, setFilterStatus] = useState("All Status");

  // Modal states
  const [showAnnualModal, setShowAnnualModal] = useState(false);
  const [showPayslipModal, setShowPayslipModal] = useState(false);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [employeeData, setEmployeeData] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(null);
  const [offerLetterLoading, setOfferLetterLoading] = useState({
    type: null, // 'download' or 'send'
    employeeId: null
  });

  // Pagination states
  const [currentPagePayslips, setCurrentPagePayslips] = useState(1);
  const [currentPageStructures, setCurrentPageStructures] = useState(1);
  const [itemsPerPagePayslips, setItemsPerPagePayslips] = useState(5);
  const [itemsPerPageStructures, setItemsPerPageStructures] = useState(5);

  // Form states
  const [annualFormData, setAnnualFormData] = useState({
    employeeId: "",
    employeeName: "",
    designation: "",
    annualSalary: "",
    annualBasic: "",
    annualHra: "",
    annualAllowances: "",
    annualGross: "",
    annualNet: "",
    monthlyBasic: "",
    monthlyHra: "",
    monthlyAllowances: "",
    monthlyGross: "",
    monthlyNet: "",
    financialYear: ""
  });

  const [payslipFormData, setPayslipFormData] = useState({
    employeeId: "",
    month: "",
    year: ""
  });

  // ❌ REMOVED: getAuthHeader function - No longer needed

  // ==================== PAGINATION CALCULATIONS ====================
  // Payslips pagination
  const indexOfLastPayslip = currentPagePayslips * itemsPerPagePayslips;
  const indexOfFirstPayslip = indexOfLastPayslip - itemsPerPagePayslips;
  const currentPayslips = realPayslips.slice(indexOfFirstPayslip, indexOfLastPayslip);
  const totalPagesPayslips = Math.ceil(realPayslips.length / itemsPerPagePayslips);

  // Salary Structures pagination
  const indexOfLastStructure = currentPageStructures * itemsPerPageStructures;
  const indexOfFirstStructure = indexOfLastStructure - itemsPerPageStructures;
  const currentStructures = annualStructures.slice(indexOfFirstStructure, indexOfLastStructure);
  const totalPagesStructures = Math.ceil(annualStructures.length / itemsPerPageStructures);

  // Pagination handlers
  const handlePayslipPageChange = (pageNumber) => {
    setCurrentPagePayslips(pageNumber);
  };

  const handleStructurePageChange = (pageNumber) => {
    setCurrentPageStructures(pageNumber);
  };

  // Handle records per page change
  const handlePayslipPerPageChange = (value) => {
    setItemsPerPagePayslips(parseInt(value));
    setCurrentPagePayslips(1);
  };

  const handleStructurePerPageChange = (value) => {
    setItemsPerPageStructures(parseInt(value));
    setCurrentPageStructures(1);
  };

  // Generate pagination items
  const renderPaginationItems = (totalPages, currentPage, handlePageChange) => {
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
        <li key={1} className="page-item">
          <button className="page-link" onClick={() => handlePageChange(1)}>
            1
          </button>
        </li>
      );
      if (startPage > 2) {
        items.push(
          <li key="start-ellipsis" className="page-item disabled">
            <span className="page-link">...</span>
          </li>
        );
      }
    }

    // Page numbers
    for (let page = startPage; page <= endPage; page++) {
      items.push(
        <li key={page} className={`page-item ${currentPage === page ? "active" : ""}`}>
          <button className="page-link" onClick={() => handlePageChange(page)}>
            {page}
          </button>
        </li>
      );
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(
          <li key="end-ellipsis" className="page-item disabled">
            <span className="page-link">...</span>
          </li>
        );
      }
      items.push(
        <li key={totalPages} className="page-item">
          <button className="page-link" onClick={() => handlePageChange(totalPages)}>
            {totalPages}
          </button>
        </li>
      );
    }

    return items;
  };

  // ==================== ENHANCED OFFER LETTER DOWNLOAD ====================
  const downloadOfferLetter = async (employeeId, employeeName = "") => {
    if (!employeeId) {
      alert("❌ Employee ID is required to download offer letter");
      return;
    }

    console.log("🔍 Downloading offer letter for employee:", employeeId);
    setOfferLetterLoading({ type: 'download', employeeId: employeeId });
    
    try {
      // ✅ CHANGED: Use axiosInstance with JWT
      const statusResponse = await axiosInstance.get(`http://localhost:8092/api/payroll/offer-letter/status/${employeeId}`);

      if (statusResponse.data && !statusResponse.data.accepted) {
        alert("❌ Offer must be accepted before downloading.\n\nPlease send the offer letter to the employee first and wait for them to accept it.");
        return false;
      }

      // ✅ CHANGED: Use axiosInstance with blob response
      const response = await axiosInstance.get(
        `http://localhost:8092/api/payroll/offer-letter/download`,
        {
          params: { employeeId: employeeId },
          responseType: 'blob'
        }
      );

      const blob = response.data;
      
      if (blob.size === 0) {
        throw new Error('Offer letter PDF is empty (0 bytes)');
      }
      
      if (!blob.type.includes('pdf')) {
        const text = await blob.text();
        throw new Error('Server returned non-PDF response');
      }
      
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      
      const filename = employeeName 
        ? `offer_letter_${employeeName.replace(/\s+/g, '_')}.pdf`
        : `offer_letter_${employeeId}.pdf`;
      
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(objectUrl);
      }, 100);
      
      alert("✅ Offer letter downloaded successfully!");
      return true;
    } catch (error) {
      console.error("❌ Error downloading offer letter:", error);
      
      if (error.response?.status === 403) {
        alert("❌ Offer not accepted yet. Employee must accept the offer first.");
      } else if (error.response?.status === 401) {
        alert("❌ Session expired. Please login again.");
      } else if (error.response?.status === 404) {
        alert("❌ Employee not found or offer letter data unavailable");
      } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        alert("❌ Network error: Cannot connect to server. Please check:\n• Server is running on localhost:8092\n• CORS is enabled\n• Network connectivity");
      } else {
        alert("❌ Error downloading offer letter: " + error.message);
      }
      return false;
    } finally {
      setOfferLetterLoading({ type: null, employeeId: null });
    }
  };

  // ==================== ENHANCED SEND OFFER LETTER VIA EMAIL ====================
  const sendOfferLetter = async (employeeId, employeeName = "") => {
    if (!employeeId) {
      alert("❌ Employee ID is required to send offer letter");
      return;
    }

    // ✅ STEP 1: Get employee email first
    let employeeEmail = "";
    
    try {
      // ✅ CHANGED: Use axiosInstance with JWT
      const employeeResponse = await axiosInstance.get(`http://localhost:8088/api/employees/${employeeId}`);

      if (employeeResponse.data) {
        employeeEmail = employeeResponse.data.email || "";
        console.log("✅ Found employee email:", employeeEmail);
      }
    } catch (error) {
      console.log("⚠️ Could not fetch employee email:", error);
    }

    // ✅ STEP 2: If no email found, prompt user
    if (!employeeEmail) {
      employeeEmail = prompt(`Enter email address for ${employeeName || employeeId}:`);
      if (!employeeEmail) {
        alert("❌ Email is required to send offer letter");
        return;
      }
    }

    // ✅ STEP 3: Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(employeeEmail)) {
      alert("❌ Please enter a valid email address");
      return;
    }

    console.log("📧 Sending offer letter to:", employeeEmail, "for employee:", employeeId);
    setOfferLetterLoading({ type: 'send', employeeId: employeeId });
    
    try {
      // ✅ CHANGED: Use axiosInstance with JWT
      const response = await axiosInstance.post(
        `http://localhost:8092/api/payroll/offer-letter/send`,
        {
          employeeId: employeeId,
          employeeEmail: employeeEmail,
          employeeName: employeeName
        }
      );

      if (response.data && response.data.success) {
        alert(`✅ Offer letter sent successfully to ${employeeEmail}!\n\n📧 The email includes:\n• ✅ Accept Offer Online (Required first step)\n• 📥 After acceptance: Direct download link will be sent\n\n🔗 Employee must accept offer first to download the PDF`);
        return true;
      } else {
        alert("⚠️ Offer sending completed but with issues: " + (response.data?.message || "Unknown issue"));
        return false;
      }
    } catch (error) {
      console.error("❌ Error sending offer letter:", error);
      
      if (error.response?.status === 401) {
        alert("❌ Session expired. Please login again.");
      } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        alert("❌ Network error: Cannot connect to server. Please check if server is running on localhost:8092");
      } else {
        alert("❌ Error sending offer letter: " + error.message);
      }
      return false;
    } finally {
      setOfferLetterLoading({ type: null, employeeId: null });
    }
  };

  // ==================== CREATE ANNUAL STRUCTURE FUNCTION ====================
  const createAnnualStructure = async (e) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const employeeId = annualFormData.employeeId.trim();
      if (!employeeId) {
        alert("❌ Please enter a valid Employee ID");
        return;
      }

      console.log("🔍 Creating annual structure for employee:", employeeId);
      
      // ✅ CHANGED: Use axiosInstance with JWT
      const response = await axiosInstance.post(
        `http://localhost:8092/api/payroll/annual-structure`,
        null,
        {
          params: { employeeId: employeeId }
        }
      );

      console.log("✅ Annual structure created:", response.data);
      alert("✅ Annual salary structure created successfully!");
      setShowAnnualModal(false);
      resetAnnualForm();
      fetchAnnualStructures();
    } catch (error) {
      console.error("🚨 Error creating annual structure:", error);
      
      if (error.response?.status === 401) {
        alert("❌ Session expired. Please login again.");
      } else if (error.response?.status === 404) {
        alert("❌ Employee not found. Please check the Employee ID.");
      } else if (error.response?.status === 400) {
        alert(`❌ Bad request: ${error.response?.data?.message || error.message}`);
      } else if (error.response?.status === 500) {
        alert("❌ Server error. Please check if all services are running.");
      } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        alert("❌ Network error. Please check if payroll service is running on port 8092.");
      } else {
        alert(`❌ Error: ${error.message}`);
      }
    } finally {
      setActionLoading(false);
    }
  };

  // ==================== EMPLOYEE DATA FETCHING ====================
  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!annualFormData.employeeId.trim()) {
        setEmployeeData(null);
        return;
      }

      setLoading(true);
      try {
        const employeeId = annualFormData.employeeId.trim();
        
        // ✅ CHANGED: Use axiosInstance with JWT
        const response = await axiosInstance.get(`http://localhost:8088/api/employees/${employeeId}/package`);

        const employee = response.data;
        console.log("✅ Employee data received:", employee);
        setEmployeeData(employee);
        
        const annualSalary = employee.annualSalary || 0;
        
        if (annualSalary <= 0) {
          alert("⚠️ Employee has no annual salary set. Please update employee data.");
          return;
        }

        // Calculate salary components
        const monthlyCtc = annualSalary / 12;
        const monthlyBasic = monthlyCtc * 0.40;
        const monthlyHra = monthlyBasic * 0.40;
        const pending = monthlyCtc - (monthlyBasic + monthlyHra);
        const employerPf = monthlyBasic * 0.12;
        const gratuity = monthlyBasic * 0.0486;
        const monthlySpecialComponent = pending - employerPf - gratuity;
        const monthlyGross = monthlyBasic + monthlyHra + monthlySpecialComponent;
        const employeePf = monthlyBasic * 0.12;
        const professionalTax = 200.0;
        const monthlyDeductions = employeePf + professionalTax;
        const monthlyNet = monthlyGross - monthlyDeductions;
        
        // Convert to annual
        const annualBasic = monthlyBasic * 12;
        const annualHra = monthlyHra * 12;
        const annualAllowances = monthlySpecialComponent * 12;
        const annualGross = monthlyGross * 12;
        const annualNet = monthlyNet * 12;

        // Auto-fill form
        setAnnualFormData(prev => ({
          ...prev,
          employeeName: employee.name || "",
          designation: employee.designation || "",
          annualSalary: annualSalary.toString(),
          annualBasic: Math.round(annualBasic).toString(),
          annualHra: Math.round(annualHra).toString(),
          annualAllowances: Math.round(annualAllowances).toString(),
          annualGross: Math.round(annualGross).toString(),
          annualNet: Math.round(annualNet).toString(),
          monthlyBasic: Math.round(monthlyBasic).toString(),
          monthlyHra: Math.round(monthlyHra).toString(),
          monthlyAllowances: Math.round(monthlySpecialComponent).toString(),
          monthlyGross: Math.round(monthlyGross).toString(),
          monthlyNet: Math.round(monthlyNet).toString()
        }));

      } catch (error) {
        console.error("❌ Error fetching employee:", error);
        setEmployeeData(null);
        
        if (error.response?.status === 401) {
          alert("❌ Session expired. Please login again.");
        } else if (error.response?.status === 404) {
          alert(`❌ Employee not found with ID: ${annualFormData.employeeId}`);
        } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
          alert("❌ Cannot connect to employee service. Make sure it's running on port 8088.");
        } else {
          alert(`❌ Error fetching employee: ${error.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchEmployeeData();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [annualFormData.employeeId]);

  // ==================== SET CURRENT FINANCIAL YEAR ====================
  useEffect(() => {
    if (showAnnualModal) {
      const currentYear = getCurrentFinancialYear();
      setAnnualFormData(prev => ({
        ...prev,
        financialYear: currentYear
      }));
    }
  }, [showAnnualModal]);

  // ==================== SET CURRENT MONTH ====================
  useEffect(() => {
    if (showPayslipModal) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      setPayslipFormData(prev => ({
        ...prev,
        month: month,
        year: year.toString()
      }));
    }
  }, [showPayslipModal]);

  // ==================== LOAD DATA WHEN TAB CHANGES ====================
  useEffect(() => {
    if (activeTab === "Salary Structures") {
      fetchAnnualStructures();
    } else if (activeTab === "Payslips") {
      fetchRealPayslips();
    }
  }, [activeTab]);

  // ==================== HELPER FUNCTIONS ====================
  const getCurrentFinancialYear = () => {
    const today = new Date();
    const year = today.getFullYear();
    if (today.getMonth() >= 3) {
      return `${year}-${year + 1}`;
    } else {
      return `${year - 1}-${year}`;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // ==================== API FUNCTIONS ====================
  const fetchAnnualStructures = async () => {
    try {
      console.log("🔍 Fetching annual structures...");
      // ✅ CHANGED: Use axiosInstance with JWT
      const response = await axiosInstance.get("http://localhost:8092/api/payroll/annual-structures");
      console.log("✅ Annual structures fetched:", response.data.length);
      setAnnualStructures(response.data);
      setCurrentPageStructures(1);
    } catch (error) {
      console.error("🚨 Error fetching annual structures:", error);
      if (error.response?.status === 401) {
        alert("❌ Session expired. Please login again.");
      } else {
        alert("❌ Error fetching annual structures. Check if payroll service is running.");
      }
    }
  };

  const fetchRealPayslips = async () => {
    try {
      console.log("🔍 Fetching payslips...");
      // ✅ CHANGED: Use axiosInstance with JWT
      const response = await axiosInstance.get("http://localhost:8092/api/payroll/all");
      console.log("✅ Payslips fetched:", response.data.length);
      setRealPayslips(response.data);
      setCurrentPagePayslips(1);
    } catch (error) {
      console.error("🚨 Error fetching payslips:", error);
      if (error.response?.status === 401) {
        alert("❌ Session expired. Please login again.");
      } else {
        alert("❌ Error fetching payslips. Check if payroll service is running.");
      }
    }
  };

  const generatePayslip = async (e) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      console.log("🔍 Generating payslip...");
      // ✅ CHANGED: Use axiosInstance with JWT
      const response = await axiosInstance.post(
        `http://localhost:8092/api/payroll/generate`,
        null,
        {
          params: {
            employeeId: payslipFormData.employeeId,
            month: payslipFormData.month,
            year: payslipFormData.year
          }
        }
      );

      console.log("✅ Payslip generated:", response.data);
      alert("✅ Payslip generated successfully!");
      setShowPayslipModal(false);
      resetPayslipForm();
      fetchRealPayslips();
    } catch (error) {
      console.error("❌ Error generating payslip:", error);
      
      if (error.response?.status === 401) {
        alert("❌ Session expired. Please login again.");
      } else if (error.response?.status === 404) {
        alert("❌ Employee not found or no annual structure exists.");
      } else {
        alert("❌ Error generating payslip: " + error.message);
      }
    } finally {
      setActionLoading(false);
    }
  };

  // ==================== PDF DOWNLOAD FUNCTIONS ====================
  const downloadPayslipById = async (payslipId) => {
    if (!payslipId || payslipId === "undefined" || payslipId === "null") {
      console.error("❌ Invalid payslip ID:", payslipId);
      alert("❌ Cannot download: Invalid payslip ID");
      return false;
    }

    console.log("🔍 Downloading payslip ID:", payslipId);
    setDownloadLoading(payslipId);
    
    try {
      // ✅ CHANGED: Use axiosInstance with JWT and blob response
      const response = await axiosInstance.get(
        `http://localhost:8092/api/payroll/download-payslip/${payslipId}`,
        { responseType: 'blob' }
      );

      const blob = response.data;
      
      if (blob.size === 0) {
        throw new Error('PDF file is empty');
      }
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payslip_${payslipId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      alert("✅ Payslip downloaded successfully!");
      return true;
    } catch (error) {
      console.error("❌ Error downloading payslip:", error);
      
      if (error.response?.status === 401) {
        alert("❌ Session expired. Please login again.");
      } else {
        alert("❌ Error downloading payslip: " + error.message);
      }
      return false;
    } finally {
      setDownloadLoading(null);
    }
  };

  const downloadPayslipByMonth = async (employeeId, month, year, employeeName = "") => {
    setDownloadLoading(employeeId);
    try {
      // ✅ CHANGED: Use axiosInstance with JWT and blob response
      const response = await axiosInstance.get(
        `http://localhost:8092/api/payroll/download-payslip/by-month`,
        {
          params: { employeeId, month, year },
          responseType: 'blob'
        }
      );

      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      const filename = employeeName 
        ? `payslip_${employeeName.replace(/\s+/g, '_')}_${month}_${year}.pdf`
        : `payslip_${month}_${year}.pdf`;
      
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      alert("✅ Payslip downloaded successfully!");
      return true;
    } catch (error) {
      console.error("❌ Error downloading payslip:", error);
      
      if (error.response?.status === 401) {
        alert("❌ Session expired. Please login again.");
      } else {
        alert("❌ Error downloading payslip: " + error.message);
      }
      return false;
    } finally {
      setDownloadLoading(null);
    }
  };

  // ==================== FORM HANDLERS ====================
  const handleAnnualFormChange = (e) => {
    const { name, value } = e.target;
    setAnnualFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePayslipFormChange = (e) => {
    const { name, value } = e.target;
    setPayslipFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetAnnualForm = () => {
    setAnnualFormData({
      employeeId: "",
      employeeName: "",
      designation: "",
      annualSalary: "",
      annualBasic: "",
      annualHra: "",
      annualAllowances: "",
      annualGross: "",
      annualNet: "",
      monthlyBasic: "",
      monthlyHra: "",
      monthlyAllowances: "",
      monthlyGross: "",
      monthlyNet: "",
      financialYear: getCurrentFinancialYear()
    });
    setEmployeeData(null);
  };

  const resetPayslipForm = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    setPayslipFormData({
      employeeId: "",
      month: month,
      year: year.toString()
    });
  };

  const handleAnnualModalClose = () => {
    setShowAnnualModal(false);
    resetAnnualForm();
  };

  const handlePayslipModalClose = () => {
    setShowPayslipModal(false);
    resetPayslipForm();
  };

  return (
    <div className="container mt-4">
      {/* Header + Actions */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3>Payroll Management</h3>
          <p className="text-muted mb-0">Manage annual salary structures and process payroll</p>
        </div>
        <div>
          <button className="btn btn-dark me-2" onClick={() => setShowAnnualModal(true)}>
            📊 Create Annual Structure
          </button>
          <button className="btn btn-outline-dark me-2" onClick={() => setShowPayslipModal(true)}>
            🧾 Generate Payslip
          </button>
          <button className="btn btn-outline-secondary" onClick={() => {
            if (activeTab === "Payslips") fetchRealPayslips();
            else if (activeTab === "Salary Structures") fetchAnnualStructures();
          }}>
            🔄 Refresh Data
          </button>
        </div>
      </div>

      {/* REMOVED: Payroll Stats Cards Section */}

      {/* Bottom Tabs */}
      <ul className="nav nav-tabs mb-3">
        {["Payslips", "Salary Structures"].map(tab => (
          <li key={tab} className="nav-item">
            <button
              className={`nav-link ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          </li>
        ))}
      </ul>

      {/* Payslips Tab Content */}
      {activeTab === "Payslips" && (
        <div className="card p-3 shadow-sm mb-5">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0">Payslip Records</h6>
            <div className="d-flex gap-2 align-items-center">
              <input
                type="text"
                placeholder="Search employees..."
                className="form-control form-control-sm"
                style={{ width: "200px" }}
              />
              <select
                className="form-select form-select-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ width: "150px" }}
              >
                <option value="All Status">All Status</option>
                <option value="Draft">Draft</option>
                <option value="Processed">Processed</option>
                <option value="Paid">Paid</option>
              </select>
              <select
                className="form-select form-select-sm"
                value={itemsPerPagePayslips}
                onChange={(e) => handlePayslipPerPageChange(e.target.value)}
                style={{ width: "120px" }}
              >
                <option value="5">5 per page</option>
                <option value="10">10 per page</option>
                <option value="20">20 per page</option>
                <option value="50">50 per page</option>
              </select>
            </div>
          </div>
          
          {currentPayslips.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted">No payslips found. Generate some payslips to see them here.</p>
              <button 
                className="btn btn-primary"
                onClick={() => setShowPayslipModal(true)}
              >
                🧾 Generate First Payslip
              </button>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Payslip ID</th>
                      <th>Employee</th>
                      <th>Period</th>
                      <th>Gross Salary</th>
                      <th>Deductions</th>
                      <th>Net Salary</th>
                      <th>Status</th>
                      <th>Download</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPayslips
                      .filter(p => filterStatus === "All Status" || p.status === filterStatus)
                      .map((payslip, index) => {
                        const payslipId = payslip.id || payslip.payslipId || (index + 1);
                        
                        return (
                          <tr key={payslipId}>
                            <td>
                              <small className="text-muted">#{payslipId}</small>
                            </td>
                            <td>
                              <strong>{payslip.employeeName || 'Unknown Employee'}</strong>
                              <br />
                              <small className="text-muted">{payslip.designation || 'No designation'}</small>
                            </td>
                            <td>
                              {payslip.month ? 
                                new Date(payslip.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 
                                'Unknown date'
                              }
                            </td>
                            <td>{formatCurrency(payslip.grossSalary || 0)}</td>
                            <td>{formatCurrency(payslip.deductions || 0)}</td>
                            <td><strong>{formatCurrency(payslip.netSalary || 0)}</strong></td>
                            <td>
                              <span className={`badge ${
                                payslip.status === 'Paid' ? 'bg-success' : 
                                payslip.status === 'Processed' ? 'bg-warning' : 'bg-secondary'
                              }`}>
                                {payslip.status || 'Unknown'}
                              </span>
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => downloadPayslipById(payslipId)}
                                disabled={downloadLoading === payslipId}
                                title="Download PDF Payslip"
                              >
                                {downloadLoading === payslipId ? (
                                  <>
                                    <i className="fas fa-spinner fa-spin me-1"></i>
                                    Downloading...
                                  </>
                                ) : (
                                  <>
                                    📥 Download
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {/* Pagination for Payslips */}
              {totalPagesPayslips > 1 && (
                <nav className="mt-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="text-muted small">
                      Showing {currentPayslips.length} of {realPayslips.length} payslips
                    </div>
                    <ul className="pagination justify-content-center mb-0">
                      <li className={`page-item ${currentPagePayslips === 1 && "disabled"}`}>
                        <button 
                          className="page-link" 
                          onClick={() => handlePayslipPageChange(currentPagePayslips - 1)}
                          disabled={currentPagePayslips === 1}
                        >
                          &laquo; Previous
                        </button>
                      </li>

                      {renderPaginationItems(totalPagesPayslips, currentPagePayslips, handlePayslipPageChange)}

                      <li className={`page-item ${currentPagePayslips === totalPagesPayslips && "disabled"}`}>
                        <button 
                          className="page-link" 
                          onClick={() => handlePayslipPageChange(currentPagePayslips + 1)}
                          disabled={currentPagePayslips === totalPagesPayslips}
                        >
                          Next &raquo;
                        </button>
                      </li>
                    </ul>
                    <div className="text-muted small">
                      Page {currentPagePayslips} of {totalPagesPayslips}
                    </div>
                  </div>
                </nav>
              )}
            </>
          )}
        </div>
      )}

      {/* Salary Structures Tab Content */}
      {activeTab === "Salary Structures" && (
        <div className="card p-3 shadow-sm">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0">Annual Salary Structures</h6>
            <div className="d-flex gap-2">
              <select
                className="form-select form-select-sm"
                value={itemsPerPageStructures}
                onChange={(e) => handleStructurePerPageChange(e.target.value)}
                style={{ width: "120px" }}
              >
                <option value="5">5 per page</option>
                <option value="10">10 per page</option>
                <option value="20">20 per page</option>
                <option value="50">50 per page</option>
              </select>
              <button 
                className="btn btn-sm btn-outline-primary"
                onClick={fetchAnnualStructures}
              >
                🔄 Refresh
              </button>
            </div>
          </div>
          
          {currentStructures.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted">No annual salary structures found.</p>
              <button 
                className="btn btn-primary"
                onClick={() => setShowAnnualModal(true)}
              >
                + Create First Structure
              </button>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Designation</th>
                      <th>Annual CTC</th>
                      <th>Annual Net</th>
                      <th>Monthly Gross</th>
                      <th>Monthly Net</th>
                      <th>Financial Year</th>
                      <th>Status</th>
                      <th>Offer Letter</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentStructures.map((structure) => (
                      <tr key={structure.id}>
                        <td>
                          <strong>{structure.employeeName}</strong>
                          <br />
                          <small className="text-muted">{structure.employeeId}</small>
                        </td>
                        <td>{structure.designation}</td>
                        <td>{formatCurrency(structure.annualGross)}</td>
                        <td>{formatCurrency(structure.annualNet)}</td>
                        <td>{formatCurrency(structure.monthlyGross)}</td>
                        <td>{formatCurrency(structure.monthlyNet)}</td>
                        <td>{structure.financialYear}</td>
                        <td>
                          <span className={`badge ${
                            structure.status === 'APPROVED' ? 'bg-success' : 
                            structure.status === 'DRAFT' ? 'bg-warning' : 'bg-info'
                          }`}>
                            {structure.status}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group-vertical" style={{ minWidth: "120px" }}>
                            {/* Download Offer Letter Button */}
                            <button
                              className="btn btn-sm btn-outline-success mb-1"
                              onClick={() => downloadOfferLetter(structure.employeeId, structure.employeeName)}
                              disabled={offerLetterLoading.employeeId === structure.employeeId && offerLetterLoading.type === 'download'}
                              title="Download Offer Letter PDF (After Acceptance)"
                            >
                              {offerLetterLoading.employeeId === structure.employeeId && offerLetterLoading.type === 'download' ? (
                                <>
                                  <i className="fas fa-spinner fa-spin me-1"></i>
                                  Downloading...
                                </>
                              ) : (
                                <>
                                  📄 Download
                                </>
                              )}
                            </button>
                            
                            {/* Send Offer Letter Button */}
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => sendOfferLetter(structure.employeeId, structure.employeeName)}
                              disabled={offerLetterLoading.employeeId === structure.employeeId && offerLetterLoading.type === 'send'}
                              title="Send Offer Letter via Email (Acceptance Required First)"
                            >
                              {offerLetterLoading.employeeId === structure.employeeId && offerLetterLoading.type === 'send' ? (
                                <>
                                  <i className="fas fa-spinner fa-spin me-1"></i>
                                  Sending...
                                </>
                              ) : (
                                <>
                                  ✉️ Send Offer
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                        <td>
                          <div className="btn-group">
                            <button
                              className="btn btn-sm btn-outline-info me-1"
                              onClick={() => {
                                setPayslipFormData(prev => ({
                                  ...prev,
                                  employeeId: structure.employeeId
                                }));
                                setShowPayslipModal(true);
                              }}
                              title="Generate Payslip for this employee"
                            >
                              Generate Payslip
                            </button>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={async () => {
                                const today = new Date();
                                await downloadPayslipByMonth(
                                  structure.employeeId, 
                                  today.getMonth() + 1, 
                                  today.getFullYear(),
                                  structure.employeeName
                                );
                              }}
                              disabled={downloadLoading === structure.employeeId}
                              title="Download Current Month Payslip PDF"
                            >
                              {downloadLoading === structure.employeeId ? (
                                <i className="fas fa-spinner fa-spin"></i>
                              ) : (
                                '📥 Payslip'
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination for Salary Structures */}
              {totalPagesStructures > 1 && (
                <nav className="mt-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="text-muted small">
                      Showing {currentStructures.length} of {annualStructures.length} structures
                    </div>
                    <ul className="pagination justify-content-center mb-0">
                      <li className={`page-item ${currentPageStructures === 1 && "disabled"}`}>
                        <button 
                          className="page-link" 
                          onClick={() => handleStructurePageChange(currentPageStructures - 1)}
                          disabled={currentPageStructures === 1}
                        >
                          &laquo; Previous
                        </button>
                      </li>

                      {renderPaginationItems(totalPagesStructures, currentPageStructures, handleStructurePageChange)}

                      <li className={`page-item ${currentPageStructures === totalPagesStructures && "disabled"}`}>
                        <button 
                          className="page-link" 
                          onClick={() => handleStructurePageChange(currentPageStructures + 1)}
                          disabled={currentPageStructures === totalPagesStructures}
                        >
                          Next &raquo;
                        </button>
                      </li>
                    </ul>
                    <div className="text-muted small">
                      Page {currentPageStructures} of {totalPagesStructures}
                    </div>
                  </div>
                </nav>
              )}
            </>
          )}
        </div>
      )}

      {/* Create Annual Structure Modal */}
      {showAnnualModal && (
        <div className="modal d-block" tabIndex="-1" onClick={handleAnnualModalClose}>
          <div
            className="modal-dialog modal-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create Annual Salary Structure</h5>
                <button type="button" className="btn-close" onClick={handleAnnualModalClose}></button>
              </div>
              <form onSubmit={createAnnualStructure}>
                <div className="modal-body">
                  <p className="text-muted">Define annual CTC breakdown for employee contract</p>
                  
                  {/* Employee Data Status */}
                  {loading && (
                    <div className="alert alert-info">
                      <i className="fas fa-spinner fa-spin me-2"></i>
                      Fetching employee data...
                    </div>
                  )}
                  
                  {employeeData && (
                    <div className="alert alert-success">
                      <i className="fas fa-check-circle me-2"></i>
                      Employee data loaded! Annual structure calculated automatically.
                    </div>
                  )}

                  {annualFormData.employeeId && !employeeData && !loading && (
                    <div className="alert alert-warning">
                      <i className="fas fa-exclamation-triangle me-2"></i>
                      Employee not found. Please check the Employee ID.
                    </div>
                  )}

                  <div className="row g-3">
                    {/* Employee Basic Info */}
                    <div className="col-12">
                      <h6 className="border-bottom pb-2">Employee Information</h6>
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label">Employee ID *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="employeeId"
                        value={annualFormData.employeeId}
                        onChange={handleAnnualFormChange}
                        placeholder="Enter employee UUID"
                        required
                      />
                      <small className="text-muted">Enter employee ID to auto-fill data</small>
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label">Financial Year *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="financialYear"
                        value={annualFormData.financialYear}
                        onChange={handleAnnualFormChange}
                        required
                        readOnly
                        style={{ backgroundColor: '#f8f9fa' }}
                      />
                      <small className="text-muted">Automatically set to current financial year</small>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Employee Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="employeeName"
                        value={annualFormData.employeeName}
                        onChange={handleAnnualFormChange}
                        required
                        readOnly={!!employeeData}
                        style={{ backgroundColor: employeeData ? '#f8f9fa' : '' }}
                      />
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label">Designation</label>
                      <input
                        type="text"
                        className="form-control"
                        name="designation"
                        value={annualFormData.designation}
                        onChange={handleAnnualFormChange}
                        readOnly={!!employeeData}
                        style={{ backgroundColor: employeeData ? '#f8f9fa' : '' }}
                      />
                    </div>

                    {/* Annual Components */}
                    <div className="col-12 mt-4">
                      <h6 className="border-bottom pb-2">Annual Components (CTC Breakdown)</h6>
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label">Annual CTC *</label>
                      <input
                        type="number"
                        className="form-control"
                        name="annualSalary"
                        value={annualFormData.annualSalary}
                        onChange={handleAnnualFormChange}
                        required
                        readOnly={!!employeeData}
                        style={{ backgroundColor: employeeData ? '#f8f9fa' : '' }}
                      />
                      <small className="text-muted">Total annual cost to company</small>
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label">Annual Gross</label>
                      <input
                        type="number"
                        className="form-control"
                        name="annualGross"
                        value={annualFormData.annualGross}
                        onChange={handleAnnualFormChange}
                        readOnly
                        style={{ backgroundColor: '#e9ecef' }}
                      />
                      <small className="text-muted">Same as Annual CTC</small>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label">Annual Basic *</label>
                      <input
                        type="number"
                        className="form-control"
                        name="annualBasic"
                        value={annualFormData.annualBasic}
                        onChange={handleAnnualFormChange}
                        required
                        readOnly={!!employeeData}
                        style={{ backgroundColor: employeeData ? '#f8f9fa' : '' }}
                      />
                      <small className="text-muted">40% of Annual CTC</small>
                    </div>
                    
                    <div className="col-md-4">
                      <label className="form-label">Annual HRA</label>
                      <input
                        type="number"
                        className="form-control"
                        name="annualHra"
                        value={annualFormData.annualHra}
                        onChange={handleAnnualFormChange}
                        readOnly={!!employeeData}
                        style={{ backgroundColor: employeeData ? '#f8f9fa' : '' }}
                      />
                      <small className="text-muted">40% of Basic</small>
                    </div>
                    
                    <div className="col-md-4">
                      <label className="form-label">Annual Allowances</label>
                      <input
                        type="number"
                        className="form-control"
                        name="annualAllowances"
                        value={annualFormData.annualAllowances}
                        onChange={handleAnnualFormChange}
                        readOnly={!!employeeData}
                        style={{ backgroundColor: employeeData ? '#f8f9fa' : '' }}
                      />
                      <small className="text-muted">Special Component</small>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Annual Net Salary</label>
                      <input
                        type="number"
                        className="form-control"
                        name="annualNet"
                        value={annualFormData.annualNet}
                        onChange={handleAnnualFormChange}
                        readOnly
                        style={{ backgroundColor: '#e9ecef' }}
                      />
                      <small className="text-muted">Annual salary after deductions</small>
                    </div>

                    {/* Monthly Breakdown */}
                    <div className="col-12 mt-4">
                      <h6 className="border-bottom pb-2">Monthly Breakdown (For Payslip Reference)</h6>
                    </div>
                    
                    <div className="col-md-3">
                      <label className="form-label">Monthly Basic</label>
                      <input
                        type="number"
                        className="form-control"
                        name="monthlyBasic"
                        value={annualFormData.monthlyBasic}
                        onChange={handleAnnualFormChange}
                        readOnly
                        style={{ backgroundColor: '#e9ecef' }}
                      />
                      <small className="text-muted">Annual Basic ÷ 12</small>
                    </div>
                    
                    <div className="col-md-3">
                      <label className="form-label">Monthly HRA</label>
                      <input
                        type="number"
                        className="form-control"
                        name="monthlyHra"
                        value={annualFormData.monthlyHra}
                        onChange={handleAnnualFormChange}
                        readOnly
                        style={{ backgroundColor: '#e9ecef' }}
                      />
                      <small className="text-muted">Annual HRA ÷ 12</small>
                    </div>
                    
                    <div className="col-md-3">
                      <label className="form-label">Monthly Allowances</label>
                      <input
                        type="number"
                        className="form-control"
                        name="monthlyAllowances"
                        value={annualFormData.monthlyAllowances}
                        onChange={handleAnnualFormChange}
                        readOnly
                        style={{ backgroundColor: '#e9ecef' }}
                      />
                      <small className="text-muted">Annual Allowances ÷ 12</small>
                    </div>
                    
                    <div className="col-md-3">
                      <label className="form-label">Monthly Gross</label>
                      <input
                        type="number"
                        className="form-control"
                        name="monthlyGross"
                        value={annualFormData.monthlyGross}
                        onChange={handleAnnualFormChange}
                        readOnly
                        style={{ backgroundColor: '#e9ecef' }}
                      />
                      <small className="text-muted">Annual Gross ÷ 12</small>
                    </div>

                    <div className="col-md-3">
                      <label className="form-label">Monthly Net Salary</label>
                      <input
                        type="number"
                        className="form-control"
                        name="monthlyNet"
                        value={annualFormData.monthlyNet}
                        onChange={handleAnnualFormChange}
                        readOnly
                        style={{ backgroundColor: '#e9ecef' }}
                      />
                      <small className="text-muted">After deductions</small>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={handleAnnualModalClose}>
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-dark"
                    disabled={actionLoading || !annualFormData.employeeId || !annualFormData.annualSalary}
                  >
                    {actionLoading ? "Creating..." : "Create Annual Structure"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Generate Payslip Modal */}
      {showPayslipModal && (
        <div className="modal d-block" tabIndex="-1" onClick={handlePayslipModalClose}>
          <div
            className="modal-dialog modal-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Generate Monthly Payslip</h5>
                <button type="button" className="btn-close" onClick={handlePayslipModalClose}></button>
              </div>
              <form onSubmit={generatePayslip}>
                <div className="modal-body">
                  <p className="text-muted">Generate payslip using annual salary structure</p>
                  
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Employee ID *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="employeeId"
                        value={payslipFormData.employeeId}
                        onChange={handlePayslipFormChange}
                        placeholder="Enter employee UUID"
                        required
                      />
                      <small className="text-muted">Employee must have annual structure</small>
                    </div>
                    
                    <div className="col-md-3">
                      <label className="form-label">Month *</label>
                      <select
                        className="form-select"
                        name="month"
                        value={payslipFormData.month}
                        onChange={handlePayslipFormChange}
                        required
                      >
                        <option value="">Select Month</option>
                        <option value="1">January</option>
                        <option value="2">February</option>
                        <option value="3">March</option>
                        <option value="4">April</option>
                        <option value="5">May</option>
                        <option value="6">June</option>
                        <option value="7">July</option>
                        <option value="8">August</option>
                        <option value="9">September</option>
                        <option value="10">October</option>
                        <option value="11">November</option>
                        <option value="12">December</option>
                      </select>
                    </div>
                    
                    <div className="col-md-3">
                      <label className="form-label">Year *</label>
                      <input
                        type="number"
                        className="form-control"
                        name="year"
                        value={payslipFormData.year}
                        onChange={handlePayslipFormChange}
                        placeholder="2024"
                        required
                      />
                    </div>
                  </div>

                  <div className="alert alert-info mt-3">
                    <i className="fas fa-info-circle me-2"></i>
                    This will generate payslip using the employee's annual salary structure with pro-rata calculations based on attendance and leaves.
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={handlePayslipModalClose}>
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-dark"
                    disabled={actionLoading || !payslipFormData.employeeId || !payslipFormData.month || !payslipFormData.year}
                  >
                    {actionLoading ? "Generating..." : "Generate Payslip"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}