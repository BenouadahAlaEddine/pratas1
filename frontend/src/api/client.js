import axios from 'axios';

const api = axios.create({
  baseURL: '/',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request Interceptor — attach JWT token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response Interceptor — auto refresh token on 401
api.interceptors.response.use(
  res => res,
  async error => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        const { data } = await axios.post('/auth/refresh', { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth API ──────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => axios.post('/auth/register', data),
  login:    (data) => axios.post('/auth/login',    data),
  logout:   (refreshToken) => axios.post('/auth/logout', { refreshToken }),
  me:       () => api.get('/auth/me'),
  updateMe: (data) => api.put('/auth/me', data),
  getUsers: (params) => api.get('/auth/users', { params }),
};

// ─── Products API ──────────────────────────────────────────────────────────────
export const productsAPI = {
  getAll:     (params) => axios.get('/products', { params }),
  getById:    (id)     => axios.get(`/products/${id}`),
  getCategories: ()   => axios.get('/products/categories'),
  create:     (data)  => api.post('/products', data),
  update:     (id, d) => api.put(`/products/${id}`, d),
  delete:     (id)    => api.delete(`/products/${id}`),
};

// ─── Orders API ────────────────────────────────────────────────────────────────
export const ordersAPI = {
  getAll:       (params) => api.get('/orders', { params }),
  getById:      (id)     => api.get(`/orders/${id}`),
  create:       (data)   => api.post('/orders', data),
  cancel:       (id)     => api.put(`/orders/${id}/cancel`),
  updateStatus: (id, s)  => api.put(`/orders/${id}/status`, { status: s }),
  getStats:     ()       => api.get('/orders/admin/stats'),
};

// ─── Payments API ──────────────────────────────────────────────────────────────
export const paymentsAPI = {
  pay:       (data)     => api.post('/payments', data),
  getByOrder:(orderId)  => api.get(`/payments/${orderId}`),
  refund:    (orderId)  => api.post(`/payments/${orderId}/refund`),
  getAll:    (params)   => api.get('/payments/admin/all', { params }),
};

// ─── Notifications API ─────────────────────────────────────────────────────────
export const notificationsAPI = {
  getAll:   (params) => api.get('/notifications', { params }),
  markRead: (id)     => api.put(`/notifications/${id}/read`),
  readAll:  ()       => api.put('/notifications/read-all'),
  clear:    ()       => api.delete('/notifications/clear'),
};

export default api;
