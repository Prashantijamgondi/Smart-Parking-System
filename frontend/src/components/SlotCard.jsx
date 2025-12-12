import React, { useState, useEffect } from 'react';

const SlotCard = ({ slot, onReserve, onCancel, onPayBill, loading }) => {
  const [reservationInfo, setReservationInfo] = useState(null);

  useEffect(() => {
    if (slot.is_reserved) {
      const storedInfo = localStorage.getItem(`reservation_${slot.slot_id}`);
      if (storedInfo) {
        try {
          setReservationInfo(JSON.parse(storedInfo));
        } catch (e) {
          console.error('Error parsing reservation info:', e);
        }
      }
    } else {
      setReservationInfo(null);
      localStorage.removeItem(`reservation_${slot.slot_id}`);
    }
  }, [slot.is_reserved, slot.slot_id]);

  const getStatusColor = () => {
    if (slot.is_occupied) return '#ef4444';
    if (slot.is_reserved) return '#f59e0b';
    return '#10b981';
  };

  const getStatusText = () => {
    if (slot.is_occupied) return 'Occupied';
    if (slot.is_reserved) return 'Reserved';
    return 'Available';
  };

  const formatDateTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="slot-card" style={{ borderColor: getStatusColor() }}>
      <div className="slot-header">
        <h3>Slot {slot.slot_id}</h3>
        <span className="slot-status" style={{ backgroundColor: getStatusColor() }}>
          {getStatusText()}
        </span>
      </div>

      <div className="slot-details">
        {slot.vehicle_number && (
          <p>
            <strong>🚗 Vehicle:</strong> {slot.vehicle_number}
          </p>
        )}
        {slot.user_email && (
          <p>
            <strong>📧 Email:</strong> {slot.user_email}
          </p>
        )}
        {slot.user_phone && (
          <p>
            <strong>📱 Phone:</strong> {slot.user_phone}
          </p>
        )}
        {slot.entry_time && (
          <p>
            <strong>⏰ Entry Time:</strong> {new Date(slot.entry_time * 1000).toLocaleString()}
          </p>
        )}

        {slot.is_reserved && reservationInfo && reservationInfo.arrival_date && (
          <p className="reservation-time">
            <strong>🕒 Expected Arrival:</strong>{' '}
            <span className="highlight-time">{formatDateTime(reservationInfo.arrival_date)}</span>
          </p>
        )}
      </div>

      <div className="slot-actions">
        {!slot.is_occupied && !slot.is_reserved && (
          <button
            className="btn btn-primary"
            onClick={() => onReserve(slot.slot_id)}
            disabled={loading}
          >
            Reserve Slot
          </button>
        )}
        {slot.is_reserved && (
          <button
            className="btn btn-danger"
            onClick={() => onCancel(slot.slot_id)}
            disabled={loading}
          >
            Cancel Reservation
          </button>
        )}
        {slot.is_occupied && (
          <button
            className="btn btn-warning"
            onClick={() => onPayBill(slot.slot_id)}
            disabled={loading}
          >
            💳 Pay Bill
          </button>
        )}
      </div>
    </div>
  );
};

export default SlotCard;
