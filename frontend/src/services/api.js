import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const registerUser = (data) => api.post('/auth/register', data);
export const loginUser = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');

// Applications
export const createApplication = (data) => api.post('/applications/', data);
export const getMyApplications = () => api.get('/applications/my');
export const getAllApplications = () => api.get('/applications/all');
export const getApplication = (id) => api.get(`/applications/${id}`);
export const updateApplication = (id, data) => api.patch(`/applications/${id}`, data);

// Documents
export const uploadDocument = (formData) =>
  api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const getDocuments = (applicationId) => api.get(`/documents/${applicationId}`);

// Dashboard
export const getDashboardStats = () => api.get('/dashboard/stats');

// Analysis
export const analyzeApplication = (id) => api.post(`/analysis/${id}/analyze`);
export const generateCAM = (id, format = 'pdf') =>
  api.post(`/analysis/${id}/generate-cam?format=${encodeURIComponent(format)}`, null, {
    responseType: 'blob',
  });
export const decideApplication = (id, decision) =>
  api.post(`/analysis/${id}/decide?decision=${encodeURIComponent(decision)}`);

export default api;
