import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const ReservationModal = ({ slotId, onClose, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    user_email: '',
    user_phone: '',
    vehicle_number: '',
  });
  const [arrivalDate, setArrivalDate] = useState(new Date());
  const [duration, setDuration] = useState(1); // Default 1 hour
  const [errors, setErrors] = useState({});

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

    if (duration < 1) {
      newErrors.duration = 'Minimum duration is 1 hour';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Convert arrival date to Unix timestamp
      const arrival_time = Math.floor(arrivalDate.getTime() / 1000);

      const reservationData = {
        slot_id: slotId,
        user_email: formData.user_email,
        user_phone: formData.user_phone,
        vehicle_number: formData.vehicle_number,
        arrival_time: arrival_time,
        duration_hours: parseInt(duration),
      };

      localStorage.setItem(
        `reservation_${slotId}`,
        JSON.stringify({
          ...reservationData,
          arrival_date: arrivalDate.toISOString(),
        })
      );

      await onSubmit(reservationData);
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Reserve Slot {slotId}</h2>
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

          <div style={{ display: 'flex', gap: '15px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Arrival Time *</label>
              <DatePicker
                selected={arrivalDate}
                onChange={(date) => setArrivalDate(date)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="MM/dd h:mm aa"
                minDate={new Date()}
                className="date-picker-input"
              />
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label>Duration (Hours) *</label>
              <input
                type="number"
                name="duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="1"
                max="24"
                className={errors.duration ? 'input-error' : ''}
              />
            </div>
          </div>
          <small className="form-hint" style={{ display: 'block', marginTop: '-10px', marginBottom: '15px' }}>
            Rate: ₹100 per reserved hour
          </small>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Reserving...' : `Reserve for ₹${(duration * 100) + 30}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReservationModal;
