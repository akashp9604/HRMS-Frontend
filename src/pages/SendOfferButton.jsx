// SendOfferButton.jsx (for your admin panel)
import React, { useState } from 'react';

const SendOfferButton = ({ employeeId, employeeName }) => {
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState('');

    // ==================== ADD THIS AUTH FUNCTION ====================
    const getAuthHeader = () => {
        const username = "ruchissonawane30@gmail.com";
        const password = "Ruchi@123";
        return "Basic " + btoa(`${username}:${password}`);
    };

    const handleSendOffer = async () => {
        if (!employeeId) {
            setMessage('❌ Employee ID is required');
            return;
        }

        setSending(true);
        setMessage('');
        
        try {
            const response = await fetch('http://localhost:8089/api/payroll/offer-letter/send-offer', {
                method: 'POST',
                headers: {
                    'Authorization': getAuthHeader(), // ADD AUTH HEADER
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `employeeId=${employeeId}`
            });
            
            const result = await response.json();
            if (response.ok && result.success) {
                setMessage(`✅ Offer sent successfully to ${employeeName || employeeId}!`);
            } else {
                setMessage(`❌ Failed to send offer: ${result.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error sending offer:', error);
            setMessage('❌ Error sending offer: ' + error.message);
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