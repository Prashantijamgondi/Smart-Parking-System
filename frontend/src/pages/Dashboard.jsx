import React, { useEffect, useState } from 'react';
import { useParkingContext } from '../context/ParkingContext';
import { parkingAPI } from '../services/api';
import Loader from '../components/Loader';

const Dashboard = () => {
  const { slots, loading, fetchSlots, syncSlots } = useParkingContext();
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    fetchSlots();
    fetchRevenue();
  }, [fetchSlots]);

  const fetchRevenue = async () => {
    setLoadingStats(true);
    try {
      const data = await parkingAPI.getRevenueStats();
      if (data.success) {
        setTotalRevenue(data.stats.total_revenue);
        setTotalSessions(data.stats.total_sessions);
      }
    } catch (error) {
      console.error('Error fetching revenue:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const availableSlots = slots.filter((s) => !s.is_occupied && !s.is_reserved).length;
  const occupiedSlots = slots.filter((s) => s.is_occupied).length;
  const reservedSlots = slots.filter((s) => s.is_reserved).length;

  if (loading && slots.length === 0) {
    return <Loader fullScreen />;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>🅿️ Parking Dashboard</h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            syncSlots();
            fetchRevenue();
          }}
          disabled={loading}
        >
          {loading ? 'Syncing...' : '🔄 Sync from Blynk'}
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-available">
          <div className="stat-icon">✅</div>
          <h3>Available Slots</h3>
          <p className="stat-number">{availableSlots}</p>
          <span className="stat-label">Ready to Park</span>
        </div>

        <div className="stat-card stat-occupied">
          <div className="stat-icon">🚗</div>
          <h3>Occupied Slots</h3>
          <p className="stat-number">{occupiedSlots}</p>
          <span className="stat-label">Currently Parked</span>
        </div>

        <div className="stat-card stat-reserved">
          <div className="stat-icon">⏳</div>
          <h3>Reserved Slots</h3>
          <p className="stat-number">{reservedSlots}</p>
          <span className="stat-label">Pre-booked</span>
        </div>

        <div className="stat-card stat-total">
          <div className="stat-icon">🅿️</div>
          <h3>Total Slots</h3>
          <p className="stat-number">{slots.length}</p>
          <span className="stat-label">Total Capacity</span>
        </div>
      </div>

      <div className="revenue-section">
        <h2>💰 Revenue Statistics</h2>
        <div className="revenue-grid">
          <div className="revenue-card revenue-total">
            <div className="revenue-icon">💵</div>
            <div className="revenue-content">
              <span className="revenue-label">Total Revenue (All Time)</span>
              <span className="revenue-amount">
                {loadingStats ? (
                  <span className="loading-dots">Loading...</span>
                ) : (
                  `₹${totalRevenue.toFixed(2)}`
                )}
              </span>
              <span className="revenue-subtitle">From paid parking sessions</span>
            </div>
          </div>

          <div className="revenue-card revenue-sessions">
            <div className="revenue-icon">🎫</div>
            <div className="revenue-content">
              <span className="revenue-label">Paid Sessions</span>
              <span className="revenue-amount">
                {loadingStats ? (
                  <span className="loading-dots">...</span>
                ) : (
                  totalSessions
                )}
              </span>
              <span className="revenue-subtitle">Completed payments</span>
            </div>
          </div>

          <div className="revenue-card revenue-average">
            <div className="revenue-icon">📊</div>
            <div className="revenue-content">
              <span className="revenue-label">Average per Session</span>
              <span className="revenue-amount">
                {loadingStats ? (
                  <span className="loading-dots">...</span>
                ) : (
                  `₹${totalSessions > 0 ? (totalRevenue / totalSessions).toFixed(2) : '0.00'}`
                )}
              </span>
              <span className="revenue-subtitle">Average earning</span>
            </div>
          </div>
        </div>
      </div>

      <div className="quick-stats">
        <div className="quick-stat-item">
          <span className="quick-stat-label">Occupancy Rate</span>
          <span className="quick-stat-value">
            {slots.length > 0 ? Math.round((occupiedSlots / slots.length) * 100) : 0}%
          </span>
        </div>
        <div className="quick-stat-item">
          <span className="quick-stat-label">Available Rate</span>
          <span className="quick-stat-value">
            {slots.length > 0 ? Math.round((availableSlots / slots.length) * 100) : 0}%
          </span>
        </div>
        <div className="quick-stat-item">
          <span className="quick-stat-label">Pricing Rate</span>
          <span className="quick-stat-value">₹30 + ₹50/30s</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
