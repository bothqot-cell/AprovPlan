const API_BASE = import.meta.env.VITE_API_URL || '/api';

class ApiClient {
  constructor() {
    this.base = API_BASE;
  }

  _getHeaders(isFormData = false) {
    const headers = {};
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (!isFormData) headers['Content-Type'] = 'application/json';
    return headers;
  }

  async _request(method, path, body, isFormData = false) {
    const opts = {
      method,
      headers: this._getHeaders(isFormData),
    };

    if (body) {
      opts.body = isFormData ? body : JSON.stringify(body);
    }

    const res = await fetch(`${this.base}${path}`, opts);

    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('Session expired');
    }

    // Handle PDF/blob responses
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/pdf')) {
      if (!res.ok) throw new Error('Failed to download report');
      return res.blob();
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  get(path) { return this._request('GET', path); }
  post(path, body) { return this._request('POST', path, body); }
  patch(path, body) { return this._request('PATCH', path, body); }
  delete(path) { return this._request('DELETE', path); }
  upload(path, formData) { return this._request('POST', path, formData, true); }
}

const api = new ApiClient();

// Auth
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// Projects
export const projectsApi = {
  list: () => api.get('/projects'),
  get: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.patch(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
};

// Uploads
export const uploadsApi = {
  upload: (projectId, file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.upload(`/uploads/${projectId}`, fd);
  },
  get: (id) => api.get(`/uploads/${id}`),
};

// Analysis
export const analysisApi = {
  get: (id) => api.get(`/analysis/${id}`),
  getByUpload: (uploadId) => api.get(`/analysis/upload/${uploadId}`),
  getByProject: (projectId) => api.get(`/analysis/project/${projectId}`),
  downloadJson: (id) => api.get(`/analysis/${id}/report/json`),
  downloadPdf: (id) => {
    const token = localStorage.getItem('token');
    return fetch(`${API_BASE}/analysis/${id}/report/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => {
      if (!r.ok) throw new Error('Failed to download');
      return r.blob();
    });
  },
};

// Billing
export const billingApi = {
  createCheckout: (priceId) => api.post('/billing/create-checkout', { priceId }),
  getPortal: () => api.post('/billing/portal'),
  getStatus: () => api.get('/billing/status'),
};

// Admin
export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (page = 1) => api.get(`/admin/users?page=${page}`),
  updateUser: (id, data) => api.patch(`/admin/users/${id}`, data),
  getFeatureFlags: () => api.get('/admin/feature-flags'),
  updateFeatureFlag: (id, data) => api.patch(`/admin/feature-flags/${id}`, data),
  getAuditLog: (page = 1) => api.get(`/admin/audit-log?page=${page}`),
};

export default api;
