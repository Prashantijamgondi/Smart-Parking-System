import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepts all errors and converts to strings
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Extract error message properly
    let errorMessage = 'An error occurred';

    if (error.response) {
      // Server responded with error
      errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        JSON.stringify(error.response?.data) ||
        error.message;
    } else if (error.request) {
      // Request was made but no response
      errorMessage = 'No response from server. Please check your connection.';
    } else {
      // Something else happened
      errorMessage = error.message || 'Request failed';
    }

    const newError = new Error(errorMessage);
    newError.response = error.response;
    newError.originalError = error;
    return Promise.reject(newError);
  }
);

export const parkingAPI = {
  getAllSlots: async () => {
    const response = await api.get('/api/slots');
    return response.data;
  },

  getSlot: async (slotId) => {
    const response = await api.get(`/api/slots/${slotId}`);
    return response.data;
  },

  reserveSlot: async (data) => {
    const response = await api.post('/api/slots/reserve', data);
    return response.data;
  },

  // ✅ FIXED: Proper payload format
  cancelReservation: async (slotId, emailId) => {
    const response = await api.post('/api/slots/cancel', {
      slot_id: parseInt(slotId),
      email_id: emailId
    });
    return response.data;
  },

  occupySlot: async (slotId) => {
    const response = await api.post(`/api/slots/occupy/${slotId}`);
    return response.data;
  },

  getHistory: async (limit = 50) => {
    const response = await api.get(`/api/history?limit=${limit}`);
    return response.data;
  },

  sendReceipt: async (data) => {
    const response = await api.post('/api/send-receipt', data);
    return response.data;
  },

  syncFromBlynk: async () => {
    const response = await api.post('/api/sync-from-blynk');
    return response.data;
  },

  healthCheck: async () => {
    const response = await api.get('/api/health');
    return response.data;
  },

  // New endpoints for payment tracking
  payBill: async (slotId, data) => {
    const response = await api.post(`/api/slots/pay-bill/${slotId}`, data);
    return response.data;
  },

  vacateUnknownSlot: async (slotId, data) => {
    const response = await api.post(`/api/slots/vacate-unknown/${slotId}`, data);
    return response.data;
  },

  getPendingPayments: async () => {
    const response = await api.get('/api/history/pending');
    return response.data;
  },

  getRevenueStats: async () => {
    const response = await api.get('/api/history/revenue');
    return response.data;
  },

  clearHistory: async () => {
    const response = await api.delete('/api/history/clear');
    return response.data;
  },

  markPaymentPaid: async (historyId) => {
    const response = await api.post(`/api/history/mark-paid/${historyId}`);
    return response.data;
  },

  resetAllSlots: async () => {
    const response = await api.post('/api/database/reset-slots');
    return response.data;
  },
};

export default api;
