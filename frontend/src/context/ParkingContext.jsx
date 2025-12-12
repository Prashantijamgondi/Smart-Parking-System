import React, { createContext, useContext, useState, useCallback } from 'react';
import { parkingAPI } from '../services/api';

const ParkingContext = createContext();

export const useParkingContext = () => {
  const context = useContext(ParkingContext);
  if (!context) {
    throw new Error('useParkingContext must be used within ParkingProvider');
  }
  return context;
};

export const ParkingProvider = ({ children }) => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSlots = useCallback(async (background = false) => {
    if (!background) setLoading(true);
    if (!background) setError(null);
    try {
      const data = await parkingAPI.getAllSlots();
      setSlots(data);
    } catch (err) {
      if (!background) setError(err.message);
      console.error('Fetch slots error:', err.message);
    } finally {
      if (!background) setLoading(false);
    }
  }, []);

  const reserveSlot = async (reservationData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await parkingAPI.reserveSlot(reservationData);
      await fetchSlots();
      return result;
    } catch (err) {
      setError(err.message);
      console.error('Reserve slot error:', err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelReservation = async (slotId, emailId) => {
    setLoading(true);
    setError(null);
    try {
      console.log('Cancelling reservation:', { slotId, emailId }); // Debug log
      const result = await parkingAPI.cancelReservation(slotId, emailId);
      await fetchSlots();
      return result;
    } catch (err) {
      setError(err.message);
      console.error('Cancel reservation error:', err.message); // ✅ Fixed: Now shows actual message
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const syncSlots = async () => {
    setLoading(true);
    setError(null);
    try {
      await parkingAPI.syncFromBlynk();
      await fetchSlots();
    } catch (err) {
      setError(err.message);
      console.error('Sync slots error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    slots,
    loading,
    error,
    fetchSlots,
    reserveSlot,
    cancelReservation,
    syncSlots,
  };

  return <ParkingContext.Provider value={value}>{children}</ParkingContext.Provider>;
};
