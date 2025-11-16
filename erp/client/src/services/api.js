import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  }
};

// Expenses API
export const expensesAPI = {
  getAll: async (from, to) => {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const response = await api.get('/expenses', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/expenses/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/expenses', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/expenses/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    await api.delete(`/expenses/${id}`);
  }
};

// Payments API
export const paymentsAPI = {
  getAll: async (from, to) => {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const response = await api.get('/payments', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/payments', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/payments/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    await api.delete(`/payments/${id}`);
  }
};

// Admin API
export const adminAPI = {
  downloadFile: async () => {
    const response = await api.get('/admin/file/download', {
      responseType: 'blob'
    });
    return response.data;
  },
  createBackup: async () => {
    const response = await api.post('/admin/backup');
    return response.data;
  },
  listBackups: async () => {
    const response = await api.get('/admin/backups');
    return response.data;
  }
};

export default api;

