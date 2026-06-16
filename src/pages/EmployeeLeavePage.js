import React, { useEffect, useState, useContext } from "react";
import axiosInstance from "../apis/axiosConfig"; 
import { AuthContext } from "../context/AuthContext"; 
import "bootstrap/dist/css/bootstrap.min.css";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const EmployeeLeavePage = () => {
  const { user } = useContext(AuthContext);
  const employee = user;
  const employeeId = user?.id || user?.employeeId;
  const employeeName = user?.name || user?.employeeName;
 
  // 🔍 ADDED DEBUGGING
  console.log("🔄 DEBUG: Component loaded - Employee data from AuthContext:");
  console.log("  - Full employee object:", employee);
  console.log("  - Employee ID:", employeeId);
  console.log("  - Employee Name:", employeeName);
  
  const [leaveBalance, setLeaveBalance] = useState({});
  const [leaves, setLeaves] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("calendar");
  const [newLeave, setNewLeave] = useState({
    leaveType: "SICK",
    startDate: "",
    endDate: "",
    reason: "",
    // medicalCertificate: null,  // for medical leave
    // medicalCertificateName: ""
  });
  const [medicalDocument, setMedicalDocument] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [editingLeave, setEditingLeave] = useState(null);
  const [cancellingLeave, setCancellingLeave] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // NEW: Store manager names mapping
  const [managerNames, setManagerNames] = useState({});

  // NEW: Paid leave usage state
  const [paidLeaveUsage, setPaidLeaveUsage] = useState({
    used: 0,
    limit: 2,
    remaining: 2
  });

  // Calendar state
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [highlightedDates, setHighlightedDates] = useState({});

  const [currentEmployeeId, setCurrentEmployeeId] = useState("");

  // NEW: Modal state
  const [showApplyModal, setShowApplyModal] = useState(false);

  // NEW: Hover state for calendar
  const [hoveredDate, setHoveredDate] = useState(null);
  const [hoveredDateInfo, setHoveredDateInfo] = useState(null);
  const [attendanceData, setAttendanceData] = useState({});

  // 🟢 NEW: Success popup state
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successPopupData, setSuccessPopupData] = useState(null);

  // Auto-hide messages after 5 seconds
  useEffect(() => {
    if (successMsg || errorMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg("");
        setErrorMsg("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, errorMsg]);

  // 🟢 NEW: Auto-hide success popup after 5 seconds
  useEffect(() => {
    if (showSuccessPopup) {
      const timer = setTimeout(() => {
        setShowSuccessPopup(false);
        setSuccessPopupData(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessPopup]);

  // Initialize employeeId from props or AuthContext
  useEffect(() => {
    const id = employeeId || localStorage.getItem('employeeId') || '20250304-O-L-53';
    console.log("🆔 Setting employee ID:", id);
    setCurrentEmployeeId(id);
  }, [employeeId]);

  useEffect(() => {
    if (currentEmployeeId) {
      console.log("🔄 Fetching data for employee:", currentEmployeeId);
      fetchData();
    }
  }, [currentEmployeeId]);

  // Update highlighted dates when leaves or holidays change
  useEffect(() => {
    prepareHighlightedDates();
  }, [leaves, holidays]);

  // NEW: Fetch paid leave usage when leave type changes to PAID
  useEffect(() => {
    if (newLeave.leaveType === "PAID" && currentEmployeeId) {
      fetchPaidLeaveUsage();
    }
  }, [newLeave.leaveType, currentEmployeeId]);

  // NEW: Open apply leave modal
  const openApplyLeaveModal = () => {
    setShowApplyModal(true);
  };

  // NEW: Close apply leave modal
  const closeApplyLeaveModal = () => {
    setShowApplyModal(false);
    setEditingLeave(null);
    setNewLeave({
      leaveType: "SICK",
      startDate: "",
      endDate: "",
      reason: "",
    });
    setMedicalDocument(null);
    setErrorMsg("");
  };

  // 🟢 NEW: Show success popup
  const showLeaveSuccessPopup = (leaveData) => {
    setSuccessPopupData({
      leaveType: getLeaveTypeDisplay(leaveData.leaveType),
      startDate: formatDate(leaveData.startDate),
      endDate: formatDate(leaveData.endDate),
      duration: calculateLeaveDuration(leaveData.startDate, leaveData.endDate),
      appliedDate: new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    });
    setShowSuccessPopup(true);
  };

  // 🟢 NEW: Close success popup manually
  const closeSuccessPopup = () => {
    setShowSuccessPopup(false);
    setSuccessPopupData(null);
  };

  // NEW: Check if date is weekend
  const isWeekend = (date) => {
    const day = new Date(date).getDay();
    return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
  };

  // NEW: Get next weekday from a given date
  const getNextWeekday = (date) => {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    
    while (isWeekend(nextDay)) {
      nextDay.setDate(nextDay.getDate() + 1);
    }
    
    return nextDay.toISOString().split('T')[0];
  };

  // NEW: Validate leave dates
  const validateLeaveDates = (startDate, endDate) => {
    if (!startDate || !endDate) return { isValid: true };
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Check if start date is weekend
    if (isWeekend(start)) {
      return {
        isValid: false,
        message: "❌ Start date cannot be a weekend. Please select a weekday."
      };
    }
    
    // Check if end date is weekend
    if (isWeekend(end)) {
      return {
        isValid: false,
        message: "❌ End date cannot be a weekend. Please select a weekday."
      };
    }
    
    // Check if start date is before end date
    if (start > end) {
      return {
        isValid: false,
        message: "❌ End date cannot be before start date."
      };
    }
    
    return { isValid: true };
  };

  // NEW: Get manager name
  const getManagerName = async (managerId) => {
    if (!managerId) return "Unknown Manager";
    
    // Check if we already have the manager name
    if (managerNames[managerId]) {
      return managerNames[managerId];
    }

    try {
      // ✅ CHANGED: Use axiosInstance with JWT
      const response = await axiosInstance.get(`http://localhost:8093/api/employees/${managerId}`);
      const managerName = response.data.name || "Manager";
      
      // Cache the manager name
      setManagerNames(prev => ({
        ...prev,
        [managerId]: managerName
      }));
      
      return managerName;
    } catch (error) {
      console.error("Error fetching manager name:", error);
      return "Manager";
    }
  };

  // NEW: Process leaves to include manager names
  const processLeavesWithManagerNames = async (leavesData) => {
    const processedLeaves = await Promise.all(
      leavesData.map(async (leave) => {
        if (leave.approvedBy && leave.status === 'REJECTED') {
          const managerName = await getManagerName(leave.approvedBy);
          return {
            ...leave,
            approvedByName: managerName
          };
        }
        return leave;
      })
    );
    return processedLeaves;
  };

  // ✅ UPDATED: Fetch attendance data for a specific date using axiosInstance
  const fetchAttendanceForDate = async (date, employeeId) => {
    try {
      const dateStr = date.toISOString().split('T')[0];
      
      // Check if we already have this date's data
      if (attendanceData[dateStr]) {
        return attendanceData[dateStr];
      }

      console.log("🔍 Fetching attendance for date:", { employeeId, date: dateStr });

      // ✅ CHANGED: Use axiosInstance instead of axios
      const response = await axiosInstance.get(
        `http://localhost:8094/api/attendance/employee/${employeeId}/daily`,
        {
          params: {
            date: dateStr
          }
        }
      );
      
      console.log("✅ Attendance API Response:", response.data);
      
      // Cache the attendance data
      setAttendanceData(prev => ({
        ...prev,
        [dateStr]: response.data
      }));
      
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching attendance for date:", error);
      if (error.response) {
        console.error("Error details:", {
          status: error.response.status,
          data: error.response.data
        });
      }
      return null;
    }
  };

  // ✅ UPDATED: Handle date hover in calendar with proper attendance display
  const handleDateHover = async (date) => {
    setHoveredDate(date);
    
    const dateStr = date.toDateString();
    const dateISO = date.toISOString().split('T')[0];
    const today = new Date().toDateString();
    
    let info = {
      date: date,
      dateStr: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      type: 'normal',
      message: ''
    };

    // Check if weekend
    if (isWeekend(date)) {
      info.type = 'weekend';
      info.message = 'Weekend';
      setHoveredDateInfo(info);
      return;
    }

    // Check if holiday
    const holiday = holidays.find(h => h === dateISO);
    if (holiday) {
      info.type = 'holiday';
      info.message = 'Public Holiday 🎉';
      setHoveredDateInfo(info);
      return;
    }

    // Check if leave
    const leaveOnDate = leaves.find(leave => {
      if (!leave.startDate || !leave.endDate) return false;
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const current = new Date(date);
      return current >= start && current <= end;
    });

    if (leaveOnDate) {
      info.type = 'leave';
      info.leave = leaveOnDate;
      info.message = `${getLeaveTypeDisplay(leaveOnDate.leaveType)} - ${leaveOnDate.status}`;
      setHoveredDateInfo(info);
      return;
    }

    // Check attendance data
    if (currentEmployeeId) {
      const attendance = await fetchAttendanceForDate(date, currentEmployeeId);
      if (attendance) {
        info.type = 'attendance';
        info.attendance = attendance;
        
        // ✅ IMPROVED: Show comprehensive attendance information
        if (attendance.status === 'PRESENT') {
          if (attendance.outTime) {
            info.message = `✅ Present | In: ${formatTime(attendance.inTime)} | Out: ${formatTime(attendance.outTime)}`;
          } else if (attendance.inTime) {
            info.message = `✅ Present | In: ${formatTime(attendance.inTime)} | Still working...`;
          } else {
            info.message = '✅ Present (No time recorded)';
          }
        } else if (attendance.status === 'ABSENT') {
          info.type = 'absent';
          info.message = '❌ Absent';
        } else if (attendance.status === 'LATE') {
          info.message = `⏰ Late | In: ${formatTime(attendance.inTime)}`;
          if (attendance.outTime) {
            info.message += ` | Out: ${formatTime(attendance.outTime)}`;
          }
        } else if (attendance.status === 'HALF_DAY') {
          info.message = `🕐 Half Day | In: ${formatTime(attendance.inTime)}`;
          if (attendance.outTime) {
            info.message += ` | Out: ${formatTime(attendance.outTime)}`;
          }
        } else {
          info.message = `📊 ${attendance.status || 'No attendance record'}`;
        }

        // Add work hours if available
        if (attendance.workHours) {
          info.message += ` | Hours: ${attendance.workHours.toFixed(1)}h`;
        }

      } else {
        // No attendance record found
        if (date < new Date().setHours(0,0,0,0)) {
          info.type = 'absent';
          info.message = '❌ Absent (No record)';
        } else if (dateStr === today) {
          info.message = '📊 No attendance recorded today yet';
        } else {
          info.message = '📊 No attendance data available';
        }
      }
    }

    setHoveredDateInfo(info);
  };

  // NEW: Handle mouse leave from calendar
  const handleDateHoverOut = () => {
    setHoveredDate(null);
    setHoveredDateInfo(null);
  };

  // ✅ UPDATED: Fetch data using axiosInstance
  const fetchData = async () => {
    if (!currentEmployeeId) {
      console.error("❌ No employee ID available");
      return;
    }

    setLoading(true);
    try {
      console.log("📊 Starting data fetch for employee:", currentEmployeeId);
      
      const [balanceRes, leavesRes, holidaysRes] = await Promise.all([
        axiosInstance.get(`http://localhost:8093/api/leaves/leave-balance/${currentEmployeeId}`),
        axiosInstance.get(`http://localhost:8093/api/leaves/employee/${currentEmployeeId}`),
        axiosInstance.get(`http://localhost:8093/api/holidays/between`, {
          params: {
            from: "2025-01-01",
            to: "2025-12-31",
          },
        }),
      ]);

      console.log("✅ Leave Balance:", balanceRes.data);
      console.log("✅ Leaves:", leavesRes.data);
      console.log("✅ Holidays:", holidaysRes.data);

      setLeaveBalance(balanceRes.data);
      
      // Process leaves to get manager names
      const processedLeaves = await processLeavesWithManagerNames(leavesRes.data);
      setLeaves(processedLeaves);
      
      setHolidays(holidaysRes.data.map((h) => h.date));

      // NEW: Fetch initial paid leave usage
      await fetchPaidLeaveUsage();
    } catch (err) {
      console.error("❌ Error fetching data:", err);
      setErrorMsg("Failed to load data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  // NEW: Fetch paid leave usage
  const fetchPaidLeaveUsage = async () => {
    if (!currentEmployeeId) return;
    
    try {
      const currentDate = new Date();
      const response = await axiosInstance.get(
        `http://localhost:8093/api/leaves/employee/${currentEmployeeId}/paid-leave-usage?month=${currentDate.getMonth() + 1}&year=${currentDate.getFullYear()}`
      );
      setPaidLeaveUsage(response.data);
    } catch (err) {
      console.error("❌ Error fetching paid leave usage:", err);
    }
  };

  // NEW: Fetch employee's leave requests specifically for "My Requests" tab
  const fetchMyLeaveRequests = async () => {
    if (!currentEmployeeId) {
      console.error("❌ No employee ID available for fetching leave requests");
      return;
    }

    try {
      console.log("🔍 Fetching leave requests for employee:", currentEmployeeId);
      
      const response = await axiosInstance.get(`http://localhost:8093/api/leaves/employee/${currentEmployeeId}`);
      
      console.log("✅ API Response:", response);
      console.log("✅ Response Data:", response.data);

      if (response.data && Array.isArray(response.data)) {
        // Process leaves to get manager names
        const processedLeaves = await processLeavesWithManagerNames(response.data);
        setLeaves(processedLeaves);
        console.log(`✅ Loaded ${response.data.length} leave requests`);
      } else {
        console.error("❌ Invalid response format");
        setLeaves([]);
      }
    } catch (err) {
      console.error("❌ Error fetching my leave requests:", err);
      setErrorMsg("Failed to load your leave requests. Please try again.");
      setLeaves([]);
    }
  };

  // NEW: Cancel leave request
  const handleCancelLeave = async (leaveId) => {
    if (!leaveId) {
      setErrorMsg("Leave ID is required for cancellation");
      return;
    }

    try {
      console.log("🗑️ Cancelling leave:", leaveId);
      
      const response = await axiosInstance.put(`http://localhost:8093/api/leaves/cancel/${leaveId}`);
      
      console.log("✅ Leave cancelled successfully:", response.data);
      setSuccessMsg("✅ Leave request cancelled successfully!");
      
      // Refresh the data
      fetchMyLeaveRequests();
      fetchData();
      
      // Close cancel modal
      setShowCancelModal(false);
      setCancellingLeave(null);
    } catch (err) {
      console.error("❌ Error cancelling leave:", err);
      setErrorMsg(err.response?.data || "❌ Failed to cancel leave request. Please try again.");
    }
  };

  // NEW: Edit leave request
  const handleEditLeave = (leave) => {
    console.log("✏️ Editing leave:", leave);
    
    // Set the form to edit mode
    setEditingLeave(leave);
    setNewLeave({
      leaveType: leave.leaveType,
      startDate: leave.startDate,
      endDate: leave.endDate,
      reason: leave.reason || "",
    });
    setShowApplyModal(true);
  };

  // ✅ UPDATED: Submit leave with JWT (removed Basic Auth)
  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    const isEditMode = editingLeave !== null;

    if (!currentEmployeeId) {
      setErrorMsg("❌ Employee ID is not available. Please refresh the page.");
      return;
    }

    // Validate dates before submission
    const validation = validateLeaveDates(newLeave.startDate, newLeave.endDate);
    if (!validation.isValid) {
      setErrorMsg(validation.message);
      return;
    }

    // Additional check: explicitly prevent weekend leaves
    const start = new Date(newLeave.startDate);
    const end = new Date(newLeave.endDate);
    if (isWeekend(start) || isWeekend(end)) {
      setErrorMsg("❌ Leave applications are not allowed for weekends. Please select weekdays only.");
      return;
    }

    // Format dates to YYYY-MM-DD
    const formatDateFunc = (dateStr) => {
      const d = new Date(dateStr);
      return d.toISOString().split("T")[0];
    };

    // Build the leaveData object
    const leaveData = {
      leaveType: newLeave.leaveType,
      startDate: formatDateFunc(newLeave.startDate),
      endDate: formatDateFunc(newLeave.endDate),
      reason: newLeave.reason,
    };

    // Add employeeId only for new leave (not for edit)
    if (!isEditMode) {
      leaveData.employeeId = currentEmployeeId;
    }

    // Validate file presence for sick leave
    if (!isEditMode && newLeave.leaveType === "SICK" && !medicalDocument) {
      setErrorMsg("❌ Please upload a medical document for sick leave.");
      return;
    }

    console.log("📤 Sending leave request:", leaveData);

    try {
      let response;

      // Edit mode
      if (isEditMode) {
        // ✅ CHANGED: Use axiosInstance
        response = await axiosInstance.put(
          `http://localhost:8093/api/leaves/edit/${editingLeave.id}`,
          leaveData
        );
        console.log("✅ Leave request updated successfully!");
      } 
      else {
        // Check if this is a sick leave WITH a file
        const isSickWithFile = newLeave.leaveType === "SICK" && medicalDocument;

        if (isSickWithFile) {
          // Use FormData for sick leave with medical document
          const formData = new FormData();
          // Send leaveData as a JSON blob
          formData.append("leaveData", new Blob([JSON.stringify(leaveData)], { type: "application/json" }));
          // Append file
          formData.append("document", medicalDocument);

          response = await axiosInstance.post(
            "http://localhost:8093/api/leaves/apply",
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );
        } else {
          // For leaves without a file
          response = await axiosInstance.post(
            "http://localhost:8093/api/leaves/apply",
            leaveData
          );
        }

        console.log("✅ Leave apply response:", response.data);
        showLeaveSuccessPopup(leaveData);
        setSuccessMsg("✅ Leave application submitted successfully!");
      }

      // Reset form and close modal
      closeApplyLeaveModal();
      fetchData();
      fetchMyLeaveRequests();

    } catch (err) {
      console.error("❌ Error submitting leave:", err);
      const errorMessage = err.response?.data || err.message || "❌ Failed to submit leave request. Please try again.";
      setErrorMsg(errorMessage);
    }
  };

  // NEW: Open cancel confirmation modal
  const openCancelModal = (leave) => {
    setCancellingLeave(leave);
    setShowCancelModal(true);
  };

  // Prepare highlighted dates for calendar - NOW WITH BACKGROUND COLORS instead of icons
  const prepareHighlightedDates = () => {
    const highlights = {};

    // Mark holidays
    holidays.forEach((holiday) => {
      const dateStr = new Date(holiday).toDateString();
      highlights[dateStr] = {
        className: "holiday-day",
        backgroundColor: "#17a2b8", // Teal color for holidays
        tooltip: "Public Holiday 🎉"
      };
    });

    // Mark leave days
    leaves.forEach((leave) => {
      if (!leave.startDate || !leave.endDate) return;
      
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const current = new Date(start);

      while (current <= end) {
        const dateStr = current.toDateString();
        const status = leave.status ? leave.status.toLowerCase() : 'pending';

        let className = "";
        let backgroundColor = "";
        let tooltip = "";

        // Handle different leave types and statuses - NOW USING BACKGROUND COLORS
        switch (status) {
          case "approved":
            if (leave.leaveType === "WFH") {
              className = "wfh-approved";
              backgroundColor = "#6f42c1"; // Purple for WFH Approved
              tooltip = `Work From Home - Approved`;
            } else {
              className = "approved-leave";
              backgroundColor = "#28a745"; // Green for Approved Leave
              tooltip = `Approved ${getLeaveTypeDisplay(leave.leaveType)}`;
            }
            break;
            
          case "pending":
            if (leave.leaveType === "WFH") {
              className = "wfh-pending";
              backgroundColor = "#9b59b6"; // Lighter Purple for WFH Pending
              tooltip = `Work From Home - Pending Approval`;
            } else if (leave.leaveType === "PAID") {
              className = "paid-pending";
              backgroundColor = "#20c997"; // Teal/Green for Paid Pending
              tooltip = `Paid Leave - Pending Approval`;
            } else if (leave.leaveType === "SICK") {
              className = "sick-pending";
              backgroundColor = "#fd7e14"; // Orange for Sick Pending
              tooltip = `Sick Leave - Pending Approval`;
            } else if (leave.leaveType === "CASUAL") {
              className = "casual-pending";
              backgroundColor = "#e83e8c"; // Pink for Casual Pending
              tooltip = `Casual Leave - Pending Approval`;
            } else if (leave.leaveType === "UNPAID") {
              className = "unpaid-pending";
              backgroundColor = "#6c757d"; // Gray for Unpaid Pending
              tooltip = `Unpaid Leave - Pending Approval`;
            } else {
              className = "pending-leave";
              backgroundColor = "#ffc107"; // Yellow for general Pending
              tooltip = `Pending ${getLeaveTypeDisplay(leave.leaveType)}`;
            }
            break;
            
          case "rejected":
            if (leave.leaveType === "WFH") {
              className = "wfh-rejected";
              backgroundColor = "#dc3545"; // Red for WFH Rejected
              tooltip = `Work From Home - Rejected`;
            } else {
              className = "rejected-leave";
              backgroundColor = "#dc3545"; // Red for Rejected Leave
              tooltip = `Rejected ${getLeaveTypeDisplay(leave.leaveType)}`;
            }
            break;
            
          case "cancelled":
            if (leave.leaveType === "WFH") {
              className = "wfh-cancelled";
              backgroundColor = "#adb5bd"; // Gray for Cancelled
              tooltip = `Work From Home - Cancelled`;
            } else {
              className = "cancelled-leave";
              backgroundColor = "#adb5bd"; // Gray for Cancelled Leave
              tooltip = `Cancelled ${getLeaveTypeDisplay(leave.leaveType)}`;
            }
            break;
            
          default:
            className = "leave-day";
            backgroundColor = "#6c757d"; // Dark Gray
            tooltip = "Leave Day";
        }

        // For converted leaves, add special indicator
        if (leave.isConvertedFromPaid) {
          tooltip += " - Converted from Paid Leave";
        }

        highlights[dateStr] = { 
          className, 
          backgroundColor, 
          tooltip,
          hasIndicator: leave.isConvertedFromPaid || false
        };
        current.setDate(current.getDate() + 1);
      }
    });

    setHighlightedDates(highlights);
  };
  
  // Custom tile content for react-calendar - NOW WITH BACKGROUND COLORS
  const tileContent = ({ date, view }) => {
    if (view !== "month") {
      return null;
    }

    const dateStr = date.toDateString();
    const highlight = highlightedDates[dateStr];
    const today = new Date().toDateString();
    const isToday = dateStr === today;

    if (highlight) {
      return (
        <div 
          className={`calendar-tile-content ${highlight.className}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: highlight.backgroundColor,
            borderRadius: '8px',
            opacity: 0.85,
            zIndex: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title={highlight.tooltip}
          onMouseEnter={() => handleDateHover(date)}
          onMouseLeave={handleDateHoverOut}
        >
          {/* Optionally add a small dot or indicator for converted leaves */}
          {highlight.hasIndicator && (
            <span style={{
              position: 'absolute',
              bottom: '2px',
              right: '2px',
              fontSize: '8px'
            }}>
              ⚡
            </span>
          )}
        </div>
      );
    }

    return (
      <div 
        className="calendar-day-hover"
        onMouseEnter={() => handleDateHover(date)}
        onMouseLeave={handleDateHoverOut}
        style={{ height: '100%', width: '100%', position: 'relative', zIndex: 1 }}
      />
    );
  };
  
  // Custom tile className for additional styling
  const tileClassName = ({ date, view }) => {
    if (view !== "month") {
      return "";
    }

    const classes = [];
    const dateStr = date.toDateString();
    const today = new Date().toDateString();

    // Highlight today with blue background (this will override other colors)
    if (dateStr === today) {
      classes.push("today-highlight");
    }

    // Weekend styling - subtle background
    if (date.getDay() === 0 || date.getDay() === 6) {
      classes.push("weekend-day");
    }

    return classes.join(" ");
  };

  // Handle calendar date change
  const handleCalendarDateChange = (newDate) => {
    setCalendarDate(newDate);
  };

  // Handle tab change - specifically fetch leave requests when "My Requests" tab is clicked
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "myrequests" && currentEmployeeId) {
      fetchMyLeaveRequests();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
      
    // STRICTER VALIDATION: Don't allow weekend selection at all
    if (name === "startDate" || name === "endDate") {
      if (value && isWeekend(value)) {
        setErrorMsg("❌ Weekend dates are not allowed for leave applications. Please select a weekday.");
        return;
      }
      
      setNewLeave({ ...newLeave, [name]: value });
      setErrorMsg(""); // Clear error if valid date selected
    } else {
      setNewLeave({ ...newLeave, [name]: value });
      if (name === "leaveType" && value !== "SICK") {
        setMedicalDocument(null);
      }
    }
  };

  const handleMedicalDocumentChange = (e) => {
    const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    setMedicalDocument(e.target.files[0]);
  };

  // NEW: Calculate leave duration
  const calculateLeaveDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24) + 1;
    return Math.max(1, daysDiff);
  };

  // Helper function to format time
  const formatTime = (time) => {
    if (!time) return "-";
    // If time is in ISO format or contains T, extract the time part
    if (typeof time === 'string' && time.includes('T')) {
      return time.split('T')[1]?.substring(0, 5) || time;
    }
    return time;
  };

  // NEW: Get leave type display name
  const getLeaveTypeDisplay = (type) => {
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

  // NEW: Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // NEW: Check if leave can be edited (only pending leaves can be edited)
  const canEditLeave = (leave) => {
    return leave.status === 'PENDING';
  };

  // NEW: Check if leave can be cancelled (only pending and approved leaves can be cancelled)
  const canCancelLeave = (leave) => {
    return leave.status === 'PENDING' || leave.status === 'APPROVED';
  };

  // NEW: Get status display text with icons
  const getStatusDisplay = (status) => {
    switch (status) {
      case 'APPROVED':
        return { text: 'Approved', icon: '✅', class: 'text-success' };
      case 'PENDING':
        return { text: 'Pending Approval', icon: '⏳', class: 'text-warning' };
      case 'REJECTED':
        return { text: 'Rejected', icon: '❌', class: 'text-danger' };
      case 'CANCELLED':
        return { text: 'Cancelled', icon: '🗑️', class: 'text-secondary' };
      default:
        return { text: status, icon: '', class: 'text-muted' };
    }
  };

  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" style={{width: '3rem', height: '3rem'}} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 className="text-muted">Loading your leave dashboard...</h5>
          <p className="text-muted">Please wait while we fetch your data</p>
        </div>
      </div>
    );

  return (
    <div
      className="container-fluid py-4"
      style={{ 
        backgroundColor: "#f8f9fa", 
        minHeight: "100vh",
        overflow: "hidden"
      }}
    >
      {/* Global Messages */}
      {successMsg && (
        <div className="alert alert-success alert-dismissible fade show mb-4" role="alert">
          <strong>Success!</strong> {successMsg}
          <button type="button" className="btn-close" onClick={() => setSuccessMsg("")}></button>
        </div>
      )}
      
      {errorMsg && (
        <div className={`alert ${errorMsg.includes('⚠️') ? 'alert-warning' : 'alert-danger'} alert-dismissible fade show mb-4`} role="alert">
          <strong>{errorMsg.includes('⚠️') ? 'Heads Up!' : 'Oops!'}</strong> {errorMsg}
          <button type="button" className="btn-close" onClick={() => setErrorMsg("")}></button>
        </div>
      )}

      {/* 🟢 NEW: Success Popup Modal */}
      {showSuccessPopup && successPopupData && (
        <div 
          className="modal show d-block" 
          style={{backgroundColor: 'rgba(0,0,0,0.5)'}} 
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered modal-md">
            <div className="modal-content border-0 shadow-lg" style={{borderRadius: '15px', overflow: 'hidden'}}>
              <div className="modal-header bg-success text-white border-0 py-4">
                <div className="d-flex align-items-center w-100">
                  <div className="flex-grow-1 text-center">
                    <h4 className="modal-title fw-bold mb-0">
                      <i className="bi bi-check-circle-fill me-2"></i>
                      Leave Applied Successfully!
                    </h4>
                  </div>
                  <button 
                    type="button" 
                    className="btn-close btn-close-white position-absolute end-0 me-3" 
                    onClick={closeSuccessPopup}
                  ></button>
                </div>
              </div>
              <div className="modal-body text-center py-4">
                <div className="success-animation mb-4">
                  <div className="checkmark">✓</div>
                </div>
                
                <h5 className="text-success mb-3 fw-bold">Your leave request has been submitted!</h5>
                
                <div className="leave-details-card bg-light rounded-3 p-3 mb-4 mx-auto" style={{maxWidth: '400px'}}>
                  <div className="row text-start">
                    <div className="col-12 mb-2">
                      <strong>Leave Type:</strong> {successPopupData.leaveType}
                    </div>
                    <div className="col-12 mb-2">
                      <strong>Date Range:</strong> {successPopupData.startDate} to {successPopupData.endDate}
                    </div>
                    <div className="col-12 mb-2">
                      <strong>Duration:</strong> {successPopupData.duration} day(s)
                    </div>
                    <div className="col-12">
                      <strong>Applied On:</strong> {successPopupData.appliedDate}
                    </div>
                  </div>
                </div>

                <div className="alert alert-info border-0 mb-4 mx-auto" style={{maxWidth: '400px'}}>
                  <div className="d-flex align-items-center">
                    <i className="bi bi-info-circle me-2"></i>
                    <div className="small">
                      <strong>Next Steps:</strong> Your request is now pending approval. 
                      You'll be notified once it's reviewed by your manager.
                    </div>
                  </div>
                </div>

                <button 
                  className="btn btn-success btn-lg px-5 py-2 fw-semibold"
                  onClick={closeSuccessPopup}
                >
                  <i className="bi bi-check-lg me-2"></i>
                  Got It!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h1 className="fw-bold mb-2 text-primary">Leave Management System</h1>
              <p className="text-muted mb-0">
                Welcome back, <strong>{employeeName || 'Employee'}</strong>! Manage your leaves and track attendance.
              </p>
            </div>
            <div className="text-end">
              <div className="alert alert-light border">
                <small className="text-muted">
                  <strong>Employee ID:</strong> {currentEmployeeId} 
                  {!employeeId && <span className="text-warning"> (Using default ID)</span>}
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* REMOVED: Dashboard Stats Section */}

      {/* Navigation Tabs */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body py-3">
              <div className="nav nav-pills nav-fill">
                <button
                  className={`nav-link me-3 ${activeTab === "myrequests" ? "active bg-primary" : "text-muted"}`}
                  onClick={() => handleTabChange("myrequests")}
                >
                  <i className="bi bi-list-check me-2"></i>
                  My Leave Requests
                </button>
                <button
                  className={`nav-link me-3 ${activeTab === "calendar" ? "active bg-primary" : "text-muted"}`}
                  onClick={() => handleTabChange("calendar")}
                >
                  <i className="bi bi-calendar-month me-2"></i>
                  Leave Calendar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="row">
        <div className="col-12">
          {/* Calendar Tab */}
          {activeTab === "calendar" && (
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0 py-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-1 fw-bold text-dark">
                      📅 Leave & Attendance Calendar
                    </h5>
                    <p className="text-muted mb-0">
                      Visual overview of your leaves, holidays, and attendance patterns
                    </p>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    {/* Apply Leave Button - Replaced the legends */}
                    <button
                      className="btn btn-primary btn-lg px-4 py-2 fw-semibold"
                      onClick={openApplyLeaveModal}
                    >
                      📝 Apply for Leave
                    </button>
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => setCalendarDate(new Date())}
                    >
                      📍 Today
                    </button>
                  </div>
                </div>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-lg-8">
                    <div className="calendar-container bg-white rounded-3 p-4 border">
                      <Calendar
                        onChange={handleCalendarDateChange}
                        value={calendarDate}
                        tileContent={tileContent}
                        tileClassName={tileClassName}
                        className="custom-react-calendar"
                        showNeighboringMonth={false}
                        calendarType="gregory"
                      />
                    </div>
                    
                    {/* Legends moved below the calendar */}
                    <div className="mt-4">
                      <h6 className="fw-bold mb-3 text-dark">📊 Calendar Legend</h6>
                      <div className="row g-3">
                        <div className="col-md-12">
                          <div className="card border-0 bg-light h-100">
                            <div className="card-body py-3">
                              <h6 className="fw-semibold text-muted mb-3">Leave Status & Holidays:</h6>
                              <div className="row g-2">
                                <div className="col-md-6">
                                  {/* Approved Leave */}
                                  <div className="d-flex align-items-center mb-2">
                                    <div className="me-2" style={{width: '24px', height: '24px', backgroundColor: '#28a745', borderRadius: '4px'}}></div>
                                    <small className="text-muted">Approved Leave</small>
                                  </div>
                                  
                                  {/* Pending Leave */}
                                  <div className="d-flex align-items-center mb-2">
                                    <div className="me-2" style={{width: '24px', height: '24px', backgroundColor: '#ffc107', borderRadius: '4px'}}></div>
                                    <small className="text-muted">Pending Leave</small>
                                  </div>
                                  
                                  {/* Rejected Leave */}
                                  <div className="d-flex align-items-center mb-2">
                                    <div className="me-2" style={{width: '24px', height: '24px', backgroundColor: '#dc3545', borderRadius: '4px'}}></div>
                                    <small className="text-muted">Rejected Leave</small>
                                  </div>
                                  
                                  {/* Cancelled Leave */}
                                  <div className="d-flex align-items-center mb-2">
                                    <div className="me-2" style={{width: '24px', height: '24px', backgroundColor: '#6c757d', borderRadius: '4px'}}></div>
                                    <small className="text-muted">Cancelled Leave</small>
                                  </div>
                                </div>
                                
                                <div className="col-md-6">
                                  {/* WFH Approved */}
                                  <div className="d-flex align-items-center mb-2">
                                    <div className="me-2" style={{width: '24px', height: '24px', backgroundColor: '#6f42c1', borderRadius: '4px'}}></div>
                                    <small className="text-muted">WFH Approved</small>
                                  </div>
                                  
                                  {/* WFH Pending */}
                                  <div className="d-flex align-items-center mb-2">
                                    <div className="me-2" style={{width: '24px', height: '24px', backgroundColor: '#9b59b6', borderRadius: '4px'}}></div>
                                    <small className="text-muted">WFH Pending</small>
                                  </div>
                                  
                                  {/* Public Holiday */}
                                  <div className="d-flex align-items-center mb-2">
                                    <div className="me-2" style={{width: '24px', height: '24px', backgroundColor: '#17a2b8', borderRadius: '4px'}}></div>
                                    <small className="text-muted">Public Holiday</small>
                                  </div>
                                  
                                  {/* Paid Leave Pending */}
                                  <div className="d-flex align-items-center mb-2">
                                    <div className="me-2" style={{width: '24px', height: '24px', backgroundColor: '#20c997', borderRadius: '4px'}}></div>
                                    <small className="text-muted">Paid Leave Pending</small>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-4">
                    <div className="card border-0 h-100 bg-light">
                      <div className="card-body">
                        <h6 className="fw-bold mb-3 text-dark">📊 Quick Stats</h6>
                        
                        {/* Hovered Date Information */}
                        {hoveredDateInfo ? (
                          <div className="mb-4">
                            <small className="text-muted">Hovered Date:</small>
                            <p className="fw-semibold text-primary fs-5">
                              {hoveredDateInfo.dateStr}
                            </p>
                            
                            {/* Display different information based on date type */}
                            <div className={`alert ${
                              hoveredDateInfo.type === 'weekend' ? 'alert-secondary' :
                              hoveredDateInfo.type === 'holiday' ? 'alert-success' :
                              hoveredDateInfo.type === 'leave' ? 'alert-info' :
                              hoveredDateInfo.type === 'absent' ? 'alert-danger' :
                              hoveredDateInfo.type === 'attendance' ? 'alert-primary' :
                              'alert-light'
                            } mb-3`}>
                              <strong>
                                {hoveredDateInfo.type === 'weekend' && '🏖️ Weekend'}
                                {hoveredDateInfo.type === 'holiday' && '🎉 Public Holiday'}
                                {hoveredDateInfo.type === 'leave' && '📅 Leave Day'}
                                {hoveredDateInfo.type === 'absent' && '❌ Absent'}
                                {hoveredDateInfo.type === 'attendance' && '📊 Attendance Record'}
                                {hoveredDateInfo.type === 'normal' && '📅 Working Day'}
                              </strong>
                              <div className="mt-1 small">
                                {hoveredDateInfo.message}
                                {hoveredDateInfo.type === 'leave' && hoveredDateInfo.leave && (
                                  <div className="mt-1">
                                    <strong>Type:</strong> {getLeaveTypeDisplay(hoveredDateInfo.leave.leaveType)}
                                    <br />
                                    <strong>Status:</strong> {hoveredDateInfo.leave.status}
                                    {hoveredDateInfo.leave.reason && (
                                      <>
                                        <br />
                                        <strong>Reason:</strong> {hoveredDateInfo.leave.reason}
                                      </>
                                    )}
                                  </div>
                                )}
                                {hoveredDateInfo.type === 'attendance' && hoveredDateInfo.attendance && (
                                  <div className="mt-1">
                                    {hoveredDateInfo.attendance.inTime && (
                                      <div><strong>In Time:</strong> {formatTime(hoveredDateInfo.attendance.inTime)}</div>
                                    )}
                                    {hoveredDateInfo.attendance.outTime && (
                                      <div><strong>Out Time:</strong> {formatTime(hoveredDateInfo.attendance.outTime)}</div>
                                    )}
                                    {hoveredDateInfo.attendance.status && (
                                      <div><strong>Status:</strong> {hoveredDateInfo.attendance.status}</div>
                                    )}
                                    {hoveredDateInfo.attendance.workHours && (
                                      <div><strong>Work Hours:</strong> {hoveredDateInfo.attendance.workHours.toFixed(1)}h</div>
                                    )}
                                    {hoveredDateInfo.attendance.remark && (
                                      <div><strong>Remark:</strong> {hoveredDateInfo.attendance.remark}</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="mb-4">
                            <small className="text-muted">Selected Date:</small>
                            <p className="fw-semibold text-primary fs-5">
                              {calendarDate.toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </p>
                            <div className="alert alert-light">
                              <small className="text-muted">
                                👆 Hover over any date in the calendar to see detailed information about leaves, attendance, weekends, and holidays.
                              </small>
                            </div>
                          </div>
                        )}
                        
                        {/* Paid Leave Usage */}
                        <div className="mb-4">
                          <small className="text-muted">Paid Leaves This Month:</small>
                          <div className="mt-2">
                            <div className="progress mb-2" style={{height: '24px', borderRadius: '12px'}}>
                              <div 
                                className={`progress-bar ${paidLeaveUsage.remaining === 0 ? 'bg-danger' : paidLeaveUsage.used > 0 ? 'bg-warning' : 'bg-success'}`}
                                style={{width: `${(paidLeaveUsage.used / paidLeaveUsage.limit) * 100}%`, borderRadius: '12px'}}
                                role="progressbar"
                              >
                                {paidLeaveUsage.used}/{paidLeaveUsage.limit}
                              </div>
                            </div>
                            <small className={`fw-semibold ${paidLeaveUsage.remaining === 0 ? 'text-danger' : 'text-muted'}`}>
                              {paidLeaveUsage.remaining === 0 ? '❌ No paid leaves remaining' : `✅ ${paidLeaveUsage.remaining} paid leave(s) remaining`}
                            </small>
                          </div>
                        </div>

                        <div className="mb-4">
                          <small className="text-muted">Your Leave Balance:</small>
                          <div className="mt-2">
                            {Object.entries(leaveBalance).map(([type, balance]) => (
                              <div key={type} className="d-flex justify-content-between align-items-center mb-1">
                                <span className="small">{getLeaveTypeDisplay(type)}:</span>
                                <span className={`badge ${balance > 0 ? 'bg-success' : 'bg-secondary'}`}>
                                  {balance} day(s)
                                </span>
                              </div>
                            ))}
                            {Object.keys(leaveBalance).length === 0 && (
                              <p className="text-muted small mb-0">No leave balance data available</p>
                            )}
                          </div>
                        </div>
                        
                        {/* Pending Leaves Breakdown */}
                        <div className="mb-4">
                          <small className="text-muted">Pending Leaves Breakdown:</small>
                          <div className="mt-2">
                            <div className="d-flex justify-content-between mb-1">
                              <span className="small">Regular Pending:</span>
                              <strong className="text-warning">
                                {leaves.filter((l) => l.status === "PENDING" && l.leaveType !== "WFH").length}
                              </strong>
                            </div>
                            <div className="d-flex justify-content-between mb-1">
                              <span className="small">WFH Pending:</span>
                              <strong className="text-purple">
                                {leaves.filter((l) => l.status === "PENDING" && l.leaveType === "WFH").length}
                              </strong>
                            </div>
                            <div className="d-flex justify-content-between">
                              <span className="small">Total Pending:</span>
                              <strong className="text-warning">
                                {leaves.filter((l) => l.status === "PENDING").length}
                              </strong>
                            </div>
                          </div>
                        </div>
                        
                        <button
                          className="btn btn-outline-primary w-100 mt-3 py-2 fw-semibold"
                          onClick={openApplyLeaveModal}
                        >
                          📝 Apply for Leave
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* My Requests Tab */}
          {activeTab === "myrequests" && (
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0 py-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-1 fw-bold text-dark">📋 My Leave Requests</h5>
                    <p className="text-muted mb-0">
                      View, manage, and track your leave applications
                    </p>
                  </div>
                  <button 
                    className="btn btn-primary btn-lg"
                    onClick={openApplyLeaveModal}
                  >
                    <i className="bi bi-plus-circle me-2"></i>
                    New Leave Request
                  </button>
                </div>
              </div>
              <div className="card-body p-0">
                {leaves.length === 0 ? (
                  <div className="text-center text-muted py-5">
                    <div className="display-1 text-muted mb-3">📭</div>
                    <h5 className="mb-2">No Leave Requests Found</h5>
                    <p className="mb-4">You haven't applied for any leaves yet.</p>
                    <button 
                      className="btn btn-primary btn-lg"
                      onClick={openApplyLeaveModal}
                    >
                      <i className="bi bi-plus-circle me-2"></i>
                      Apply for Your First Leave
                    </button>
                  </div>
                ) : (
                  <div className="table-responsive" style={{ overflowX: 'auto', maxWidth: '100%' }}>
                    <table className="table table-hover align-middle mb-0" style={{ minWidth: '800px', tableLayout: 'fixed' }}>
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: '12%' }}>Leave Type</th>
                          <th style={{ width: '15%' }}>Date Range</th>
                          <th style={{ width: '8%' }}>Duration</th>
                          <th style={{ width: '20%' }}>Reason</th>
                          <th style={{ width: '15%' }}>Status</th>
                          <th style={{ width: '15%' }}>Applied On</th>
                          <th style={{ width: '15%' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaves.map((leave) => {
                          const statusInfo = getStatusDisplay(leave.status);
                          return (
                            <tr key={leave.id} className={leave.status === 'APPROVED' ? 'table-success' : leave.status === 'PENDING' ? 'table-warning' : ''}>
                              <td>
                                <div className="d-flex align-items-center flex-wrap">
                                  <span className={`badge ${
                                    leave.leaveType === 'WFH' ? 'bg-primary' : 
                                    leave.leaveType === 'PAID' ? 'bg-success' :
                                    leave.leaveType === 'SICK' ? 'bg-warning text-dark' :
                                    leave.leaveType === 'CASUAL' ? 'bg-info' : 'bg-secondary'
                                  } me-2 mb-1`}>
                                    {getLeaveTypeDisplay(leave.leaveType)}
                                  </span>
                                  {leave.isConvertedFromPaid && (
                                    <span className="badge bg-warning text-dark mb-1" title="Automatically converted from PAID leave">
                                      ⚡ Converted
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td>
                                <div className="small">
                                  <div className="fw-semibold text-truncate" title={formatDate(leave.startDate)}>
                                    {formatDate(leave.startDate)}
                                  </div>
                                  <div className="text-muted text-truncate" title={formatDate(leave.endDate)}>
                                    to {formatDate(leave.endDate)}
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className="badge bg-light text-dark border">
                                  {calculateLeaveDuration(leave.startDate, leave.endDate)} day(s)
                                </span>
                              </td>
                              <td>
                                <div className="small text-muted">
                                  <div className="text-truncate" title={leave.reason}>
                                    {leave.reason || <em className="text-muted">No reason provided</em>}
                                  </div>
                                  {leave.conversionReason && (
                                    <div className="text-warning small mt-1 text-truncate" title={leave.conversionReason}>
                                      <i className="bi bi-info-circle me-1"></i>
                                      {leave.conversionReason}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td>
                                <div>
                                  <span className={`badge ${statusInfo.class} border-0`}>
                                    {statusInfo.icon} {statusInfo.text}
                                  </span>
                                  {leave.approvedBy && leave.status === 'REJECTED' && (
                                    <div className="small text-muted mt-1 text-truncate" title={`By: ${leave.approvedByName || 'Manager'}`}>
                                      By: {leave.approvedByName || 'Manager'}
                                    </div>
                                  )}
                                  {leave.approvedBy && leave.status === 'APPROVED' && (
                                    <div className="small text-success mt-1 text-truncate" title={`Approved by: ${leave.approvedByName || 'Manager'}`}>
                                      Approved by: {leave.approvedByName || 'Manager'}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td>
                                <div className="small">
                                  <div className="text-truncate" title={formatDate(leave.appliedOn)}>
                                    {formatDate(leave.appliedOn)}
                                  </div>
                                  {leave.approvedOn && (
                                    <div className="text-muted text-truncate" title={`${leave.status === 'APPROVED' ? 'Approved: ' : 'Rejected: '}${formatDate(leave.approvedOn)}`}>
                                      {leave.status === 'APPROVED' ? 'Approved: ' : 'Rejected: '}
                                      {formatDate(leave.approvedOn)}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td>
                                <div className="btn-group btn-group-sm flex-wrap">
                                  {/* Edit Button - Only for pending leaves */}
                                  {canEditLeave(leave) && (
                                    <button
                                      className="btn btn-outline-primary btn-sm mb-1"
                                      onClick={() => handleEditLeave(leave)}
                                      title="Edit this leave request"
                                    >
                                      <i className="bi bi-pencil"></i> Edit
                                    </button>
                                  )}
                                  
                                  {/* Cancel Button - Only for pending and approved leaves */}
                                  {canCancelLeave(leave) && (
                                    <button
                                      className="btn btn-outline-danger btn-sm mb-1"
                                      onClick={() => openCancelModal(leave)}
                                      title="Cancel this leave request"
                                    >
                                      <i className="bi bi-x-circle"></i> Cancel
                                    </button>
                                  )}
                                  
                                  {/* View Only - For rejected or cancelled leaves */}
                                  {(leave.status === 'REJECTED' || leave.status === 'CANCELLED') && (
                                    <span className="text-muted small">No actions</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div 
          className="modal show d-block" 
          style={{backgroundColor: 'rgba(0,0,0,0.5)'}} 
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-primary text-white border-0">
                <h5 className="modal-title fw-bold">
                  {editingLeave ? "✏️ Edit Leave Request" : "📝 Apply for Leave"}
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={closeApplyLeaveModal}
                ></button>
              </div>
              <div className="modal-body" style={{maxHeight: '70vh', overflowY: 'auto'}}>
                {/* Weekend Information Alert */}
                <div className="alert alert-info mb-4">
                  <div className="d-flex align-items-center">
                    <i className="bi bi-calendar-week me-2"></i>
                    <div>
                      <strong>📅 Weekday Leave Policy</strong><br/>
                      Leave applications are only allowed for weekdays (Monday to Friday). 
                      Weekend dates are strictly not allowed for leave applications.
                    </div>
                  </div>
                </div>

                {/* Form-level messages */}
                {errorMsg && (
                  <div className={`alert ${errorMsg.includes('⚠️') ? 'alert-warning' : 'alert-danger'} mb-4`}>
                    <div className="d-flex align-items-center">
                      <i className={`bi ${errorMsg.includes('⚠️') ? 'bi-exclamation-triangle' : 'bi-x-circle'} me-2`}></i>
                      <div>
                        <strong>{errorMsg.includes('⚠️') ? 'Heads Up!' : 'Please check your input:'}</strong>
                        <div className="mt-1">{errorMsg.replace(/^[^ ]+ /, '')}</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Leave Type Specific Information */}
                {newLeave.leaveType === "PAID" && paidLeaveUsage.remaining === 0 && (
                  <div className="alert alert-warning mb-4">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      <div>
                        <strong>⚠️ No Paid Leaves Remaining This Month</strong><br/>
                        You have used all {paidLeaveUsage.limit} paid leaves this month. 
                        Any additional leave will be automatically converted to unpaid leave and require manager approval.
                      </div>
                    </div>
                  </div>
                )}
                
                {newLeave.leaveType === "PAID" && paidLeaveUsage.remaining > 0 && (
                  <div className="alert alert-info mb-4">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-info-circle me-2"></i>
                      <div>
                        <strong>📊 Paid Leave Status</strong><br/>
                        You have used {paidLeaveUsage.used} of {paidLeaveUsage.limit} paid leaves this month. 
                        <strong> {paidLeaveUsage.remaining} paid leave(s) remaining.</strong>
                      </div>
                    </div>
                  </div>
                )}

                {newLeave.leaveType === "WFH" && (
                  <div className="alert alert-info mb-4">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-house me-2"></i>
                      <div>
                        <strong>🏠 Work From Home Information</strong><br/>
                        WFH requests require manager approval and count as present days for salary calculation. 
                        Please ensure you have proper internet connectivity and remain available during work hours.
                      </div>
                    </div>
                  </div>
                )}

                {newLeave.leaveType === "UNPAID" && (
                  <div className="alert alert-warning mb-4">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-currency-dollar me-2"></i>
                      <div>
                        <strong>💡 Unpaid Leave Notice</strong><br/>
                        Unpaid leaves do not affect your leave balance but will result in salary deduction for the leave days.
                        These require manager approval.
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmitLeave}>
                  <div className="row">
                    <div className="col-md-6 mb-4">
                      <label className="form-label fw-semibold text-dark">
                        <i className="bi bi-tag me-2 text-primary"></i>
                        Leave Type
                      </label>
                      <select
                        className="form-select form-select-lg"
                        name="leaveType"
                        value={newLeave.leaveType}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="SICK">🤒 Sick Leave</option>
                        <option value="PAID">💰 Paid Leave</option>
                        <option value="CASUAL">😊 Casual Leave</option>
                        <option value="UNPAID">💸 Unpaid Leave</option>
                        <option value="WFH">🏠 Work From Home (WFH)</option>
                      </select>
                      <div className="form-text">
                        Choose the appropriate leave type for your situation
                      </div>
                    </div>
                    <div className="col-md-6 mb-4">
                      <label className="form-label fw-semibold text-dark">
                        <i className="bi bi-calendar-plus me-2 text-primary"></i>
                        Start Date
                      </label>
                      <input
                        type="date"
                        className="form-control form-control-lg"
                        name="startDate"
                        value={newLeave.startDate}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                      <div className="form-text">
                        Select the first day of your leave (Weekdays only)
                        {newLeave.startDate && isWeekend(newLeave.startDate) && (
                          <span className="text-danger ms-1">
                            <i className="bi bi-exclamation-triangle"></i> Weekends not allowed
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="col-md-6 mb-4">
                      <label className="form-label fw-semibold text-dark">
                        <i className="bi bi-calendar-minus me-2 text-primary"></i>
                        End Date
                      </label>
                      <input
                        type="date"
                        className="form-control form-control-lg"
                        name="endDate"
                        value={newLeave.endDate}
                        onChange={handleInputChange}
                        min={newLeave.startDate || new Date().toISOString().split('T')[0]}
                        required
                      />
                      <div className="form-text">
                        Select the last day of your leave (Weekdays only)
                        {newLeave.endDate && isWeekend(newLeave.endDate) && (
                          <span className="text-danger ms-1">
                            <i className="bi bi-exclamation-triangle"></i> Weekends not allowed
                          </span>
                        )}
                      </div>
                      {newLeave.startDate && newLeave.endDate && (
                        <div className="mt-2">
                          <span className="badge bg-primary">
                            📅 {calculateLeaveDuration(newLeave.startDate, newLeave.endDate)} day(s) selected
                          </span>
                          {calculateLeaveDuration(newLeave.startDate, newLeave.endDate) > 1 && (
                            <div className="small text-muted mt-1">
                              From {formatDate(newLeave.startDate)} to {formatDate(newLeave.endDate)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="col-md-6 mb-4">
                      <label className="form-label fw-semibold text-dark">
                        <i className="bi bi-chat-text me-2 text-primary"></i>
                        Reason for Leave
                      </label>
                      <textarea
                        className="form-control form-control-lg"
                        name="reason"
                        value={newLeave.reason}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="Please provide a brief reason for your leave request..."
                        required
                        style={{resize: 'vertical'}}
                      />
                      <div className="form-text">
                        Provide clear details to help with the approval process
                      </div>
                    </div>
                    {newLeave.leaveType === "SICK" && (
                      <div className="col-md-6 mb-4">
                        <label className="form-label fw-semibold text-dark">
                          <i className="bi bi-file-earmark-arrow-up me-2 text-primary"></i>
                          Upload Medical Document
                        </label>
                        <input
                          type="file"
                          className="form-control form-control-lg"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onChange={handleMedicalDocumentChange}
                          required={newLeave.leaveType === "SICK"}
                        />
                        <div className="form-text">
                          Required for sick leave applications.
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="d-flex gap-3 justify-content-end border-top pt-4">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-lg px-4"
                      onClick={closeApplyLeaveModal}
                    >
                      <i className="bi bi-x-circle me-2"></i>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary btn-lg px-4">
                      {editingLeave ? (
                        <>
                          <i className="bi bi-check-circle me-2"></i>
                          Update Leave Request
                        </>
                      ) : (
                        <>
                          <i className="bi bi-send me-2"></i>
                          Submit Leave Application
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && cancellingLeave && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-warning text-dark border-0">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Confirm Leave Cancellation
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancellingLeave(null);
                  }}
                ></button>
              </div>
              <div className="modal-body py-4">
                <div className="alert alert-warning border-0 mb-4">
                  <strong>⚠️ Are you sure you want to cancel this leave request?</strong>
                  <p className="mb-0 mt-2">This action cannot be undone.</p>
                </div>
                
                <div className="card border-0 bg-light">
                  <div className="card-body">
                    <strong>Leave Details:</strong>
                    <div className="mt-2">
                      <div className="row small">
                        <div className="col-6">
                          <span className="text-muted">Type:</span><br/>
                          <strong>{getLeaveTypeDisplay(cancellingLeave.leaveType)}</strong>
                        </div>
                        <div className="col-6">
                          <span className="text-muted">Duration:</span><br/>
                          <strong>{calculateLeaveDuration(cancellingLeave.startDate, cancellingLeave.endDate)} day(s)</strong>
                        </div>
                      </div>
                      <div className="row small mt-2">
                        <div className="col-12">
                          <span className="text-muted">Dates:</span><br/>
                          <strong>{formatDate(cancellingLeave.startDate)} to {formatDate(cancellingLeave.endDate)}</strong>
                        </div>
                      </div>
                      {cancellingLeave.reason && (
                        <div className="row small mt-2">
                          <div className="col-12">
                            <span className="text-muted">Reason:</span><br/>
                            <em>{cancellingLeave.reason}</em>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <p className="text-muted small mt-3">
                  <i className="bi bi-info-circle me-1"></i>
                  If this leave was already approved, your leave balance will be updated accordingly.
                </p>
              </div>
              <div className="modal-footer border-0">
                <button 
                  type="button" 
                  className="btn btn-outline-secondary btn-lg" 
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancellingLeave(null);
                  }}
                >
                  <i className="bi bi-arrow-left me-2"></i>
                  Keep Leave
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger btn-lg" 
                  onClick={() => handleCancelLeave(cancellingLeave.id)}
                >
                  <i className="bi bi-x-circle me-2"></i>
                  Yes, Cancel Leave
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom CSS for calendar and enhancements */}
      <style>
        {`
          .calendar-container {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          
          .custom-react-calendar {
            width: 100%;
            border: none;
            font-family: inherit;
            font-size: 1rem;
          }
          
          /* Calendar tile base styling */
          .react-calendar__tile {
            position: relative;
            height: 70px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            margin: 2px;
            transition: all 0.2s ease;
            overflow: hidden;
            background-color: white;
          }
          
          /* Date number styling - make it visible over colored backgrounds */
          .react-calendar__tile abbr {
            position: relative;
            z-index: 3;
            font-weight: 500;
            font-size: 1rem;
          }
          
          /* Hover effect */
          .react-calendar__tile:hover {
            transform: scale(1.02);
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            z-index: 10;
          }
          
          /* Calendar badge container for background colors */
          .calendar-badge {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            height: 100%;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1;
          }
          
          .calendar-day-hover {
            cursor: pointer;
            position: relative;
            z-index: 2;
          }
          
          /* ==================== */
          /* BACKGROUND COLORS FOR LEAVE TYPES */
          /* ==================== */
          
          /* Approved Leave - Green Background */
          .approved-leave {
            background-color: #28a745 !important;
          }
          
          /* Approved WFH - Purple Background */
          .wfh-approved {
            background-color: #6f42c1 !important;
          }
          
          /* Pending Leave - Yellow/Orange Background */
          .pending-leave {
            background-color: #ffc107 !important;
          }
          
          /* Pending WFH - Light Purple Background */
          .wfh-pending {
            background-color: #9b59b6 !important;
          }
          
          /* Pending Paid Leave - Teal Green Background */
          .paid-pending {
            background-color: #20c997 !important;
          }
          
          /* Pending Sick Leave - Orange Background */
          .sick-pending {
            background-color: #fd7e14 !important;
          }
          
          /* Pending Casual Leave - Pink Background */
          .casual-pending {
            background-color: #e83e8c !important;
          }
          
          /* Pending Unpaid Leave - Gray Background */
          .unpaid-pending {
            background-color: #6c757d !important;
          }
          
          /* Rejected Leave - Red Background */
          .rejected-leave {
            background-color: #dc3545 !important;
          }
          
          /* Rejected WFH - Red Background */
          .wfh-rejected {
            background-color: #dc3545 !important;
          }
          
          /* Cancelled Leave - Dark Gray Background */
          .cancelled-leave {
            background-color: #6c757d !important;
          }
          
          /* Cancelled WFH - Dark Gray Background */
          .wfh-cancelled {
            background-color: #6c757d !important;
          }
          
          /* Holiday - Teal Background */
          .holiday-day {
            background-color: #17a2b8 !important;
          }
          
          /* ==================== */
          /* TEXT COLORS FOR DATE NUMBERS */
          /* ==================== */
          
          /* White text for dark backgrounds */
          .approved-leave abbr,
          .wfh-approved abbr,
          .wfh-pending abbr,
          .paid-pending abbr,
          .sick-pending abbr,
          .casual-pending abbr,
          .unpaid-pending abbr,
          .rejected-leave abbr,
          .wfh-rejected abbr,
          .cancelled-leave abbr,
          .wfh-cancelled abbr,
          .holiday-day abbr {
            color: white !important;
            font-weight: bold !important;
          }
          
          /* Dark text for yellow/orange backgrounds */
          .pending-leave abbr {
            color: #212529 !important;
            font-weight: bold !important;
          }
          
          /* ==================== */
          /* TODAY HIGHLIGHT - BLUE BACKGROUND (PRIORITY) */
          /* ==================== */
          
          .today-highlight {
            background-color: #007bff !important;
            border: none !important;
            position: relative;
          }
          
          .today-highlight abbr {
            color: white !important;
            font-weight: bold !important;
            z-index: 3;
            position: relative;
          }
          
          /* Override for today when it has special leave/holiday - blend effect */
          .today-highlight .calendar-badge {
            opacity: 0.7 !important;
          }
          
          /* ==================== */
          /* WEEKEND DAYS */
          /* ==================== */
          
          .weekend-day {
            background-color: #f8f9fa;
          }
          
          .weekend-day abbr {
            color: #6c757d;
          }
          
          /* ==================== */
          /* ACTIVE SELECTED DATE */
          /* ==================== */
          
          .react-calendar__tile--active {
            background-color: #0056b3 !important;
            color: white !important;
            font-weight: bold;
            border: 2px solid #003d80 !important;
          }
          
          .react-calendar__tile--active abbr {
            color: white !important;
          }
          
          .react-calendar__tile--active .calendar-badge {
            opacity: 0.8;
          }
          
          /* ==================== */
          /* NAVIGATION BUTTONS */
          /* ==================== */
          
          .react-calendar__navigation button {
            font-size: 1.1rem;
            font-weight: 600;
            padding: 0.5rem 1rem;
            border-radius: 8px;
          }
          
          .react-calendar__navigation button:hover {
            background-color: #e3f2fd;
          }
          
          .react-calendar__navigation {
            margin-bottom: 1rem;
          }
          
          /* ==================== */
          /* WEEKDAY HEADERS */
          /* ==================== */
          
          .react-calendar__month-view__weekdays {
            font-weight: 600;
            color: #495057;
            margin-bottom: 0.5rem;
            text-transform: uppercase;
            font-size: 0.85rem;
          }
          
          .react-calendar__month-view__weekdays abbr {
            text-decoration: none;
            font-weight: 600;
          }

          .react-calendar__month-view__days {
            display: flex !important;
            flex-wrap: wrap !important;
          }
          
          /* ==================== */
          /* NEIGHBORING MONTH DAYS */
          /* ==================== */
          
          .react-calendar__month-view__days__day--neighboringMonth {
            color: #adb5bd;
          }
          
          .react-calendar__month-view__days__day--neighboringMonth abbr {
            color: #adb5bd;
          }
          
          /* ==================== */
          /* CUSTOM UTILITY CLASSES */
          /* ==================== */
          
          .bg-purple {
            background-color: #6f42c1 !important;
          }
          
          .text-purple {
            color: #6f42c1 !important;
          }
          
          /* ==================== */
          /* SUCCESS POPUP ANIMATION */
          /* ==================== */
          
          .success-animation {
            margin: 0 auto;
          }
          
          .checkmark {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            display: block;
            stroke-width: 2;
            stroke: #4bb71b;
            stroke-miterlimit: 10;
            box-shadow: inset 0px 0px 0px #4bb71b;
            animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s both;
            position: relative;
            margin: 0 auto;
          }
          
          .checkmark__circle {
            stroke-dasharray: 166;
            stroke-dashoffset: 166;
            stroke-width: 2;
            stroke-miterlimit: 10;
            stroke: #4bb71b;
            fill: #fff;
            animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
          }
          
          .checkmark__check {
            transform-origin: 50% 50%;
            stroke-dasharray: 48;
            stroke-dashoffset: 48;
            animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
          }
          
          @keyframes stroke {
            100% {
              stroke-dashoffset: 0;
            }
          }
          
          @keyframes scale {
            0%, 100% {
              transform: none;
            }
            50% {
              transform: scale3d(1.1, 1.1, 1);
            }
          }
          
          @keyframes fill {
            100% {
              box-shadow: inset 0px 0px 0px 30px #4bb71b;
            }
          }
          
          /* ==================== */
          /* GRADIENT BACKGROUNDS */
          /* ==================== */
          
          .bg-gradient-primary {
            background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
          }
          
          .bg-gradient-warning {
            background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%);
          }
          
          .bg-gradient-info {
            background: linear-gradient(135deg, #17a2b8 0%, #117a8b 100%);
          }
          
          .bg-gradient-success {
            background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%);
          }
          
          /* ==================== */
          /* BUTTON STYLES */
          /* ==================== */
          
          .btn-primary {
            background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
            border: none;
            border-radius: 8px;
            font-weight: 600;
          }
          
          .btn-primary:hover {
            background: linear-gradient(135deg, #0056b3 0%, #004085 100%);
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0,123,255,0.3);
          }
          
          /* ==================== */
          /* TABLE ENHANCEMENTS */
          /* ==================== */
          
          .table-hover tbody tr:hover {
            background-color: rgba(0,123,255,0.05);
            transform: translateX(4px);
            transition: all 0.2s ease;
          }
          
          /* ==================== */
          /* MODAL ENHANCEMENTS */
          /* ==================== */
          
          .modal-content {
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          }
          
          /* ==================== */
          /* FORM ENHANCEMENTS */
          /* ==================== */
          
          .form-control, .form-select {
            border-radius: 8px;
            border: 2px solid #e9ecef;
            transition: all 0.2s ease;
          }
          
          .form-control:focus, .form-select:focus {
            border-color: #007bff;
            box-shadow: 0 0 0 0.2rem rgba(0,123,255,0.25);
          }
          
          /* ==================== */
          /* BADGE ENHANCEMENTS */
          /* ==================== */
          
          .badge {
            border-radius: 6px;
            font-weight: 500;
          }
          
          /* ==================== */
          /* ALERT ENHANCEMENTS */
          /* ==================== */
          
          .alert {
            border-radius: 8px;
            border: none;
          }
          
          /* ==================== */
          /* SMALL INDICATOR FOR CONVERTED LEAVES */
          /* ==================== */
          
          .converted-leave-indicator {
            position: absolute;
            bottom: 2px;
            right: 2px;
            font-size: 8px;
            z-index: 4;
          }
          
          /* Legend color boxes animation */
          .legend-color-box {
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }

          .legend-color-box:hover {
            transform: scale(1.05);
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }  
        `}
      </style>
    </div>
  );
};

export default EmployeeLeavePage;