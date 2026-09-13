import axios from 'axios';

const BASE = import.meta.env.VITE_API_BASE || '/api';
const api = axios.create({ baseURL: BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('inv_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers?.Authorization;
  }
  return config;
});

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('api/auth/login', data),
};

// ─── Categories ───────────────────────────────────────────────────────────────
export const categoriesAPI = {
  list:   ()           => api.get('api/inv/categories'),
  get:    (id)         => api.get(`api/inv/categories/${id}`),
  create: (data)       => api.post('api/inv/categories', data),
  update: (id, data)   => api.put(`api/inv/categories/${id}`, data),
  remove: (id)         => api.delete(`api/inv/categories/${id}`),
};

// ─── Items ────────────────────────────────────────────────────────────────────
export const itemsAPI = {
  list:       (params)   => api.get('api/inv/items', { params }),
  get:        (id)       => api.get(`api/inv/items/${id}`),
  create:     (data)     => api.post('api/inv/items', data),
  update:     (id, data) => api.put(`api/inv/items/${id}`, data),
  deactivate: (id)       => api.delete(`api/inv/items/${id}`),
};

// ─── Suppliers ────────────────────────────────────────────────────────────────
export const suppliersAPI = {
  list:       (params)   => api.get('api/inv/suppliers', { params }),
  get:        (id)       => api.get(`api/inv/suppliers/${id}`),
  create:     (data)     => api.post('api/inv/suppliers', data),
  update:     (id, data) => api.put(`api/inv/suppliers/${id}`, data),
  deactivate: (id)       => api.delete(`api/inv/suppliers/${id}`),
};

// ─── Tax Classes ──────────────────────────────────────────────────────────────
export const taxClassesAPI = {
  list:       ()               => api.get('api/inv/tax-classes'),
  get:        (id)             => api.get(`api/inv/tax-classes/${id}`),
  create:     (data)           => api.post('api/inv/tax-classes', data),
  update:     (id, data)       => api.put(`api/inv/tax-classes/${id}`, data),
  remove:     (id)             => api.delete(`api/inv/tax-classes/${id}`),
  addRate:    (id, data)       => api.post(`api/inv/tax-classes/${id}/rates`, data),
  updateRate: (id, rId, data)  => api.put(`api/inv/tax-classes/${id}/rates/${rId}`, data),
  deleteRate: (id, rId)        => api.delete(`api/inv/tax-classes/${id}/rates/${rId}`),
};

// ─── Approval Levels ──────────────────────────────────────────────────────────
export const approvalLevelsAPI = {
  list:    (requestType) => api.get('api/inv/approval-levels', requestType ? { params: { requestType } } : {}),
  get:     (id)          => api.get(`api/inv/approval-levels/${id}`),
  create:  (data)        => api.post('api/inv/approval-levels', data),
  update:  (id, data)    => api.put(`api/inv/approval-levels/${id}`, data),
  remove:  (id)          => api.delete(`api/inv/approval-levels/${id}`),
  reorder: (data)        => api.put('api/inv/approval-levels/reorder/batch', data),
};

// ─── Departments ──────────────────────────────────────────────────────────────
export const departmentsAPI = {
  list:   (params)   => api.get('api/inv/departments', { params }),
  create: (data)     => api.post('api/inv/departments', data),
  update: (id, data) => api.put(`api/inv/departments/${id}`, data),
};

// ─── Stores ───────────────────────────────────────────────────────────────────
export const storesAPI = {
  list:   (params)   => api.get('api/inv/stores', { params }),
  create: (data)     => api.post('api/inv/stores', data),
  update: (id, data) => api.put(`api/inv/stores/${id}`, data),
};

// ─── Purchase Requests ────────────────────────────────────────────────────────
export const purchaseRequestsAPI = {
  list:    (params)   => api.get('api/inv/purchase-requests', { params }),
  get:     (id)       => api.get(`api/inv/purchase-requests/${id}`),
  create:  (data)     => api.post('api/inv/purchase-requests', data),
  approve: (id, data) => api.post(`api/inv/purchase-requests/${id}/approve`, data),
  reject:  (id, data) => api.post(`api/inv/purchase-requests/${id}/reject`, data),
};

// ─── Quotations ───────────────────────────────────────────────────────────────
export const quotationsAPI = {
  list:   (params)   => api.get('api/inv/quotations', { params }),
  get:    (id)       => api.get(`api/inv/quotations/${id}`),
  create: (data)     => api.post('api/inv/quotations', data),
  update: (id, data) => api.put(`api/inv/quotations/${id}`, data),
};

// ─── Purchase Orders ──────────────────────────────────────────────────────────
export const purchaseOrdersAPI = {
  list:   (params) => api.get('api/inv/purchase-orders', { params }),
  get:    (id)     => api.get(`api/inv/purchase-orders/${id}`),
  create: (data)   => api.post('api/inv/purchase-orders', data),
  cancel: (id, data) => api.put(`api/inv/purchase-orders/${id}/cancel`, data),
};

// ─── GRN ──────────────────────────────────────────────────────────────────────
export const grnAPI = {
  list:    (params)   => api.get('api/inv/grn', { params }),
  get:     (id)       => api.get(`api/inv/grn/${id}`),
  create:  (data)     => api.post('api/inv/grn', data),
  approve: (id, data) => api.post(`api/inv/grn/${id}/approve`, data),
  reject:  (id, data) => api.post(`api/inv/grn/${id}/reject`, data),
};

export default api;
