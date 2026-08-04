import axios from 'axios';

// ─── Base URL ────────────────────────────────────────────────────────────────
// Uses the staging server from the Swagger spec
export const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://196.188.240.103/ema/api/v1';

// ─── Axios Instance ──────────────────────────────────────────────────────────
export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor: Attach JWT token automatically ─────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response Interceptor: Handle token expiry ───────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't retried yet, try refreshing the token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          const res = await axios.post(`${BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          const { accessToken, refreshToken: newRefresh } = res.data.data;
          localStorage.setItem('token', accessToken);
          localStorage.setItem('refreshToken', newRefresh);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch {
          // Refresh failed — clear everything and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

// ─── AUTH ENDPOINTS ──────────────────────────────────────────────────────────
// POST /auth/register  → { email, password, fullName, phone }
// POST /auth/login     → { email, password }
// POST /auth/refresh   → { refreshToken }
// GET  /auth/me        → returns current user profile
// POST /auth/logout    → { refreshToken }

export const authApi = {
  register: (data: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
  }) => api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  logout: () =>
    api.post('/auth/logout', {
      refreshToken: localStorage.getItem('refreshToken'),
    }),

  me: () => api.get('/auth/me'),
};

// ─── TRACKING ENDPOINTS ──────────────────────────────────────────────────────
// GET /tracking         → all active bus locations
// GET /tracking/{busId} → specific bus location

export const trackingApi = {
  getAllBusLocations: () => api.get('/tracking'),
  getBusLocation: (busId: string) => api.get(`/tracking/${busId}`),
};

// ─── ROUTES & STOPS ENDPOINTS ────────────────────────────────────────────────
// GET /routes-stops/routes           → list all routes
// GET /routes-stops/routes/{id}      → route details
// GET /routes-stops/routes/{id}/stops → stops for a route

export const routesApi = {
  getRoutes: () => api.get('/routes-stops/routes'),
  getRoute: (id: string) => api.get(`/routes-stops/routes/${id}`),
  getRouteStops: (id: string) => api.get(`/routes-stops/routes/${id}/stops`),
};

// ─── TRIPS ENDPOINTS ─────────────────────────────────────────────────────────
// GET /trips               → list all trips (filter by status, busId, driverId)
// GET /trips/{id}          → trip details

export const tripsApi = {
  getTrips: (params?: { status?: string; busId?: string; driverId?: string }) =>
    api.get('/trips', { params }),
  getTrip: (id: string) => api.get(`/trips/${id}`),
};

// ─── NOTIFICATIONS ENDPOINTS ─────────────────────────────────────────────────
// GET  /notifications           → list notifications
// GET  /notifications/unread-count → unread count
// POST /notifications/{id}/mark-read → mark as read

export const notificationsApi = {
  getNotifications: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id: string) => api.post(`/notifications/${id}/mark-read`),
};

// ─── TERMINALS ENDPOINTS ─────────────────────────────────────────────────────
export const terminalsApi = {
  getTerminals: (search?: string) =>
    api.get('/terminals', { params: search ? { search } : undefined }),
  getTerminal: (id: string) => api.get(`/terminals/${id}`),
};

// ─── AI PREDICTION ENDPOINTS ─────────────────────────────────────────────────
// GET /ai-prediction/predict → traffic predictions

export const aiApi = {
  predict: (params?: { routeId?: string }) =>
    api.get('/ai-prediction/predict', { params }),
};