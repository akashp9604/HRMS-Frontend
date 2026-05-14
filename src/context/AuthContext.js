import { createContext, useState, useEffect } from "react";
 
export const AuthContext = createContext();
 
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
 
  // ✅ Load user from localStorage on app start
  useEffect(() => {
    const employeeData = JSON.parse(localStorage.getItem("employee"));
    const adminData = JSON.parse(localStorage.getItem("admin"));
   
    if (employeeData) {
      setUser(employeeData);
    } else if (adminData) {
      setUser(adminData);
    }
  }, []);
 
  // ✅ Enhanced login function with better role handling
  const login = (email, role, employeeId, employeeName) => {
    // Normalize role to uppercase for consistent checks
    const normalizedRole = role?.toUpperCase();
    
    const userData = {
      email,
      role: normalizedRole,
      employeeId,
      employeeName,
      loginTime: new Date().toISOString()
    };
   
    // ✅ Save to localStorage based on role
    if (normalizedRole === "ADMIN" || normalizedRole === "HR" || normalizedRole === "MANAGER") {
      localStorage.removeItem("employee");
      localStorage.setItem("admin", JSON.stringify(userData));
      console.log("✅ Admin/HR/Manager logged in:", userData);
    } else {
      localStorage.removeItem("admin");
      localStorage.setItem("employee", JSON.stringify(userData));
      console.log("✅ Employee logged in:", userData);
    }
   
    // Update context state
    setUser(userData);
  };
 
  // ✅ Enhanced logout function
  const logout = () => {
    // Clear state first
    setUser(null);
   
    // Clear all localStorage items
    localStorage.removeItem("authUser");
    localStorage.removeItem("employee");
    localStorage.removeItem("admin");
   
    console.log("✅ User logged out - all data cleared");
  };

  // ✅ Check if user is admin
  const isAdmin = () => {
    return user && (user.role === "ADMIN" || user.role === "HR" || user.role === "MANAGER");
  };

  // ✅ Check if user is employee
  const isEmployee = () => {
    return user && user.role === "EMPLOYEE";
  };
 
  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout,
      isAdmin: isAdmin(),
      isEmployee: isEmployee()
    }}>
      {children}
    </AuthContext.Provider>
  );
};