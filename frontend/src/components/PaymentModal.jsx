import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import '../PaymentModal.css';

const PaymentModal = ({ billing, onClose, onPaymentComplete }) => {
  const [paymentStep, setPaymentStep] = useState('details');
  const [userEmail, setUserEmail] = useState(billing.user_email || '');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);

  const calculateBilling = () => {
    const entryTime = billing.entry_time || 0;
    const exitTime = billing.exit_time || Math.floor(Date.now() / 1000);
    const durationMinutes = billing.duration_minutes || Math.floor((exitTime - entryTime) / 60);
    
    const baseCharge = 30;
    const durationSeconds = durationMinutes * 60;
    const intervals30Sec = Math.ceil(durationSeconds / 30);
    const minuteCharge = intervals30Sec * 50;
    const totalAmount = baseCharge + minuteCharge;

    return {
      entry_time: entryTime,
      exit_time: exitTime,
      duration_minutes: durationMinutes,
      base_charge: baseCharge,
      minute_charge: minuteCharge,
      total_amount: totalAmount,
      slot_id: billing.slot_id || 0,
      vehicle_number: billing.vehicle_number || 'N/A',
    };
  };

  const bill = calculateBilling();

  const validateEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleProceedToPayment = () => {
    if (!userEmail) {
      setEmailError('Email is required for receipt');
      return;
    }
    if (!validateEmail(userEmail)) {
      setEmailError('Please enter a valid email');
      return;
    }
    setEmailError('');
    setPaymentStep('qr');
  };

  const handlePaymentDone = async () => {
    setLoading(true);
    try {
      await onPaymentComplete(userEmail);
      setPaymentStep('success');
    } catch (error) {
      alert('Failed to send receipt. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    const value = typeof amount === 'number' ? amount : 0;
    return `₹${value.toFixed(2)}`;
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'medium'
    });
  };

  const generateUPIString = () => {
    const upiId = 'smartparking@paytm';
    const name = 'Smart Parking System';
    const amount = bill.total_amount;
    const transactionNote = `Parking-Slot${bill.slot_id}-${bill.vehicle_number}`;
    
    return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
  };

  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal-content" onClick={(e) => e.stopPropagation()}>
        {paymentStep === 'details' && (
          <>
            <div className="payment-header">
              <h2>💳 Payment Summary</h2>
              <button className="payment-close" onClick={onClose}>&times;</button>
            </div>

            <div className="payment-body">
              <div className="billing-card">
                <div className="billing-header">
                  <span className="slot-badge">Slot {bill.slot_id}</span>
                  <span className="vehicle-badge">{bill.vehicle_number}</span>
                </div>

                <div className="billing-details">
                  <div className="detail-row">
                    <span className="detail-icon">🚗</span>
                    <span className="detail-label">Vehicle Number</span>
                    <span className="detail-value">{bill.vehicle_number}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-icon">⏰</span>
                    <span className="detail-label">Entry Time</span>
                    <span className="detail-value">{formatDateTime(bill.entry_time)}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-icon">🚪</span>
                    <span className="detail-label">Exit Time</span>
                    <span className="detail-value">{formatDateTime(bill.exit_time)}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-icon">⏱️</span>
                    <span className="detail-label">Duration</span>
                    <span className="detail-value">{bill.duration_minutes} minutes</span>
                  </div>
                </div>

                <div className="billing-breakdown">
                  <h3>Pricing Breakdown</h3>
                  <div className="breakdown-row">
                    <span>Base Charge</span>
                    <span>{formatCurrency(bill.base_charge)}</span>
                  </div>
                  <div className="breakdown-row">
                    <span>Time Charge ({bill.duration_minutes} min)</span>
                    <span>{formatCurrency(bill.minute_charge)}</span>
                  </div>
                  <div className="breakdown-total">
                    <span>Total Amount</span>
                    <span className="total-amount">{formatCurrency(bill.total_amount)}</span>
                  </div>
                </div>

                <div className="pricing-note">
                  <div className="note-icon">💡</div>
                  <div className="note-text">
                    <strong>Pricing:</strong> ₹30 base + ₹50 per 30 seconds
                  </div>
                </div>
              </div>

              <div className="email-section">
                <label>📧 Email for Receipt *</label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => {
                    setUserEmail(e.target.value);
                    setEmailError('');
                  }}
                  placeholder="your@email.com"
                  className={emailError ? 'input-error' : ''}
                />
                {emailError && <span className="error-text">{emailError}</span>}
              </div>
            </div>

            <div className="payment-footer">
              <button className="btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn-primary" onClick={handleProceedToPayment}>
                Proceed to Payment →
              </button>
            </div>
          </>
        )}

        {paymentStep === 'qr' && (
          <>
            <div className="payment-header">
              <h2>📱 Scan to Pay</h2>
              <button className="payment-close" onClick={onClose}>&times;</button>
            </div>

            <div className="payment-body qr-section">
              <div className="amount-display">
                <div className="amount-label">Amount to Pay</div>
                <div className="amount-value">{formatCurrency(bill.total_amount)}</div>
              </div>

              <div className="qr-container">
                <QRCodeSVG
                  value={generateUPIString()}
                  size={280}
                  level="H"
                  includeMargin={true}
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>

              <div className="qr-instructions">
                <h3>🔍 How to Pay</h3>
                <ol>
                  <li>Open any UPI app (Google Pay, PhonePe, Paytm)</li>
                  <li>Scan the QR code above</li>
                  <li>Verify amount: <strong>{formatCurrency(bill.total_amount)}</strong></li>
                  <li>Complete the payment</li>
                  <li>Click "Payment Done" below</li>
                </ol>
              </div>

              <div className="upi-details">
                <strong>UPI ID:</strong> smartparking@paytm
              </div>
            </div>

            <div className="payment-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setPaymentStep('details')}
              >
                ← Back
              </button>
              <button 
                className="btn-success" 
                onClick={handlePaymentDone}
                disabled={loading}
              >
                {loading ? 'Processing...' : '✓ Payment Done'}
              </button>
            </div>
          </>
        )}

        {paymentStep === 'success' && (
          <>
            <div className="payment-header success-header">
              <h2>✅ Payment Successful!</h2>
            </div>

            <div className="payment-body success-body">
              <div className="success-animation">
                <div className="checkmark-circle">
                  <div className="checkmark">✓</div>
                </div>
              </div>

              <h3>Thank You for Your Payment!</h3>
              <p>Your parking session has been completed successfully.</p>

              <div className="success-details">
                <div className="success-item">
                  <strong>Amount Paid:</strong>
                  <span>{formatCurrency(bill.total_amount)}</span>
                </div>
                <div className="success-item">
                  <strong>Receipt Sent To:</strong>
                  <span>{userEmail}</span>
                </div>
                <div className="success-item">
                  <strong>Transaction ID:</strong>
                  <span>TXN{Date.now()}</span>
                </div>
              </div>

              <div className="success-message">
                📧 A detailed receipt has been sent to your email
              </div>
            </div>

            <div className="payment-footer">
              <button className="btn-primary btn-full" onClick={onClose}>
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
