import React, { useState } from 'react';

const PayBillModal = ({ slot, onClose, onSubmit, loading }) => {
    const [formData, setFormData] = useState({
        user_email: '',
        user_phone: '',
        vehicle_number: '',
    });
    const [errors, setErrors] = useState({});
    const [showBill, setShowBill] = useState(false);
    const [billingData, setBillingData] = useState(null);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.user_email) {
            newErrors.user_email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.user_email)) {
            newErrors.user_email = 'Email is invalid';
        }

        if (!formData.user_phone) {
            newErrors.user_phone = 'Phone is required';
        } else if (!/^\+?[\d\s-]{10,}$/.test(formData.user_phone)) {
            newErrors.user_phone = 'Phone number is invalid';
        }

        if (!formData.vehicle_number) {
            newErrors.vehicle_number = 'Vehicle number is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validateForm()) {
            try {
                const result = await onSubmit(formData);
                if (result && result.billing) {
                    setBillingData(result.billing);
                    setShowBill(true);
                }
            } catch (error) {
                console.error('Payment submission error:', error);
            }
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        if (errors[e.target.name]) {
            setErrors({
                ...errors,
                [e.target.name]: '',
            });
        }
    };

    const handleCloseBill = () => {
        setShowBill(false);
        setBillingData(null);
        onClose();
    };

    // Bill view with QR code
    if (showBill && billingData) {
        return (
            <div className="modal-overlay" onClick={handleCloseBill}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                    <div className="modal-header">
                        <h2>💳 Payment Bill</h2>
                        <button className="modal-close" onClick={handleCloseBill}>
                            &times;
                        </button>
                    </div>

                    <div className="bill-container" style={{ padding: '20px' }}>
                        <div className="bill-details" style={{ marginBottom: '20px' }}>
                            <h3 style={{ marginBottom: '15px', color: '#333' }}>Parking Details</h3>
                            <p><strong>Slot:</strong> {billingData.slot_id}</p>
                            <p><strong>Vehicle:</strong> {billingData.vehicle_number}</p>
                            <p><strong>Duration:</strong> {billingData.duration_minutes} minutes</p>

                            <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #ddd' }} />

                            <h3 style={{ marginBottom: '15px', color: '#333' }}>Billing</h3>
                            <p><strong>Base Charge:</strong> ₹{billingData.base_charge?.toFixed(2)}</p>
                            <p><strong>Time Charge:</strong> ₹{billingData.minute_charge?.toFixed(2)}</p>
                            <h2 style={{ color: '#ef4444', marginTop: '20px', fontSize: '28px' }}>
                                Total: ₹{billingData.total_amount?.toFixed(2)}
                            </h2>
                        </div>

                        <div className="qr-code-section" style={{ textAlign: 'center', padding: '20px', background: '#f9fafb', borderRadius: '8px' }}>
                            <h3 style={{ marginBottom: '15px', color: '#333' }}>Scan to Pay</h3>
                            <div className="qr-code-placeholder" style={{ display: 'inline-block', padding: '10px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                                <svg width="200" height="200" viewBox="0 0 200 200">
                                    <rect width="200" height="200" fill="white" />
                                    {/* QR Code Pattern - Top Left */}
                                    <rect x="10" y="10" width="60" height="60" fill="black" />
                                    <rect x="20" y="20" width="40" height="40" fill="white" />
                                    <rect x="30" y="30" width="20" height="20" fill="black" />

                                    {/* Top Right */}
                                    <rect x="130" y="10" width="60" height="60" fill="black" />
                                    <rect x="140" y="20" width="40" height="40" fill="white" />
                                    <rect x="150" y="30" width="20" height="20" fill="black" />

                                    {/* Bottom Left */}
                                    <rect x="10" y="130" width="60" height="60" fill="black" />
                                    <rect x="20" y="140" width="40" height="40" fill="white" />
                                    <rect x="30" y="150" width="20" height="20" fill="black" />

                                    {/* Random pattern in middle */}
                                    <rect x="80" y="80" width="10" height="10" fill="black" />
                                    <rect x="100" y="80" width="10" height="10" fill="black" />
                                    <rect x="90" y="90" width="10" height="10" fill="black" />
                                    <rect x="110" y="90" width="10" height="10" fill="black" />
                                    <rect x="80" y="100" width="10" height="10" fill="black" />
                                    <rect x="100" y="100" width="10" height="10" fill="black" />
                                    <rect x="90" y="110" width="10" height="10" fill="black" />
                                    <rect x="110" y="110" width="10" height="10" fill="black" />
                                    <rect x="120" y="80" width="10" height="10" fill="black" />
                                    <rect x="70" y="110" width="10" height="10" fill="black" />
                                    <rect x="120" y="110" width="10" height="10" fill="black" />
                                </svg>
                            </div>
                            <p style={{ marginTop: '15px', fontSize: '14px', color: '#666', fontWeight: '500' }}>
                                UPI ID: parking@upi
                            </p>
                            <p style={{ marginTop: '5px', fontSize: '12px', color: '#999' }}>
                                Amount: ₹{billingData.total_amount?.toFixed(2)}
                            </p>
                        </div>

                        <div className="info-box" style={{ marginTop: '20px', padding: '15px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fbbf24' }}>
                            <p style={{ margin: '5px 0' }}>✉️ Payment request sent to <strong>{formData.user_email}</strong></p>
                            <p style={{ margin: '5px 0' }}>📱 Payment status: <strong style={{ color: '#f59e0b' }}>PENDING</strong></p>
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button className="btn btn-primary" onClick={handleCloseBill} style={{ width: '100%' }}>
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Form view
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>💳 Pay Bill - Slot {slot.slot_id}</h2>
                    <button className="modal-close" onClick={onClose}>
                        &times;
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email *</label>
                        <input
                            type="email"
                            name="user_email"
                            value={formData.user_email}
                            onChange={handleChange}
                            placeholder="your@email.com"
                            className={errors.user_email ? 'input-error' : ''}
                        />
                        {errors.user_email && <span className="error-text">{errors.user_email}</span>}
                    </div>

                    <div className="form-group">
                        <label>Phone Number *</label>
                        <input
                            type="tel"
                            name="user_phone"
                            value={formData.user_phone}
                            onChange={handleChange}
                            placeholder="+919876543210"
                            className={errors.user_phone ? 'input-error' : ''}
                        />
                        {errors.user_phone && <span className="error-text">{errors.user_phone}</span>}
                    </div>

                    <div className="form-group">
                        <label>Vehicle Number *</label>
                        <input
                            type="text"
                            name="vehicle_number"
                            value={formData.vehicle_number}
                            onChange={handleChange}
                            placeholder="KA01AB1234"
                            className={errors.vehicle_number ? 'input-error' : ''}
                        />
                        {errors.vehicle_number && <span className="error-text">{errors.vehicle_number}</span>}
                    </div>

                    <div className="info-box">
                        <p>📝 After submitting, you'll see the bill with QR code for payment.</p>
                        <p>The payment will be marked as <strong>PENDING</strong> in the history until completed.</p>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Processing...' : 'Submit & Get Bill'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PayBillModal;
