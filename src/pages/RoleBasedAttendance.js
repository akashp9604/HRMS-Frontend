import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import AdminAttendancePage from './AttendancePage'; // Your existing admin page
import EmployeeAttendance from './EmployeeAttendance'; // New employee component

const RoleBasedAttendance = () => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <div>Please login to view attendance</div>;
  }

  // Check if user is admin or manager
  const isAdmin = user.role?.toUpperCase() === 'ADMIN' || user.role?.toUpperCase() === 'MANAGER';

  return (
    <div>
      {isAdmin ? (
        <AdminAttendancePage />
      ) : (
        <EmployeeAttendance employeeId={user.employeeId} />
      )}
    </div>
  );
};

export default RoleBasedAttendance;