import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import EmployeeList from "./pages/EmployeeList";
import EmployeeDetails from "./pages/EmployeeDetails";
import EmployeeForm from "./pages/EmployeeForm";
import Dashboard from "./pages/Dashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard"; // ✅ ADD THIS IMPORT
import AttendancePage from "./pages/AttendancePage";
import EmployeeAttendance from "./pages/EmployeeAttendance";
import LeaveManagementPage from "./pages/LeaveManagementPage";
import EmployeeLeavePage from "./pages/EmployeeLeavePage";
import Profile from "./pages/Profile";
import Payroll from "./pages/Payroll";
import EmployeeReportTab from "./pages/EmployeeReportTab";
// ==================== ADD THIS IMPORT ====================
import OfferAcceptancePage from "./pages/OfferAcceptancePage";

import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

function LayoutWrapper({ children }) {
  const sidebarWidth = 250;
  const navbarHeight = 60;

  const layoutStyle = {
    marginLeft: sidebarWidth,
    padding: `${navbarHeight + 20}px 20px 20px 20px`,
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <div style={layoutStyle}>{children}</div>
    </>
  );
}

// ✅ ADD THIS NEW FUNCTION FOR OFFER ACCEPTANCE PAGE (NO LAYOUT)
function OfferAcceptanceRoute() {
  // No layout wrapper for offer acceptance page - it should be standalone
  return <OfferAcceptancePage />;
}

// ✅ ADD THIS NEW FUNCTION FOR ROLE-BASED DASHBOARD
function ProtectedDashboard() {
  const { user } = useContext(AuthContext);
  if (!user) return <Login />;

  // Role-based dashboard rendering
  if (user.role?.toUpperCase() === "EMPLOYEE") {
    return <LayoutWrapper><EmployeeDashboard /></LayoutWrapper>;
  } else {
    return <LayoutWrapper><Dashboard /></LayoutWrapper>;
  }
}

function ProtectedLeavesPage() {
  const { user } = useContext(AuthContext);
  if (!user) return <Login />;

  // Role-based rendering
  if (user.role?.toUpperCase() === "ADMIN" || user.role?.toUpperCase() === "MANAGER") {
    return <LayoutWrapper><LeaveManagementPage /></LayoutWrapper>;
  } else {
    return <LayoutWrapper><EmployeeLeavePage /></LayoutWrapper>;
  }
}

function ProtectedAttendancePage() {
  const { user } = useContext(AuthContext);
  if (!user) return <Login />;

  // Role-based rendering for attendance
  if (user.role?.toUpperCase() === "ADMIN" || user.role?.toUpperCase() === "MANAGER") {
    return <LayoutWrapper><AttendancePage /></LayoutWrapper>;
  } else {
    return <LayoutWrapper><EmployeeAttendance employeeId={user.employeeId} /></LayoutWrapper>;
  }
}

// ✅ ADD THIS NEW FUNCTION FOR REPORTS
function ProtectedReportsPage() {
  const { user } = useContext(AuthContext);
  if (!user) return <Login />;

  // Only employees can access their reports
  if (user.role?.toUpperCase() === "EMPLOYEE") {
    return <LayoutWrapper><EmployeeReportTab /></LayoutWrapper>;
  } else {
    return <LayoutWrapper><div className="alert alert-warning m-4">Access denied. This page is only for employees.</div></LayoutWrapper>;
  }
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* ✅ ADD THIS NEW ROUTE FOR OFFER ACCEPTANCE */}
          <Route path="/offer-acceptance" element={<OfferAcceptanceRoute />} />

          {/* ✅ UPDATED: Role-based dashboard */}
          <Route path="/dashboard" element={<ProtectedDashboard />} />
          
          <Route path="/employees" element={<LayoutWrapper><EmployeeList /></LayoutWrapper>} />
          <Route path="/employees/:id" element={<LayoutWrapper><EmployeeDetails /></LayoutWrapper>} />
          <Route path="/employees/new" element={<LayoutWrapper><EmployeeForm /></LayoutWrapper>} />
          
          {/* ✅ UPDATED: Role-based attendance page */}
          <Route path="/attendance" element={<ProtectedAttendancePage />} />
          
          <Route path="/payroll" element={<LayoutWrapper><Payroll /></LayoutWrapper>} />
          <Route path="/profile" element={<LayoutWrapper><Profile /></LayoutWrapper>} />

          {/* Role-based leave page */}
          <Route path="/leaves" element={<ProtectedLeavesPage />} />

          {/* ✅ ADD THIS NEW ROUTE FOR REPORTS */}
          <Route path="/reports" element={<ProtectedReportsPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;