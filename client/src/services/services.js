import { api } from './api';

export const authService = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  verifyOTP: (email, otp) => api.post('/auth/verify-otp', { email, otp }),
  resendOTP: (email) => api.post('/auth/resend-otp', { email }),
  checkUserId: (userId) => api.get(`/auth/check-userid/${userId}`),
};

export const loanService = {
  getAll: () => api.get('/loans'),
  add: (data) => api.post('/loans', data),
  update: (id, data) => api.put(`/loans/${id}`, data),
  delete: (id) => api.delete(`/loans/${id}`),
  close: (id) => api.patch(`/loans/${id}/close`),
  recordPayment: (id, data) => api.post(`/loans/${id}/payment`, data),
  getPayments: (id) => api.get(`/loans/${id}/payments`),
  getAppNames: () => api.get('/loans/meta/apps'),
};

export const analyticsService = {
  getSummary: () => api.get('/analytics/summary'),
  getComparison: () => api.get('/analytics/comparison'),
};

export const userService = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile', data),
};
