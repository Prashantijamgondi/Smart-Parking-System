import React, { useState, useEffect } from 'react';
import { useParkingContext } from '../context/ParkingContext';
import { parkingAPI } from '../services/api';
import SlotCard from '../components/SlotCard';
import ReservationModal from '../components/ReservationModal';
import Loader from '../components/Loader';
import CancelModal from '../components/CancelModal';
import PayBillModal from '../components/PayBillModal';
import PaymentResultModal from '../components/PaymentResultModal';

const Slots = () => {
  const { slots, loading, fetchSlots, reserveSlot, cancelReservation } = useParkingContext();
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPayBillModal, setShowPayBillModal] = useState(false);
  const [showPaymentResultModal, setShowPaymentResultModal] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchSlots();

    // Auto-refresh every 30 seconds to cancel expired reservations
    const interval = setInterval(() => {
      fetchSlots(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchSlots]);

  const handleReserve = (slotId) => {
    setSelectedSlotId(slotId);
    setShowReservationModal(true);
  };

  const handleReservationSubmit = async (reservationData) => {
    try {
      await reserveSlot(reservationData);
      setShowReservationModal(false);
      setSuccessMessage(`Slot ${reservationData.slot_id} reserved successfully!`);
      setErrorMessage('');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage(error.message);
      setSuccessMessage('');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const handleCancelClick = (slotId) => {
    setSelectedSlotId(slotId);
    setShowCancelModal(true);
  };

  const handleCancelSubmit = async (emailId) => {
    try {
      const result = await cancelReservation(selectedSlotId, emailId);
      setShowCancelModal(false);

      if (result.billing) {
        setPaymentResult(result.billing);
        setShowPaymentResultModal(true);
        // Don't show success message yet, show the bill
      } else {
        setSuccessMessage(result.message);
        setErrorMessage('');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      setErrorMessage(error.message);
      setSuccessMessage('');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const handlePayBillClick = (slotId) => {
    const slot = slots.find(s => s.slot_id === slotId);
    setSelectedSlot(slot);
    setShowPayBillModal(true);
  };

  const handlePayBillSubmit = async (paymentData) => {
    try {
      const data = await parkingAPI.payBill(selectedSlot.slot_id, paymentData);

      // Refresh slots in background
      fetchSlots();

      // Return billing data to PayBillModal to show QR code
      return data;
    } catch (error) {
      setErrorMessage(error.message);
      setSuccessMessage('');
      setTimeout(() => setErrorMessage(''), 5000);
      throw error;
    }
  };

  if (loading && slots.length === 0) {
    return <Loader fullScreen />;
  }

  return (
    <div className="slots-page">
      <h1>Parking Slots</h1>

      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}

      {errorMessage && (
        <div className="error-message">{errorMessage}</div>
      )}

      <div className="slots-grid">
        {slots.map((slot) => (
          <SlotCard
            key={slot.slot_id}
            slot={slot}
            onReserve={handleReserve}
            onCancel={handleCancelClick}
            onPayBill={handlePayBillClick}
            loading={loading}
          />
        ))}
      </div>

      {showReservationModal && (
        <ReservationModal
          slotId={selectedSlotId}
          onClose={() => setShowReservationModal(false)}
          onSubmit={handleReservationSubmit}
          loading={loading}
        />
      )}

      {showCancelModal && (
        <CancelModal
          slotId={selectedSlotId}
          onClose={() => setShowCancelModal(false)}
          onSubmit={handleCancelSubmit}
          loading={loading}
        />
      )}

      {showPayBillModal && selectedSlot && (
        <PayBillModal
          slot={selectedSlot}
          onClose={() => {
            setShowPayBillModal(false);
            setSelectedSlot(null);
            setSuccessMessage('Payment request sent successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
          }}
          onSubmit={handlePayBillSubmit}
          loading={loading}
        />
      )}

      {showPaymentResultModal && paymentResult && (
        <PaymentResultModal
          billing={paymentResult}
          onClose={() => {
            setShowPaymentResultModal(false);
            setPaymentResult(null);
            setSuccessMessage('Cancellation processed successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
          }}
        />
      )}
    </div>
  );
};

export default Slots;
