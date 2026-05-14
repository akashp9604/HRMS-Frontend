import axios from "axios";

const API_URL = "http://localhost:8085/api/attendance"; // adjust if backend runs elsewhere
const EMPLOYEE_API_URL = "http://localhost:8081/api/employees";

// ✅ Import daily attendance from third-party (POST)
export const importDailyAttendance = async () => {
  const response = await axios.post(`${API_URL}/import/daily`);
  return response.data;
};

// ✅ Get today's attendance (GET from your own DB after import)
export const getDailyAttendance = async (date) => {
  const response = await axios.get(`${API_URL}/daily/${date}`);
  return response.data;
};

// ✅ Import attendance by date
export const importAttendanceByDate = async (date) => {
  const response = await axios.post(`${API_URL}/import/by-date?date=${date}`);
  return response.data;
};

// ✅ Get monthly summary for an employee
export const getMonthlySummary = async (employeeId, month, year) => {
  const response = await axios.get(
    `${API_URL}/${employeeId}/summary?month=${month}&year=${year}`
  );
  return response.data;
};

// ✅ NEW: Get employee monthly summary (the API you want to call)
export const getEmployeeMonthlySummary = async (employeeId, month) => {
  try {
    const response = await axios.get(
      `${API_URL}/employee/${employeeId}/monthly-summary?month=${month}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching employee monthly summary:', error);
    throw error;
  }
};

// ✅ Get monthly attendance (for calendar view)
export const getMonthlyAttendance = async (year, month) => {
  const response = await axios.get(
    `${API_URL}/monthly?year=${year}&month=${month}`
  );
  return response.data;
};

// ✅ Get employees list from attendance
export const getEmployeesFromAttendance = async () => {
  const response = await axios.get(`${API_URL}/employees`);
  return response.data;
};

// ✅ NEW employee list API for monthly summary tab
export const getEmployeesInfo = async () => {
  const response = await axios.get(`${API_URL}/employees-info`);
  return response.data;
};

// ✅ Download monthly report (JSON format)
export const getMonthlyReportJson = async (monthYear, employeeIds) => {
  const response = await axios.post(`${API_URL}/monthly-report/json`, {
    monthYear,
    employeeIds,
  });
  return response.data;
};

// ✅ Download monthly report as Excel
export const downloadMonthlyReportExcel = async (monthYear, employeeIds) => {
  const response = await axios.post(
    `${API_URL}/monthly-report/excel`,
    { monthYear, employeeIds },
    { responseType: "blob" }
  );
  return response.data;
};

// ✅ NEW: Get present/absent summary (today or custom date)
export const getPresentAbsentSummary = async (date) => {
  const url = date
    ? `${API_URL}/present-absent-summary?date=${date}` // custom date
    : `${API_URL}/present-absent-summary`; // today by default
  const response = await axios.get(url);
  return response.data; // { totalPresent: X, totalAbsent: Y }
};

// ✅ NEW: Get employee's daily attendance
export const getEmployeeDailyAttendance = async (employeeId, date) => {
  try {
    const response = await axios.get(
      `http://localhost:8085/api/attendance/employee/${employeeId}/daily?date=${date}`
    );
    return response.data;
  } catch (error) {
    console.error('Error in getEmployeeDailyAttendance:', error);
    throw error;
  }
};

// ✅ NEW: Get employee's monthly details
export const getEmployeeMonthlyDetails = async (employeeId, startDate, endDate) => {
  try {
    const response = await axios.get(
      `http://localhost:8085/api/attendance/employee-monthly-details?employeeId=${employeeId}&startDate=${startDate}&endDate=${endDate}`
    );
    return response.data;
  } catch (error) {
    console.error('Error in getEmployeeMonthlyDetails:', error);
    throw error;
  }
};

export const registerEmployee = async (employeeData) => {
  // employeeData should include: name, email, password, role, dateOfJoining
  const response = await axios.post(`${EMPLOYEE_API_URL}/register`, employeeData);
  return response.data;
};

// Update employee details
export const updateEmployee = async (id, employeeData) => {
  // employeeData should include updated fields, including dateOfJoining
  const response = await axios.put(`${EMPLOYEE_API_URL}/${id}`, employeeData);
  return response.data;
};

// Get employee details by ID
export const getEmployeeById = async (id) => {
  const response = await axios.get(`${EMPLOYEE_API_URL}/${id}`);
  return response.data; // should return dateOfJoining as well
};

// Get all employees
export const getAllEmployees = async () => {
  const response = await axios.get(`${EMPLOYEE_API_URL}/all`);
  return response.data;
};