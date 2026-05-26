// services/api.js
// --------------------------------------------------------------------
// Single axios instance for the whole frontend.
// - Base URL comes from VITE_API_BASE (or falls back to '' which means
//   "same origin" — relies on Vite's dev proxy).
// - Attaches the JWT from localStorage as `Authorization: Bearer ...`.
// - On 401, clears the stored token & user so AuthContext can react.
// - Unwraps the backend's { success, message, data } envelope to keep
//   page components clean — they just receive `data` directly.
// --------------------------------------------------------------------

import axios from 'axios';

const baseURL = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');

const api = axios.create({
  baseURL,
  timeout: 15000,
});

// ---- Request interceptor: attach JWT ------------------------------
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gigcredit_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ---- Response interceptor: unwrap envelope, normalize errors -------
api.interceptors.response.use(
  (res) => {
    // Backend always returns { success, message, data } in res.data.
    // We return the INNER data field so callers write `data.user` not `data.data.user`.
    // If a backend route ever omits the envelope, fall back to res.data.
    const body = res.data;
    if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
      return body.data;
    }
    return body;
  },
  (err) => {
    const status = err.response?.status;
    const body = err.response?.data;
    const message =
      body?.message ||
      err.message ||
      'Network error. Please try again.';

    if (status === 401) {
      // Clear creds — AuthContext listens to `storage` for cross-tab too.
      localStorage.removeItem('gigcredit_token');
      localStorage.removeItem('gigcredit_user');
      // Bubble a tiny event our AuthContext can pick up.
      window.dispatchEvent(new CustomEvent('gigcredit:unauthorized'));
    }

    return Promise.reject({
      status,
      message,
      errors: body?.errors || null,
      raw: body,
    });
  }
);

// --------------------------------------------------------------------
// API surface — every backend endpoint exposed as a small named call.
// Component code calls e.g. `api.wallet.deposit({ amount: 500 })`
// --------------------------------------------------------------------

const auth = {
  register: (payload) => api.post('/api/auth/register', payload),
  login:    (payload) => api.post('/api/auth/login', payload),
  logout:   ()        => api.post('/api/auth/logout'),
  me:       ()        => api.get('/api/auth/me'),
  changePassword: (payload) => api.put('/api/auth/change-password', payload),
};

const users = {
  getProfile:    () => api.get('/api/users/profile'),
  updateProfile: (payload) => api.put('/api/users/profile', payload),
  deleteProfile: () => api.delete('/api/users/profile'),
};

const wallet = {
  get:      () => api.get('/api/wallet'),
  summary:  () => api.get('/api/wallet/summary'),
  deposit:  (payload) => api.post('/api/wallet/deposit', payload),
  withdraw: (payload) => api.post('/api/wallet/withdraw', payload),
  transfer: (payload) => api.post('/api/wallet/transfer', payload),
};

const transactions = {
  list:           (params) => api.get('/api/transactions', { params }),
  getOne:         (id)     => api.get(`/api/transactions/${id}`),
  receipt:        (id)     => api.get(`/api/transactions/${id}/receipt`),
  monthlySummary: ()       => api.get('/api/transactions/summary/monthly'),
};

const expenses = {
  list:             (params) => api.get('/api/expenses', { params }),
  create:           (payload) => api.post('/api/expenses', payload),
  update:           (id, payload) => api.put(`/api/expenses/${id}`, payload),
  remove:           (id) => api.delete(`/api/expenses/${id}`),
  monthlySummary:   () => api.get('/api/expenses/summary/monthly'),
  categorySummary:  () => api.get('/api/expenses/summary/categories'),
};

const budgets = {
  list:    () => api.get('/api/budgets'),
  current: () => api.get('/api/budgets/current'),
  create:  (payload) => api.post('/api/budgets', payload),
  update:  (id, payload) => api.put(`/api/budgets/${id}`, payload),
  remove:  (id) => api.delete(`/api/budgets/${id}`),
};

const categories = {
  listActive: () => api.get('/api/categories'),
};

const notifications = {
  list:        () => api.get('/api/notifications'),
  markRead:    (id) => api.patch(`/api/notifications/${id}/read`),
  markAllRead: () => api.patch('/api/notifications/read-all'),
};

const reports = {
  userDashboard:   () => api.get('/api/reports/user-dashboard'),
  advancePlan:     (params) => api.get('/api/reports/advance-plan', { params }),
  incomeVsExpense: () => api.get('/api/reports/income-expense'),
  budgetUsage:     () => api.get('/api/reports/budget-usage'),
};

const admin = {
  dashboard:           () => api.get('/api/admin/dashboard'),
  transactionVolume:   () => api.get('/api/admin/reports/transaction-volume'),
  systemBalance:       () => api.get('/api/admin/reports/system-balance'),
  listUsers:           (params) => api.get('/api/admin/users', { params }),
  getUser:             (id) => api.get(`/api/admin/users/${id}`),
  blockUser:           (id) => api.patch(`/api/admin/users/${id}/block`),
  unblockUser:         (id) => api.patch(`/api/admin/users/${id}/unblock`),
  listWallets:         () => api.get('/api/admin/wallets'),
  listTransactions:    (params) => api.get('/api/admin/transactions', { params }),
  listFlagged:         () => api.get('/api/admin/transactions/flagged'),
  createCategory:      (payload) => api.post('/api/admin/categories', payload),
  updateCategory:      (id, payload) => api.put(`/api/admin/categories/${id}`, payload),
  disableCategory:     (id) => api.patch(`/api/admin/categories/${id}/disable`),
  listAuditLogs:       () => api.get('/api/admin/audit-logs'),
};

export default {
  raw: api,
  auth, users, wallet, transactions, expenses, budgets,
  categories, notifications, reports, admin,
};