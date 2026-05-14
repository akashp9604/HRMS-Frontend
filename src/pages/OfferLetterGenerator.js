import React, { useEffect, useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import employeeData from "../data/emp.json";
import './OfferLetterGenerator.css';
const COMPANY_LOGO_URL = new URL('../assets/Final.png', import.meta.url).href;
 
const OfferLetterGenerator = ({ employeeId }) => {
  const [payload, setPayload] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const letterRef = useRef(null);
  const modalRef = useRef(null);
 
  useEffect(() => {
    const data = employeeData[employeeId];
    setPayload(data);
  }, [employeeId]);
 
  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowPreview(false);
      }
    };
 
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
 
  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const element = letterRef.current;
      await new Promise(resolve => setTimeout(resolve, 500));
 
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
 
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
 
      let heightLeft = imgHeight;
      let position = 0;
 
      // First page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
 
      // Additional pages
      while (heightLeft > 0) {
        position = heightLeft - imgHeight; // negative value to shift up
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
 
      pdf.save(`Offer-Letter-${payload.name.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
 
  const handlePreview = () => {
    setShowPreview(true);
    document.body.style.overflow = 'hidden';
  };
 
  const closePreview = () => {
    setShowPreview(false);
    document.body.style.overflow = 'auto';
  };
 
  if (!payload) return <div className="loading">Loading employee data...</div>;
 
  // Format the salary breakdown for better readability
  const salaryBreakdown = [
    { component: 'Basic Salary', amount: '₹16,667' },
    { component: 'HRA', amount: '₹8,333' },
    { component: 'Special Allowance', amount: '₹5,000' },
    { component: 'Medical Allowance', amount: '₹1,000' },
    { component: 'Total CTC', amount: '₹200,000 per annum' },
    { component: 'Monthly Stipend (Probation)', amount: '₹8,000' }
  ];
 
  return (
    <div className="offer-letter-container">
      <div className="button-group">
        <button
          onClick={handlePreview}
          className="btn preview-btn"
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating...' : 'Preview Offer Letter'}
        </button>
       
        {showPreview && (
          <button
            onClick={generatePDF}
            className="btn download-btn"
            disabled={isGenerating}
          >
            {isGenerating ? 'Downloading...' : 'Download PDF'}
          </button>
        )}
      </div>
 
      {/* Preview Modal */}
      {showPreview && (
        <div className="modal-overlay">
          <div className="modal-content" ref={modalRef}>
            <div className="modal-header">
              <h3>Offer Letter Preview</h3>
              <button onClick={closePreview} className="close-btn">×</button>
            </div>
            <div className="preview-container">
              {/* A4 Page Container */}
              <div
                ref={letterRef}
                className="letter-container"
              >
                {/* Header Logo */}
                <div className="header-logo">
                  {!logoError ? (
                    <img
                      src={COMPANY_LOGO_URL}
                      alt="Company Logo"
                      onError={() => setLogoError(true)}
                    />
                  ) : (
                    <div style={{ color: '#9ca3af', fontStyle: 'italic' }}>Company Logo</div>
                  )}
                </div>
 
                <div className="letter-header">
                  <div>{payload.issueDate}</div>
                  <div>Ref: {payload.referenceNo}</div>
                </div>
 
                <p>
                  <strong>{payload.name}</strong>,<br />
                  {payload.address}
                </p>
 
                <h2 className="letter-title">
                  Appointment Letter
                </h2>
 
                <p>
                  Further to your personal interview, we have a pleasure to appoint you as a
                  <strong> "{payload.designation}" </strong> in our organization with effect from
                  <strong> {payload.joiningDate} </strong> as per the terms and conditions of employment in force.
                </p>
 
                <div className="section">
                  <p>You are requested to bring the following at the time of joining:</p>
                  <ul className="document-list">
                    <li>4 passport size photographs.</li>
                    <li>Copies of all Educational degrees, marks sheets & training certificates.</li>
                    <li>Letter of Experience from all present and past employees. (If applicable)</li>
                    <li>Salary slips from present employer. (If applicable)</li>
                    <li>PAN card, Aadhaar card.</li>
                  </ul>
                </div>
 
                <h3 className="section-title">Terms and Conditions</h3>
                <ol className="terms-list">
                  <li>
                    <strong>Probation period.</strong> You will be put on probation period of 6 months and on satisfactory work you will be confirmed and placed on a regular post. In absence of any such letter from the management, your probation period will be deemed to be extended. Your service may be terminated without assigning any reason at any time during this period. You will not be entitled for any leave during the probation period.
                  </li>
                  <li>
                    <strong>Salary.</strong> Your consolidated salary will be {payload.salary}.
                  </li>
                  <li>
                    <strong>Leave.</strong> Upon confirmation, you will be entitled to 12 days privilege leave.
                  </li>
                  <li>
                    <strong>Service rules and conduct.</strong> You will be guided by existing service rules, usages, practices and other laws. You will be full time employee of this firm. Without prior permission in writing from the firm, you shall not take any part- or full-time employment and shall not engage yourself in any form of manufacturing, trading business or similar activities. Violation of any of the grounds will be sufficient case for summary dismissal without notice.
                  </li>
                  <li>
                    <strong>Confidential Information.</strong> You will not, during the tenure of your employment with the firm, or at any time thereafter, use or disclose to any other company, firm or person, any of the secrets/business affairs of the firm, which may be confided to you or become known to you, in the course of your service or otherwise. You will not, without the previous written consent of the company, publish any book, booklet, brochure or pamphlet or contribute any article to any newspaper or other publication relating to the affairs or your work in the firm.
                  </li>
                  <li>
                    <strong>Protection of interest.</strong> If you conceive any new or advanced methods of improving process/formula/system in relation to the operations of the firm, such development will be fully communicated to the firm, irrespective of their suitability for protection. You will not without the written consent of the firm, disclose them or any of them to any third party nor permit any third party to inspect or have access to any document, drawing or model relating thereto.
                  </li>
                  <li>
                    <strong>Termination.</strong> The firm reserves right to terminate your permanent service without assigning any reason by giving one month notice in writing to that effect or one month salary in lieu of such notice. The Firm however reserves to itself the right to dispense with your service at any time without notice or without payment of your accrued salary, if any, or compensation and/or suspend you without pay for refusal of duty, disobedience of orders, absence without leave, negligence as also for carrying on or entrusting yourself in any other employment, consultation, business or trade of any kind whatsoever directly or indirectly.
                  </li>
                  <li>
                    <strong>Resignation.</strong> You will have to give 30 days’ notice in case of resignation.
                  </li>
                  <li>
                    You may be required to sign a service agreement with the company if you are sent for any specialized training that may be required for upgradation of your skills and knowledge in order to take up required responsibilities and assignments.
                  </li>
                  <li>
                    All satisfactory performance of your engagement will lead to the package as per the industry standard/financial condition of Config Server LLP and on mutual agreement.
                    <ul>
                      <li>Attendance</li>
                      <li>Performance</li>
                      <li>Behavior with the colleagues</li>
                      <li>Trust/Data protection and the terms and conditions mentioned</li>
                    </ul>
                  </li>
                </ol>
 
                <p>
                  You are advised to go through the contents of this letter before signing the duplicate copy.
                </p>
                <p>
                  We hope you will grow and enjoy working with us and contribute your best towards the efficient functioning of the organization. Please return the duplicate copy of this letter duly signed by you signifying your acceptance of the terms and conditions stated therein for our record.
                </p>
 
                <ol className="terms-list" start={11}>
                  <li>
                    <strong>Performance Improvement Plan (PIP).</strong> The purpose of this performance improvement plan is to provide you guidance and support in improving your performance to meet expected standards and goals of the company. We are going to implement this plan after your 3 months training if needed.
                  </li>
                  <li>
                    As part of our commitment to supporting your growth and development, you will receive a stipend of {payload.stipend} per month during the entire duration of the training program, which is expected to run for 6 months depending on performance. Training program duration will be negotiable.
                  </li>
                </ol>
 
                <h3 className="section-title">Salary Breakdown</h3>
                <table className="salary-table">
                  <thead>
                    <tr>
                      <th>Component</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salaryBreakdown.map((item, index) => (
                      <tr key={index}>
                        <td>{item.component}</td>
                        <td>{item.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
 
                <p style={{ marginTop: "24px" }}>
                  Thank you,<br />
                  Config Server LLP
                </p>
 
                <div className="divider" />
                <h3>Agreed & Accepted</h3>
 
                <p>
                  Signature: __________________________ <br />
                  Date: ___________________
                </p>
 
                <p className="letter-footer">
                  Config Server LLP | Office No. 303, 313, A Wing, Laxmi Horizon, Punawale, Pune – 411033 | LLP No. ACF-7649 | www.configserverllp.com | 020 47211265
                </p>
 
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={closePreview}
                className="btn close-modal-btn"
              >
                Close Preview
              </button>
              <button
                onClick={generatePDF}
                className="btn download-btn"
                disabled={isGenerating}
              >
                {isGenerating ? 'Downloading...' : 'Download PDF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
 
export default OfferLetterGenerator;