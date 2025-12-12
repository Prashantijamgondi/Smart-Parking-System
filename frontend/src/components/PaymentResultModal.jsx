import React from 'react';

const PaymentResultModal = ({ billing, onClose }) => {
    if (!billing) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <h2>💳 Payment Bill</h2>
                    <button className="modal-close" onClick={onClose}>
                        &times;
                    </button>
                </div>

                <div className="bill-container" style={{ padding: '20px' }}>
                    <div className="bill-details" style={{ marginBottom: '20px' }}>
                        <h3 style={{ marginBottom: '15px', color: '#333' }}>Parking Details</h3>
                        <p><strong>Slot:</strong> {billing.slot_id}</p>
                        <p><strong>Vehicle:</strong> {billing.vehicle_number}</p>
                        <p><strong>Duration:</strong> {billing.duration_minutes} minutes</p>

                        <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #ddd' }} />

                        <h3 style={{ marginBottom: '15px', color: '#333' }}>Billing</h3>
                        <p><strong>Base Charge:</strong> ₹{billing.base_charge?.toFixed(2)}</p>
                        <p><strong>Time Charge:</strong> ₹{billing.minute_charge?.toFixed(2)}</p>
                        <h2 style={{ color: '#ef4444', marginTop: '20px', fontSize: '28px' }}>
                            Total: ₹{billing.total_amount?.toFixed(2)}
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
                                <rect x="120" y="110" width="10" height="10" fill="black" />
                            </svg>
                        </div>
                        <p style={{ marginTop: '15px', fontSize: '14px', color: '#666', fontWeight: '500' }}>
                            UPI ID: parking@upi
                        </p>
                        <p style={{ marginTop: '5px', fontSize: '12px', color: '#999' }}>
                            Amount: ₹{billing.total_amount?.toFixed(2)}
                        </p>
                    </div>

                    <div className="info-box" style={{ marginTop: '20px', padding: '15px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fbbf24' }}>
                        <p style={{ margin: '5px 0' }}>✉️ Invoice sent to <strong>{billing.user_email}</strong></p>
                        <p style={{ margin: '5px 0' }}>📱 Payment status: <strong style={{ color: '#f59e0b' }}>PENDING</strong></p>
                    </div>
                </div>

                <div className="modal-actions">
                    <button className="btn btn-primary" onClick={onClose} style={{ width: '100%' }}>
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentResultModal;
