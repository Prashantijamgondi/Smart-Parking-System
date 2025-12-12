import React, { useState } from 'react';

const CancelModal = ({ slotId, onClose, onSubmit, loading }) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validateEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setEmailError('Email is required');
      return;
    }
    
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email');
      return;
    }
    
    setSubmitting(true);
    try {
      await onSubmit(email);
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content cancel-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header cancel-header">
          <h2>⚠️ Cancel Reservation</h2>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="cancel-warning">
              <div className="warning-icon">⚠️</div>
              <div className="warning-text">
                <h3>Are you sure you want to cancel?</h3>
                <p>You are about to cancel the reservation for <strong>Slot {slotId}</strong></p>
              </div>
            </div>

            <div className="form-group">
              <label>📧 Confirm Your Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError('');
                }}
                placeholder="your@email.com"
                className={emailError ? 'input-error' : ''}
                autoFocus
                disabled={submitting || loading}
              />
              {emailError && <span className="error-text">{emailError}</span>}
              <small className="form-hint">
                Enter the email address used for reservation
              </small>
            </div>
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={submitting || loading}
            >
              Keep Reservation
            </button>
            <button 
              type="submit" 
              className="btn btn-danger" 
              disabled={submitting || loading}
            >
              {submitting || loading ? 'Cancelling...' : 'Yes, Cancel Reservation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CancelModal;
