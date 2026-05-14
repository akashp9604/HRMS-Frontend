import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Profile() {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    address: "",
    designation: "",
    department: ""
  });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateMessage, setUpdateMessage] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const authData = localStorage.getItem("authUser");
      if (!authData) {
        throw new Error("Authentication data not found");
      }

      const { username, password } = JSON.parse(authData);
      const authHeader = "Basic " + btoa(username + ":" + password);

      const response = await fetch("http://localhost:8088/api/employees/profile", {
        method: "GET",
        headers: {
          "Authorization": authHeader,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }

      const profileData = await response.json();
      setProfile(profileData);
      setFormData({
        name: profileData.name || "",
        phoneNumber: profileData.phoneNumber || "",
        address: profileData.address || "",
        designation: profileData.designation || "",
        department: profileData.department || ""
      });
    } catch (err) {
      setError(err.message);
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setUpdateMessage("");
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setFormData({
      name: profile.name || "",
      phoneNumber: profile.phoneNumber || "",
      address: profile.address || "",
      designation: profile.designation || "",
      department: profile.department || ""
    });
    setUpdateMessage("");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setUpdateLoading(true);
      setUpdateMessage("");

      const authData = localStorage.getItem("authUser");
      if (!authData) {
        throw new Error("Authentication data not found");
      }

      const { username, password } = JSON.parse(authData);
      const authHeader = "Basic " + btoa(username + ":" + password);

      const response = await fetch("http://localhost:8088/api/employees/profile", {
        method: "PUT",
        headers: {
          "Authorization": authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update profile: ${response.status} - ${errorText}`);
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setIsEditing(false);
      setUpdateMessage("Profile updated successfully!");
      
      setTimeout(() => {
        setUpdateMessage("");
      }, 3000);

    } catch (err) {
      setUpdateMessage(`Error: ${err.message}`);
      console.error("Error updating profile:", err);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUpdateMessage("Error: Please select a valid image file");
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setUpdateMessage("Error: Image size should be less than 5MB");
      return;
    }

    try {
      setImageUploading(true);
      setUpdateMessage("");
      setImageError(false);

      const authData = localStorage.getItem("authUser");
      if (!authData) {
        throw new Error("Authentication data not found");
      }

      const { username, password } = JSON.parse(authData);
      const authHeader = "Basic " + btoa(username + ":" + password);

      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("http://localhost:8088/api/employees/profile/image", {
        method: "POST",
        headers: {
          "Authorization": authHeader,
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to upload image: ${response.status} - ${errorText}`);
      }

      const result = await response.text();
      setUpdateMessage("Profile image uploaded successfully!");
      
      // Refresh profile to get updated image path
      await fetchProfile();
      
      setTimeout(() => {
        setUpdateMessage("");
      }, 3000);

    } catch (err) {
      setUpdateMessage(`Error: ${err.message}`);
      console.error("Error uploading image:", err);
    } finally {
      setImageUploading(false);
      // Clear file input
      e.target.value = '';
    }
  };

  const getProfileImageUrl = () => {
    if (!profile?.profileImage) {
      return null;
    }
    
    // If it's a full URL or relative path, construct the full URL
    if (profile.profileImage.startsWith('http')) {
      return profile.profileImage;
    } else {
      // For local file paths, create a URL to fetch the image
      return `http://localhost:8088/api/employees/profile/image/${profile.id}`;
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  // Loading state
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "50vh" }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          <h4 className="alert-heading">Error</h4>
          <p>{error}</p>
          <button onClick={fetchProfile} className="btn btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const profileImageUrl = getProfileImageUrl();
  const showAvatar = !profileImageUrl || imageError;

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          {/* Profile Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="text-primary">Employee Profile</h2>
            <div>
              <span 
                className={`badge ${
                  profile.role === "ADMIN" ? "bg-danger" : 
                  profile.role === "HR" ? "bg-warning" : "bg-success"
                } me-2`}
              >
                {profile.role}
              </span>
              {!isEditing && (
                <button 
                  onClick={handleEditClick}
                  className="btn btn-primary btn-sm"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Update Message */}
          {updateMessage && (
            <div className={`alert ${updateMessage.includes("Error") ? 'alert-danger' : 'alert-success'} alert-dismissible fade show`}>
              {updateMessage}
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setUpdateMessage("")}
              ></button>
            </div>
          )}

          {/* Profile Card */}
          <div className="card shadow-sm">
            <div className="card-body">
              {/* Profile Image Section - Only ONE circle */}
              <div className="text-center mb-4">
                <div className="position-relative d-inline-block">
                  {/* Only show ONE element - either image or avatar */}
                  {!showAvatar ? (
                    <img 
                      src={profileImageUrl}
                      alt="Profile"
                      className="rounded-circle shadow"
                      style={{
                        width: "150px",
                        height: "150px",
                        objectFit: "cover",
                        border: "4px solid #007bff"
                      }}
                      onError={handleImageError}
                    />
                  ) : (
                    <div 
                      className="rounded-circle bg-light d-flex align-items-center justify-content-center shadow"
                      style={{
                        width: "150px",
                        height: "150px",
                        border: "4px solid #dee2e6"
                      }}
                    >
                      <i className="fas fa-user fa-3x text-muted"></i>
                    </div>
                  )}
                  
                  {/* Image Upload Button */}
                  <div className="mt-3">
                    <input
                      type="file"
                      id="profileImage"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                    <label 
                      htmlFor="profileImage" 
                      className="btn btn-outline-primary btn-sm"
                      style={{ cursor: 'pointer' }}
                    >
                      {imageUploading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-camera me-2"></i>
                          {!showAvatar ? 'Change Photo' : 'Upload Photo'}
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              {isEditing ? (
                // Edit Form
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <h5 className="card-title text-secondary border-bottom pb-2">
                      Edit Personal Information
                    </h5>
                    <div className="row">
                      <div className="col-12 mb-3">
                        <label htmlFor="name" className="form-label">
                          <strong>Full Name *</strong>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          readOnly
                          style={{ 
                            backgroundColor: '#f8f9fa',
                            cursor: 'not-allowed'
                          }}
                        />
                        <div className="form-text text-muted">
                          <i className="fas fa-info-circle me-1"></i>
                          Name cannot be edited. Please contact HR for name changes.
                        </div>
                      </div>
                      <div className="col-12 mb-3">
                        <label htmlFor="phoneNumber" className="form-label">
                          <strong>Phone Number</strong>
                        </label>
                        <input
                          type="tel"
                          className="form-control"
                          id="phoneNumber"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="col-12 mb-3">
                        <label htmlFor="address" className="form-label">
                          <strong>Address</strong>
                        </label>
                        <textarea
                          className="form-control"
                          id="address"
                          name="address"
                          rows="3"
                          value={formData.address}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h5 className="card-title text-secondary border-bottom pb-2">
                      Edit Professional Information
                    </h5>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="designation" className="form-label">
                          <strong>Designation</strong>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="designation"
                          name="designation"
                          value={formData.designation}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label htmlFor="department" className="form-label">
                          <strong>Department</strong>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="department"
                          name="department"
                          value={formData.department}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="d-flex gap-2 justify-content-end">
                    <button
                      type="button"
                      onClick={handleCancelClick}
                      className="btn btn-secondary"
                      disabled={updateLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={updateLoading}
                    >
                      {updateLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Updating...
                        </>
                      ) : (
                        "Update Profile"
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                // View Mode
                <>
                  {/* Personal Information Section */}
                  <div className="mb-4">
                    <h5 className="card-title text-secondary border-bottom pb-2">
                      Personal Information
                    </h5>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <strong className="text-muted">Employee ID:</strong>
                        <p className="mt-1">{profile.id}</p>
                      </div>
                      <div className="col-md-6 mb-3">
                        <strong className="text-muted">Full Name:</strong>
                        <p className="mt-1">{profile.name}</p>
                      </div>
                      <div className="col-12 mb-3">
                        <strong className="text-muted">Email:</strong>
                        <p className="mt-1">{profile.email}</p>
                      </div>
                      {profile.phoneNumber && (
                        <div className="col-md-6 mb-3">
                          <strong className="text-muted">Phone Number:</strong>
                          <p className="mt-1">{profile.phoneNumber}</p>
                        </div>
                      )}
                      {profile.address && (
                        <div className="col-12 mb-3">
                          <strong className="text-muted">Address:</strong>
                          <p className="mt-1">{profile.address}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Professional Information Section */}
                  <div className="mb-4">
                    <h5 className="card-title text-secondary border-bottom pb-2">
                      Professional Information
                    </h5>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <strong className="text-muted">Designation:</strong>
                        <p className="mt-1">{profile.designation}</p>
                      </div>
                      <div className="col-md-6 mb-3">
                        <strong className="text-muted">Department:</strong>
                        <p className="mt-1">{profile.department}</p>
                      </div>
                    </div>
                  </div>

                  {/* Current Session Info */}
                  <div>
                    <h5 className="card-title text-secondary border-bottom pb-2">
                      Current Session
                    </h5>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <strong className="text-muted">Logged in as:</strong>
                        <p className="mt-1">{user?.email}</p>
                      </div>
                      <div className="col-md-6 mb-3">
                        <strong className="text-muted">User Role:</strong>
                        <p className="mt-1">
                          <span 
                            className={`badge ${
                              user?.role === "ADMIN" ? "bg-danger" : 
                              user?.role === "HR" ? "bg-warning" : "bg-success"
                            }`}
                          >
                            {user?.role}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Last Updated Info */}
          {!isEditing && (
            <div className="mt-3 text-end">
              <small className="text-muted">
                Last updated: {new Date().toLocaleDateString()}
              </small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}