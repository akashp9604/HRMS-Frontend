// OfferAcceptancePage.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../apis/axiosConfig'; // ✅ Add JWT import

const OfferAcceptancePage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const employeeId = searchParams.get('employeeId');
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [downloadLoading, setDownloadLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [employeeData, setEmployeeData] = useState(null);

    // ❌ REMOVE this - No longer needed
    // const getAuthHeader = () => {
    //     const username = "admin@gmail.com";
    //     const password = "Admin@123";
    //     return "Basic " + btoa(`${username}:${password}`);
    // };

    useEffect(() => {
        if (employeeId) {
            checkStatus();
            fetchEmployeeData();
        }
    }, [employeeId]);

    // ✅ UPDATED: Fetch employee data with JWT
    const fetchEmployeeData = async () => {
        try {
            const response = await axiosInstance.get(`http://localhost:8088/api/employees/${employeeId}/package`);
            if (response.data) {
                setEmployeeData(response.data);
            } else {
                console.warn("Could not fetch employee data, using default info");
            }
        } catch (error) {
            console.error("Error fetching employee data:", error);
        }
    };

    // ✅ UPDATED: Check status with JWT
    const checkStatus = async () => {
        try {
            const response = await axiosInstance.get(`http://localhost:8092/api/payroll/offer-letter/status/${employeeId}`);
            if (response.data) {
                setStatus(response.data);
            }
        } catch (error) {
            console.error('Error checking offer status:', error);
            setMessage('Error checking offer status');
        }
    };

    // ✅ UPDATED: Accept offer with JWT
    const handleAccept = async () => {
        setLoading(true);
        setMessage('');
        try {
            const response = await axiosInstance.post(
                'http://localhost:8092/api/payroll/offer-letter/accept',
                null,
                {
                    params: { employeeId: employeeId }
                }
            );
            
            const result = response.data;
            if (result.success) {
                if (result.emailSent) {
                    setMessage('✅ Offer accepted successfully! Check your email for direct download link. You can also download below.');
                } else {
                    setMessage('✅ Offer accepted successfully! You can now download your offer letter below. Contact HR if you need email copy.');
                }
                await checkStatus(); // Refresh status
            } else {
                setMessage('❌ Failed to accept offer: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Accept offer error:', error);
            if (error.response?.status === 401) {
                setMessage('❌ Authentication failed. Please contact HR for a valid offer link.');
            } else {
                setMessage('❌ Error accepting offer: ' + (error.response?.data?.message || error.message));
            }
        } finally {
            setLoading(false);
        }
    };

    // ✅ UPDATED: Download offer letter with JWT
    const handleDownload = async () => {
        setDownloadLoading(true);
        setMessage('');
        try {
            console.log("📥 Attempting to download offer letter for:", employeeId);
            
            const response = await axiosInstance.get(
                `http://localhost:8092/api/payroll/offer-letter/download`,
                {
                    params: { employeeId: employeeId },
                    responseType: 'blob'
                }
            );

            console.log("📊 Download response status:", response.status);

            const blob = response.data;
            console.log("📄 PDF blob received, size:", blob.size);

            if (blob.size === 0) {
                throw new Error('Received empty PDF file');
            }

            // Check if response is actually an error message (when blob is JSON)
            if (blob.type === 'application/json') {
                const text = await blob.text();
                try {
                    const errorData = JSON.parse(text);
                    throw new Error(errorData.message || 'Failed to download offer letter');
                } catch {
                    throw new Error('Failed to download offer letter');
                }
            }

            // Create filename with employee name
            const fileName = employeeData && employeeData.name 
                ? `Offer_Letter_${employeeData.name.replace(/\s+/g, '_')}.pdf`
                : `Offer_Letter_${employeeId}.pdf`;
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            setMessage('✅ Offer letter downloaded successfully!');
            
        } catch (error) {
            console.error('❌ Download failed:', error);
            if (error.message.includes('accepted')) {
                setMessage(`❌ ${error.message}`);
            } else if (error.response?.status === 403) {
                setMessage('❌ Offer must be accepted before downloading. Please accept the offer first.');
            } else {
                setMessage(`❌ ${error.message}`);
            }
        } finally {
            setDownloadLoading(false);
        }
    };

    if (!employeeId) {
        return (
            <div className="container mt-5">
                <div className="alert alert-danger">
                    <h4>Invalid Offer Link</h4>
                    <p className="mb-0">Please contact HR department for a valid offer link.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="card shadow">
                        <div className="card-header bg-primary text-white">
                            <h3 className="text-center mb-0">
                                <i className="fas fa-file-contract me-2"></i>
                                Offer Letter - Config Server LLP
                            </h3>
                        </div>
                        <div className="card-body p-4">
                            
                            {/* Employee Information */}
                            {employeeData && (
                                <div className="mb-4 p-3 bg-light rounded border">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <h4 className="text-success mb-2">
                                                <i className="fas fa-trophy me-2"></i>
                                                Congratulations, {employeeData.name}!
                                            </h4>
                                            <p className="mb-1"><strong>Position:</strong> {employeeData.designation}</p>
                                            <p className="mb-0"><strong>Employee ID:</strong> {employeeId}</p>
                                        </div>
                                        <div className="fs-1">🎉</div>
                                    </div>
                                </div>
                            )}
                            
                            <p className="lead text-center mb-4">
                                Welcome to Config Server LLP! We're excited to have you on board.
                            </p>
                            
                            {/* Conditional Rendering Based on Acceptance Status */}
                            {status?.accepted ? (
                                <div className="text-center">
                                    <div className="alert alert-success border-0 mb-4">
                                        <div className="d-flex align-items-center justify-content-center">
                                            <i className="fas fa-check-circle me-2 fs-4"></i>
                                            <div>
                                                <h4 className="alert-heading mb-1">Offer Accepted Successfully!</h4>
                                                <p className="mb-0">Thank you for joining our team.</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="card border-success mb-4">
                                        <div className="card-body text-center py-4">
                                            <i className="fas fa-file-pdf text-success mb-3" style={{fontSize: '3rem'}}></i>
                                            <h5 className="card-title">Your Official Offer Letter is Ready</h5>
                                            <p className="card-text">
                                                Download your official offer letter in PDF format. Keep this document for your records.
                                            </p>
                                            
                                            <button
                                                className="btn btn-success btn-lg px-5 py-3"
                                                onClick={handleDownload}
                                                disabled={downloadLoading}
                                            >
                                                {downloadLoading ? (
                                                    <>
                                                        <i className="fas fa-spinner fa-spin me-2"></i>
                                                        Downloading...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="fas fa-download me-2"></i>
                                                        Download Offer Letter PDF
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="alert alert-info border-0">
                                        <div className="d-flex align-items-center">
                                            <i className="fas fa-envelope me-2"></i>
                                            <div>
                                                <h6 className="alert-heading mb-1">Download Link Sent</h6>
                                                <p className="mb-0">
                                                    A direct download link has been sent to your email for future access.
                                                    No login required!
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <div className="alert alert-warning border-0 mb-4">
                                        <div className="d-flex align-items-center justify-content-center">
                                            <i className="fas fa-exclamation-triangle me-2"></i>
                                            <div>
                                                <h4 className="alert-heading mb-1">Offer Letter Acceptance Required</h4>
                                                <p className="mb-0">Please accept the offer to access your official offer letter.</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="card border-warning mb-4">
                                        <div className="card-body py-4">
                                            <div className="row align-items-center">
                                                <div className="col-md-8 text-start">
                                                    <h5 className="card-title">Ready to join our team?</h5>
                                                    <p className="card-text mb-0">
                                                        Accept the offer to receive your official offer letter and begin the onboarding process.
                                                    </p>
                                                </div>
                                                <div className="col-md-4">
                                                    <button
                                                        className="btn btn-success btn-lg w-100 py-3"
                                                        onClick={handleAccept}
                                                        disabled={loading}
                                                    >
                                                        {loading ? (
                                                            <>
                                                                <i className="fas fa-spinner fa-spin me-2"></i>
                                                                Accepting...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <i className="fas fa-check-circle me-2"></i>
                                                                Accept Offer
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="alert alert-info border-0">
                                        <div className="text-start">
                                            <h6 className="alert-heading">
                                                <i className="fas fa-info-circle me-2"></i>
                                                Important Information
                                            </h6>
                                            <ul className="mb-0 ps-3">
                                                <li><strong>Download available only after acceptance</strong></li>
                                                <li>After accepting, you'll receive the offer letter via email</li>
                                                <li>Direct download link - no login required</li>
                                                <li>Keep the offer letter for your records</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Message Display */}
                            {message && (
                                <div className={`alert ${message.includes('❌') || message.includes('Error') || message.includes('Failed') ? 'alert-danger' : 'alert-success'} border-0 mt-4`}>
                                    <div className="d-flex align-items-center">
                                        <i className={`fas ${message.includes('❌') ? 'fa-exclamation-circle' : 'fa-check-circle'} me-2`}></i>
                                        <span>{message.replace('✅', '').replace('❌', '')}</span>
                                    </div>
                                </div>
                            )}

                            {/* Back Button */}
                            <div className="text-center mt-4">
                                <button 
                                    className="btn btn-outline-secondary"
                                    onClick={() => navigate('/')}
                                >
                                    <i className="fas fa-arrow-left me-2"></i>
                                    Back to Home
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Additional Info Card */}
                    <div className="card mt-4 border-0 bg-light">
                        <div className="card-body text-center py-3">
                            <small className="text-muted">
                                <i className="fas fa-shield-alt me-1"></i>
                                Secure • Confidential • Official Document
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OfferAcceptancePage;