import axiosInstance from "./axiosConfig";

const BASE_URL = "http://localhost:8093/api/leaves";

// ✅ Get all pending leaves
export const getPendingLeaves = async () => {
  try {
    const response = await axiosInstance.get(`${BASE_URL}/pending`);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching pending leaves:", error);
    throw error;
  }
};

// ✅ Get all leaves
export const getAllLeaves = async () => {
  try {
    const response = await axiosInstance.get(`${BASE_URL}/all`);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching all leaves:", error);
    throw error;
  }
};

// ✅ NEW: Credit leaves to employee (Allocate leaves)
export const creditLeaves = async (leaveData) => {
  try {
    const response = await axiosInstance.post(`${BASE_URL}/credit-leaves`, leaveData);
    return response.data;
  } catch (error) {
    console.error("❌ Error crediting leaves:", error);
    throw error;
  }
};

// ✅ Approve a leave by ID (send managerId)
export const approveLeave = async (leaveId, managerId) => {
  try {
    const response = await axiosInstance.put(`${BASE_URL}/approve/${leaveId}?managerId=${managerId}`);
    return response.data;
  } catch (error) {
    console.error("❌ Error approving leave:", error);
    throw error;
  }
};

// ✅ Reject a leave by ID (send managerId)
export const rejectLeave = async (leaveId, managerId) => {
  try {
    const response = await axiosInstance.put(`${BASE_URL}/reject/${leaveId}?managerId=${managerId}`);
    return response.data;
  } catch (error) {
    console.error("❌ Error rejecting leave:", error);
    throw error;
  }
};

// ✅ Apply for a new leave (Single)
export const applyLeave = async (leaveData) => {
  try {
    const response = await axiosInstance.post(`${BASE_URL}/apply`, leaveData);
    return response.data;
  } catch (error) {
    console.error("❌ Error applying for leave:", error);
    throw error;
  }
};

// ✅ NEW: Apply multiple leaves at once
export const applyMultipleLeaves = async (leaveRequests) => {
  try {
    const response = await axiosInstance.post(`${BASE_URL}/apply-multiple`, leaveRequests);
    return response.data;
  } catch (error) {
    console.error("❌ Error applying multiple leaves:", error);
    throw error;
  }
};

// ✅ Get leaves by employee ID
export const getEmployeeLeaves = async (employeeId) => {
  try {
    const response = await axiosInstance.get(`${BASE_URL}/employee/${employeeId}`);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching employee leaves:", error);
    throw error;
  }
};

// ✅ Get leave balance by employee ID
export const getLeaveBalance = async (employeeId) => {
  try {
    const response = await axiosInstance.get(`${BASE_URL}/leave-balance/${employeeId}`);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching leave balance:", error);
    throw error;
  }
};

// ✅ Cancel a leave by ID
export const cancelLeave = async (leaveId) => {
  try {
    const response = await axiosInstance.put(`${BASE_URL}/cancel/${leaveId}`);
    return response.data;
  } catch (error) {
    console.error("❌ Error canceling leave:", error);
    throw error;
  }
};

// ✅ NEW: Get monthly paid leave usage
export const getMonthlyPaidLeaveUsage = async (employeeId, month, year) => {
  try {
    const response = await axiosInstance.get(
      `${BASE_URL}/employee/${employeeId}/paid-leave-usage?month=${month}&year=${year}`
    );
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching monthly paid leave usage:", error);
    throw error;
  }
};

// ✅ NEW: Get converted leaves for employee
export const getConvertedLeaves = async (employeeId) => {
  try {
    const response = await axiosInstance.get(`${BASE_URL}/employee/${employeeId}/converted-leaves`);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching converted leaves:", error);
    throw error;
  }
};

// ✅ NEW: Get WFH days count for payroll
export const getWFHDaysCount = async (employeeId, from, to) => {
  try {
    const response = await axiosInstance.get(
      `${BASE_URL}/employee/${employeeId}/wfh-days?from=${from}&to=${to}`
    );
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching WFH days count:", error);
    throw error;
  }
};

// ✅ NEW: Get leaves between dates for employee
export const getLeavesBetweenDates = async (employeeId, from, to) => {
  try {
    const response = await axiosInstance.get(
      `${BASE_URL}/employee/${employeeId}/between?from=${from}&to=${to}`
    );
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching leaves between dates:", error);
    throw error;
  }
};

// ✅ NEW: Get monthly leave summary
export const getMonthlyLeaveSummary = async (employeeId, month, year) => {
  try {
    const response = await axiosInstance.get(
      `${BASE_URL}/employee/${employeeId}/monthly-summary?month=${month}&year=${year}`
    );
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching monthly leave summary:", error);
    throw error;
  }
};

// ✅ NEW: Initialize leave balances from attendance
export const initializeLeaveBalances = async () => {
  try {
    const response = await axiosInstance.post(`${BASE_URL}/init-from-attendance`);
    return response.data;
  } catch (error) {
    console.error("❌ Error initializing leave balances:", error);
    throw error;
  }
};

// ✅ Utility: readable leave type (UPDATED with WFH)
export const toDisplayLeaveType = (type) => {
  switch (type) {
    case "PAID":
      return "Paid Leave";
    case "SICK":
      return "Sick Leave";
    case "CASUAL":
      return "Casual Leave";
    case "UNPAID":
      return "Unpaid Leave";
    case "WFH":
      return "Work From Home";
    default:
      return type;
  }
};

// ✅ NEW: Get status display text
export const toDisplayStatus = (status) => {
  switch (status) {
    case "PENDING":
      return "Pending Approval";
    case "APPROVED":
      return "Approved";
    case "REJECTED":
      return "Rejected";
    case "CANCELLED":
      return "Cancelled";
    case "AUTO_APPROVED":
      return "Auto Approved";
    default:
      return status;
  }
};

// ✅ NEW: Get status badge color
export const getStatusBadgeColor = (status) => {
  switch (status) {
    case "PENDING":
      return "warning";
    case "APPROVED":
      return "success";
    case "REJECTED":
      return "danger";
    case "CANCELLED":
      return "secondary";
    case "AUTO_APPROVED":
      return "info";
    default:
      return "secondary";
  }
};

// ✅ NEW: Get leave type badge color
export const getLeaveTypeBadgeColor = (leaveType) => {
  switch (leaveType) {
    case "PAID":
      return "primary";
    case "SICK":
      return "secondary";
    case "CASUAL":
      return "success";
    case "UNPAID":
      return "dark";
    case "WFH":
      return "info";
    default:
      return "light";
  }
};

// ✅ NEW: Validate leave application data
export const validateLeaveApplication = (leaveData) => {
  const errors = [];

  if (!leaveData.employeeId) {
    errors.push("Employee ID is required");
  }

  if (!leaveData.leaveType) {
    errors.push("Leave type is required");
  }

  if (!leaveData.startDate) {
    errors.push("Start date is required");
  }

  if (!leaveData.endDate) {
    errors.push("End date is required");
  }

  if (leaveData.startDate && leaveData.endDate) {
    const start = new Date(leaveData.startDate);
    const end = new Date(leaveData.endDate);
    
    if (end < start) {
      errors.push("End date cannot be before start date");
    }
  }

  return errors;
};

// ✅ NEW: Format leave application data for API
export const formatLeaveData = (rawData) => {
  return {
    employeeId: rawData.employeeId,
    leaveType: rawData.leaveType,
    startDate: rawData.startDate,
    endDate: rawData.endDate,
    reason: rawData.reason || "",
    hoursWorked: rawData.hoursWorked || null,
    isPartialDay: rawData.isPartialDay || false
  };
};

// ✅ NEW: Calculate leave duration in days
export const calculateLeaveDuration = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const timeDiff = end.getTime() - start.getTime();
  const daysDiff = timeDiff / (1000 * 3600 * 24) + 1; // +1 to include both start and end dates
  return Math.max(1, daysDiff); // Minimum 1 day
};

// ✅ NEW: Check if dates are in same month (for paid leave validation)
export const areDatesInSameMonth = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
};

// ✅ NEW: Get current month and year for paid leave tracking
export const getCurrentMonthYear = () => {
  const now = new Date();
  return {
    month: now.getMonth() + 1, // 1-12
    year: now.getFullYear()
  };
};

// ✅ NEW: Get employee details by ID
export const getEmployeeDetails = async (employeeId) => {
  try {
    const response = await axiosInstance.get(`http://localhost:8088/api/employees/${employeeId}`);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching employee details:", error);
    throw error;
  }
};

export default {
  getPendingLeaves,
  getAllLeaves,
  creditLeaves, 
  approveLeave,
  rejectLeave,
  applyLeave,
  applyMultipleLeaves,
  getEmployeeLeaves,
  getLeaveBalance,
  cancelLeave,
  getMonthlyPaidLeaveUsage,
  getConvertedLeaves,
  getWFHDaysCount,
  getLeavesBetweenDates,
  getMonthlyLeaveSummary,
  initializeLeaveBalances,
  toDisplayLeaveType,
  toDisplayStatus,
  getStatusBadgeColor,
  getLeaveTypeBadgeColor,
  validateLeaveApplication,
  formatLeaveData,
  calculateLeaveDuration,
  areDatesInSameMonth,
  getCurrentMonthYear
};