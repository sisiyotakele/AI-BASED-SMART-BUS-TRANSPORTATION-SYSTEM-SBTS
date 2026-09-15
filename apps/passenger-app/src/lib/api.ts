import axios, { AxiosError } from 'axios';

// ─── Base URL ────────────────────────────────────────────────────────────────
export const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000') + '/api/v1';

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
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
        }
      }
    }

    return Promise.reject(error);
  }
);

// ─── Helpers ─────────────────────────────────────────────────────────────────
export interface ApiUserProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: string;
}

export interface BackendRoute {
  id: string;
  routeName: string;
  routeCode?: string;
  description?: string;
  origin?: string;
  destination?: string;
  startStop?: { id?: string; stopName?: string };
  endStop?: { id?: string; stopName?: string };
  startStopId?: string;
  endStopId?: string;
  distanceKm?: number;
  estimatedDurationMin?: number;
  fare?: number;
  fareAmount?: number;
  activeBusesCount?: number;
}

export interface BackendStop {
  id: string;
  stopName: string;
  latitude?: number;
  longitude?: number;
  address?: string;
}

export interface BackendTrip {
  id: string;
  busId: string;
  driverId: string;
  versionId?: string;
  scheduleId?: string;
  status: 'scheduled' | 'in_progress' | 'paused' | 'completed' | 'cancelled';
  scheduledStart: string;
  scheduledEnd: string;
  bus?: { id: string; plateNumber?: string; capacity?: number };
  driver?: { id: string; fullName?: string };
}

export interface BackendNotification {
  id: string;
  title: string;
  message: string;
  notificationType?: string;
  createdAt?: string;
  isRead?: boolean;
}

export interface AiCombinedPrediction {
  traffic_load_percentage?: number;
  congestion_level?: string;
  estimated_delay_minutes?: number;
  estimated_duration_minutes?: number;
  estimated_arrival?: string;
  recommended_speed_kmh?: number;
  best_departure_time?: string;
  confidence_score?: number;
  eta_minutes?: number;
}


export type ApiDiagnosticError = {
  message: string;
  type: 'network' | 'cors' | 'rate_limit' | 'validation' | 'auth' | 'conflict' | 'server' | 'unknown';
  detail?: string;
};

export function getApiDiagnosticError(error: unknown, fallback = 'Something went wrong.'): ApiDiagnosticError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{
      message?: string;
      error?: {
        message?: string;
        code?: string;
        details?: { fields?: Record<string, string[]> };
      };
    }>;

    // ── Case 1: No response at all ──────────────────────────────────────────
    // This means the browser never got any reply from the backend.
    // Either the server is down, wrong URL, or CORS blocked the request.
    if (!axiosError.response) {
      const url = (axiosError.config?.baseURL ?? '') + (axiosError.config?.url ?? '');
      return {
        type: 'network',
        message: '🔴 Server Not Reachable',
        detail: `Could not connect to the backend at:\n${url}\n\nPossible causes:\n• Backend server is not running (start it with: npm run dev)\n• Wrong API URL in .env.local (VITE_API_BASE_URL)\n• Browser CORS policy blocked the request`,
      };
    }

    const status = axiosError.response.status;
    const data = axiosError.response.data;

    // ── Case 2: 429 Too Many Requests (Rate Limited) ────────────────────────
    if (status === 429) {
      return {
        type: 'rate_limit',
        message: '⏳ Too Many Attempts',
        detail: 'You have made too many requests in a short time. Please wait 15 minutes before trying again.',
      };
    }

    // ── Case 3: 422 Validation Error (Zod/Body validation) ─────────────────
    if (status === 422) {
      const fields = data?.error?.details?.fields;
      if (fields && typeof fields === 'object') {
        const messages = Object.entries(fields)
          .map(([field, msgs]) => `• ${field}: ${(msgs as string[]).join(', ')}`)
          .join('\n');
        return {
          type: 'validation',
          message: '⚠️ Invalid Input',
          detail: `Please fix the following:\n${messages}`,
        };
      }
      return {
        type: 'validation',
        message: '⚠️ Validation Failed',
        detail: data?.message || data?.error?.message || 'One or more fields are invalid.',
      };
    }

    // ── Case 4: 401 Unauthorized ────────────────────────────────────────────
    if (status === 401) {
      return {
        type: 'auth',
        message: '🔒 Login Failed',
        detail: 'The email or password you entered is incorrect. Please try again.',
      };
    }

    // ── Case 5: 403 Forbidden ───────────────────────────────────────────────
    if (status === 403) {
      return {
        type: 'auth',
        message: '🚫 Access Denied',
        detail: 'Your account does not have permission to perform this action.',
      };
    }

    // ── Case 6: 409 Conflict (e.g. duplicate email) ─────────────────────────
    if (status === 409) {
      return {
        type: 'conflict',
        message: '📧 Email Already Registered',
        detail: 'An account with this email address already exists. Try logging in instead.',
      };
    }

    // ── Case 7: 500+ Server Errors ──────────────────────────────────────────
    if (status >= 500) {
      return {
        type: 'server',
        message: `🛑 Server Error (${status})`,
        detail: data?.message || data?.error?.message || 'The backend encountered an unexpected error. Check backend logs.',
      };
    }

    // ── Case 8: Other HTTP errors ───────────────────────────────────────────
    return {
      type: 'unknown',
      message: `❌ Request Failed (HTTP ${status})`,
      detail: data?.message || data?.error?.message || fallback,
    };
  }

  return {
    type: 'unknown',
    message: '❌ Unexpected Error',
    detail: fallback,
  };
}

/** Backwards-compatible simple string version */
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const diag = getApiDiagnosticError(error, fallback);
  return diag.detail ? `${diag.message}: ${diag.detail}` : diag.message;
}



export function normalizeUserProfile(data: Record<string, unknown> | undefined | null): ApiUserProfile | undefined {
  if (!data?.id || !data?.email) return undefined;

  let role = 'PASSENGER';
  if (typeof data.role === 'string') {
    role = data.role;
  } else if (Array.isArray(data.roles)) {
    const first = data.roles[0];
    role = typeof first === 'string' ? first : (first as { name?: string })?.name || 'PASSENGER';
  }

  return {
    id: String(data.id),
    email: String(data.email),
    fullName: String(data.fullName || ''),
    phone: String(data.phone || ''),
    role,
  };
}

// ─── AUTH ENDPOINTS ──────────────────────────────────────────────────────────
export const authApi = {
  register: (data: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
  }) => api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  /** Register then immediately log in (register endpoint does not return tokens). */
  registerAndLogin: async (data: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
  }) => {
    await api.post('/auth/register', data);
    return api.post('/auth/login', { email: data.email, password: data.password });
  },

  logout: () =>
    api.post('/auth/logout', {
      refreshToken: localStorage.getItem('refreshToken'),
    }),

  me: () => api.get('/auth/me'),

  updateProfile: (data: { fullName?: string; phone?: string; preferredLanguage?: string }) =>
    api.patch('/auth/me', data),

  forgotPassword: (data: { email: string }) =>
    api.post('/auth/forgot-password', data),
};

// ─── TRACKING ENDPOINTS ──────────────────────────────────────────────────────
export const trackingApi = {
  getAllBusLocations: () => api.get('/tracking'),
  getBusLocation: (busId: string) => api.get(`/tracking/${busId}`),
};

// ─── ROUTES & STOPS ENDPOINTS ────────────────────────────────────────────────
export const routesApi = {
  getRoutes: (search?: string) =>
    api.get('/routes-stops/routes', { params: search ? { search } : undefined }),
  getRoute: (id: string) => api.get(`/routes-stops/routes/${id}`),
  getRouteStops: (id: string) => api.get(`/routes-stops/routes/${id}/stops`),
  getStops: (search?: string) =>
    api.get('/routes-stops/stops', { params: search ? { search } : undefined }),
  getNearbyStops: (lat: number, lng: number, radius?: number) =>
    api.get('/routes-stops/stops/nearby', { params: { lat, lng, radius } }),
  planRoute: (origin: string, destination: string) =>
    api.post('/routes-stops/routes/plan', { origin, destination }),
  planRouteByAddress: (origin: string, destination: string) =>
    api.post('/routes-stops/routes/plan-by-address', { origin, destination }),
};

// ─── TRIPS ENDPOINTS ─────────────────────────────────────────────────────────
export const tripsApi = {
  getTrips: (params?: { status?: string; busId?: string; driverId?: string }) =>
    api.get('/trips', { params }),
  getTrip: (id: string) => api.get(`/trips/${id}`),
};

// ─── NOTIFICATIONS ENDPOINTS ─────────────────────────────────────────────────
export const notificationsApi = {
  getNotifications: (params?: { page?: number; limit?: number; isRead?: boolean }) =>
    api.get('/notifications', { params }),
  markAsRead: (notificationUserId: string) =>
    api.patch(`/notifications/${notificationUserId}/read`),
};

// ─── TERMINALS ENDPOINTS ─────────────────────────────────────────────────────
export const terminalsApi = {
  getTerminals: (search?: string) =>
    api.get('/terminals', { params: search ? { search } : undefined }),
  getTerminal: (id: string) => api.get(`/terminals/${id}`),
};

// ─── AI INTEGRATION (live ML predictions via backend proxy) ──────────────────
export interface TripPredictionRequest {
  origin_lat: number;
  origin_lon: number;
  dest_lat: number;
  dest_lon: number;
  route_id?: string;
  mileage?: number;
  direction?: string;
  timestamp?: string;
  origin_name?: string;
  destination_name?: string;
}

export const aiIntegrationApi = {
  health: () => api.get('/ai-integration/health'),
  predictTraffic: (data: TripPredictionRequest) =>
    api.post('/ai-integration/predict/traffic', data),
  predictEta: (data: TripPredictionRequest) =>
    api.post('/ai-integration/predict/eta', data),
  predictCombined: (data: TripPredictionRequest) =>
    api.post('/ai-integration/predict/combined', data),
};

// ─── AI PREDICTION (stored predictions in DB) ────────────────────────────────
export const aiPredictionApi = {
  getPredictions: (params: { routeId: string; versionId?: string }) =>
    api.get('/ai-prediction/predictions', { params }),
};

/** @deprecated Use aiIntegrationApi or aiPredictionApi instead */
export const aiApi = aiIntegrationApi;
