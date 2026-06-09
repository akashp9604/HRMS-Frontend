import { createContext, useState, useEffect } from "react";
 
export const AuthContext = createContext();
 
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Load user from localStorage on app start (UPDATED for JWT)
  useEffect(() => {
    // Check for JWT token first
    const token = localStorage.getItem("jwt_token");
    const userData = localStorage.getItem("user");
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        console.log("✅ User restored from JWT:", parsedUser);
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("jwt_token");
        localStorage.removeItem("user");
      }
    }
    
    // Clean up old storage keys (one-time migration)
    localStorage.removeItem("authUser");
    localStorage.removeItem("employee");
    localStorage.removeItem("admin");
    
    setLoading(false);
  }, []);
 
  // ✅ Updated login function for JWT
  const login = (email, role, employeeId, employeeName, token) => {
    // Normalize role to uppercase for consistent checks
    const normalizedRole = role?.toUpperCase();
    
    const userData = {
      email,
      role: normalizedRole,
      id: employeeId,        // Consistent naming
      employeeId: employeeId, // Keep for backward compatibility
      name: employeeName,     // Consistent naming
      employeeName: employeeName, // Keep for backward compatibility
      loginTime: new Date().toISOString()
    };
    
    // ✅ Store JWT token and user data
    localStorage.setItem("jwt_token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    
    // ✅ Clean up old storage keys
    localStorage.removeItem("authUser");
    localStorage.removeItem("employee");
    localStorage.removeItem("admin");
    
    // Update context state
    setUser(userData);
    console.log("✅ User logged in with JWT:", userData);
  };
 
  // ✅ Updated logout function
  const logout = () => {
    // Clear state first
    setUser(null);
    
    // Clear all JWT-related localStorage items
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("user");
    
    // Clean up any remaining old data
    localStorage.removeItem("authUser");
    localStorage.removeItem("employee");
    localStorage.removeItem("admin");
    
    console.log("✅ User logged out - JWT cleared");
  };

  // ✅ Check if user is admin/manager/hr
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
      loading,
      isAdmin: isAdmin(),
      isEmployee: isEmployee(),
      // Convenience properties
      token: localStorage.getItem("jwt_token")
    }}>
      {children}
    </AuthContext.Provider>
  );
};