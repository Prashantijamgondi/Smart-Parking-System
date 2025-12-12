import React, { useState, useEffect } from 'react';
import { parkingAPI } from '../services/api';
import Loader from '../components/Loader';
import PaymentModal from '../components/PaymentModal';
import '../History.css';

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [limit, setLimit] = useState(50);
  const [selectedBilling, setSelectedBilling] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [limit]);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await parkingAPI.getHistory(limit);
      setHistory(data.history || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch history');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalEarnings = () => {
    return history
      .filter(record => record.payment_status === 'PAID')
      .reduce((sum, record) => sum + (record.total_amount || 0), 0);
  };

  const handlePayNow = (record) => {
    setSelectedBilling(record);
    setShowPaymentModal(true);
  };

  // ✅ UPDATED: Mark payment as PAID in backend
  const handlePaymentComplete = async (email) => {
    try {
      const durationMinutes = selectedBilling.duration_minutes || 0;
      const baseCharge = 30;

      // Calculate minute charge: ₹50 per 30 seconds
      const durationSeconds = durationMinutes * 60;
      const intervals30Sec = Math.ceil(durationSeconds / 30);
      const minuteCharge = intervals30Sec * 50;

      const totalAmount = baseCharge + minuteCharge;

      // Format timestamps properly
      const entryTime = selectedBilling.entry_time
        ? new Date(selectedBilling.entry_time * 1000).toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
        : 'N/A';

      const exitTime = selectedBilling.exit_time
        ? new Date(selectedBilling.exit_time * 1000).toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
        : 'N/A';

      // Send receipt
      await parkingAPI.sendReceipt({
        to_email: email,
        slot_number: String(selectedBilling.slot_id),
        vehicle_number: selectedBilling.vehicle_number || 'N/A',
        entry_time: entryTime,
        exit_time: exitTime,
        duration_minutes: durationMinutes,
        base_charge: baseCharge,
        minute_charge: minuteCharge,
        total_amount: totalAmount
      });

      // Mark as paid in backend
      await parkingAPI.markPaymentPaid(selectedBilling.id);

      // Refresh history to show updated status
      await fetchHistory();

    } catch (error) {
      console.error('Payment complete error:', error.message);
      throw new Error(error.message || 'Failed to send receipt');
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const handleResetHistory = async () => {
    if (window.confirm('Are you sure you want to delete ALL history? This cannot be undone.')) {
      try {
        await parkingAPI.clearHistory();
        fetchHistory();
      } catch (err) {
        alert('Failed to reset history');
      }
    }
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-text">{error}</p>
        <button className="btn btn-primary" onClick={fetchHistory}>
          Retry
        </button>
      </div>
    );
  }

  const totalEarnings = calculateTotalEarnings();

  return (
    <div className="history-page">
      <div className="history-header">
        <h1>🅿️ Parking History</h1>
        <div className="header-controls">
          <button
            className="btn"
            onClick={handleResetHistory}
            style={{
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '6px',
              marginRight: '15px',
              cursor: 'pointer'
            }}
          >
            🗑️ Reset History
          </button>
          <div className="earnings-display">
            <span className="earnings-label">Total Earnings</span>
            <span className="earnings-amount">₹{totalEarnings.toFixed(2)}</span>
          </div>
          <div className="limit-selector">
            <label>Show: </label>
            <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span> records</span>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="history-table">
          <thead>
            <tr>
              <th>Slot</th>
              <th>Vehicle</th>
              <th>Entry Time</th>
              <th>Exit Time</th>
              <th>Duration</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-data">
                  No parking history found
                </td>
              </tr>
            ) : (
              history.map((record) => (
                <tr key={record.id}>
                  <td>
                    <span className="slot-badge">#{record.slot_id}</span>
                  </td>
                  <td>
                    <strong>{record.vehicle_number || 'N/A'}</strong>
                  </td>
                  <td>{formatDate(record.entry_time)}</td>
                  <td>{formatDate(record.exit_time)}</td>
                  <td>
                    <span className="duration-badge">{formatDuration(record.duration_minutes)}</span>
                  </td>
                  <td>
                    <span className="amount-badge">₹{(record.total_amount || 0).toFixed(2)}</span>
                  </td>
                  <td>
                    {record.payment_status === 'PAID' ? (
                      <span className="status-badge status-paid">✓ Paid</span>
                    ) : (
                      <span className="status-badge status-pending">⏳ Pending</span>
                    )}
                  </td>
                  <td>
                    {record.payment_status === 'PAID' ? (
                      <button className="btn-done" disabled>
                        ✓ Payment Done
                      </button>
                    ) : (
                      <button
                        className="btn-pay-now"
                        onClick={() => handlePayNow(record)}
                      >
                        💳 Pay Now
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showPaymentModal && selectedBilling && (
        <PaymentModal
          billing={selectedBilling}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedBilling(null);
          }}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </div>
  );
};

export default History;
