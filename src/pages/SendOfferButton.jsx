// SendOfferButton.jsx (for your admin panel)
import React, { useState } from 'react';
import axiosInstance from '../apis/axiosConfig'; // ✅ Add JWT import

const SendOfferButton = ({ employeeId, employeeName }) => {
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState('');

    const handleSendOffer = async () => {
        if (!employeeId) {
            setMessage('❌ Employee ID is required');
            return;
        }

        setSending(true);
        setMessage('');
        
        try {
            // ✅ CHANGED: Use axiosInstance with JWT
            const response = await axiosInstance.post(
                'http://localhost:8092/api/payroll/offer-letter/send-offer',
                null,
                {
                    params: { employeeId: employeeId }
                }
            );
            
            if (response.data && response.data.success) {
                setMessage(`✅ Offer sent successfully to ${employeeName || employeeId}!`);
            } else {
                setMessage(`❌ Failed to send offer: ${response.data?.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error sending offer:', error);
            if (error.response?.status === 401) {
                setMessage('❌ Session expired. Please login again.');
            } else {
                setMessage('❌ Error sending offer: ' + (error.response?.data?.message || error.message));
            }
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="text-center">
            <button
                className="btn btn-success btn-sm"
                onClick={handleSendOffer}
                disabled={sending}
                title={`Send offer letter to ${employeeName || employeeId}`}
            >
                {sending ? (
                    <>
                        <i className="fas fa-spinner fa-spin me-1"></i>
                        Sending...
                    </>
                ) : (
                    <>
                        📧 Send Offer
                    </>
                )}
            </button>
            
            {message && (
                <div className={`alert ${message.includes('❌') ? 'alert-danger' : 'alert-success'} mt-2 p-2 small`}>
                    {message}
                </div>
            )}
        </div>
    );
};

export default SendOfferButton;