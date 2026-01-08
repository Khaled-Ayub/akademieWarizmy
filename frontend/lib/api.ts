// ===========================================
// WARIZMY EDUCATION - API Client
// ===========================================
// Zentraler API-Client für Backend-Kommunikation

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

// =========================================
// Konfiguration
// =========================================
function normalizeApiUrl(url: string): string {
  // Accept both ".../api" and "..." and normalize to ".../api" (no trailing slash).
  const trimmed = url.replace(/\/+$/, '');
  if (trimmed.endsWith('/api')) return trimmed;
  return `${trimmed}/api`;
}

const API_URL = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api');

// =========================================
// Token Management
// =========================================
const TOKEN_KEY = 'warizmy_access_token';
const REFRESH_TOKEN_KEY = 'warizmy_refresh_token';

function getCookieDomain(): string | undefined {
  // Only needed in the browser. On the server we don't set cookies via js-cookie.
  if (typeof window === 'undefined') return undefined;

  const host = window.location.hostname;
  // Make tokens available across subdomains in production (e.g. ac.warizmyacademy.de).
  if (host === 'warizmyacademy.de' || host.endsWith('.warizmyacademy.de')) {
    return '.warizmyacademy.de';
  }

  return undefined;
}

function getCookieOptions(expires: number) {
  const domain = process.env.NODE_ENV === 'production' ? getCookieDomain() : undefined;
  return {
    expires,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    ...(domain ? { domain } : {}),
  };
}

/**
 * Access Token speichern
 */
export function setAccessToken(token: string): void {
  Cookies.set(TOKEN_KEY, token, getCookieOptions(1/48)); // 30 Minuten
}

/**
 * Access Token abrufen
 */
export function getAccessToken(): string | undefined {
  return Cookies.get(TOKEN_KEY);
}

/**
 * Refresh Token speichern
 */
export function setRefreshToken(token: string): void {
  Cookies.set(REFRESH_TOKEN_KEY, token, getCookieOptions(7)); // 7 Tage
}

/**
 * Refresh Token abrufen
 */
export function getRefreshToken(): string | undefined {
  return Cookies.get(REFRESH_TOKEN_KEY);
}

/**
 * Alle Tokens löschen (Logout)
 */
export function clearTokens(): void {
  // Use the same options as set(), otherwise cookies with a specific domain/path won't be removed.
  Cookies.remove(TOKEN_KEY, getCookieOptions(1/48));
  Cookies.remove(REFRESH_TOKEN_KEY, getCookieOptions(7));
}

// =========================================
// API Client erstellen
// =========================================
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 Sekunden Timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// =========================================
// Request Interceptor (Token hinzufügen)
// =========================================
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// =========================================
// Response Interceptor (Token Refresh)
// =========================================
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Bei 401 (Unauthorized) versuchen Token zu erneuern
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          // Token erneuern via same-origin proxy (avoids CORS/baseURL issues)
          const res = await fetch('/api/auth/refresh', { method: 'POST' });
          const json = await res.json().catch(() => ({}));
          if (!res.ok) {
            throw new Error(json?.detail || 'Refresh failed');
          }

          const { access_token, refresh_token } = json;
          
          // Neue Tokens speichern
          setAccessToken(access_token);
          setRefreshToken(refresh_token);
          
          // Ursprüngliche Anfrage wiederholen
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
          }
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh fehlgeschlagen → Logout
          clearTokens();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// =========================================
// API Funktionen
// =========================================

/**
 * Fehler-Handling Helper
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.detail || error.message || 'Ein Fehler ist aufgetreten';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Ein unbekannter Fehler ist aufgetreten';
}

// =========================================
// Auth API
// =========================================
export const authApi = {
  /**
   * Benutzer registrieren
   */
  register: async (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
  }) => {
    console.log('[authApi.register] Starting registration for:', data.email);
    // Use same-origin proxy to avoid CORS / misconfigured base URL issues
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    console.log('[authApi.register] Response status:', res.status);
    const json = await res.json().catch(() => ({}));
    console.log('[authApi.register] Response body:', json);
    if (!res.ok) {
      console.error('[authApi.register] Registration failed:', json);
      // Normalize error shape for callers
      throw new Error(json?.detail || json?.error || 'Registrierung fehlgeschlagen');
    }
    console.log('[authApi.register] Registration successful');
    return json;
  },

  /**
   * Benutzer anmelden
   */
  login: async (email: string, password: string) => {
    console.log('[authApi.login] Starting login for:', email);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    console.log('[authApi.login] Response status:', res.status);
    const json = await res.json().catch(() => ({}));
    console.log('[authApi.login] Response body:', json);
    if (!res.ok) {
      console.error('[authApi.login] Login failed:', json);
      throw new Error(json?.detail || json?.error || 'Login fehlgeschlagen');
    }

    const { access_token, refresh_token, user } = json;
    
    // Validate response
    if (!access_token || !user) {
      console.error('[authApi.login] Response missing required fields:', json);
      throw new Error('Login fehlgeschlagen: Ungültige Server-Antwort');
    }
    
    // Tokens speichern
    console.log('[authApi.login] Saving tokens and returning user');
    setAccessToken(access_token);
    if (refresh_token) {
      setRefreshToken(refresh_token);
    }
    
    return { user };
  },

  /**
   * Benutzer abmelden
   */
  logout: async () => {
    // Backend currently doesn't expose /auth/logout; just clear local tokens.
    clearTokens();
  },

  /**
   * Aktuellen Benutzer abrufen
   */
  getMe: async () => {
    console.log('[authApi.getMe] fetching /api/auth/me');
    const res = await fetch('/api/auth/me');
    console.log('[authApi.getMe] response status:', res.status);
    const json = await res.json().catch(() => ({}));
    console.log('[authApi.getMe] response body:', json);
    if (!res.ok) {
      console.error('[authApi.getMe] not ok:', json?.detail || res.status);
      throw new Error(json?.detail || 'Not authenticated');
    }
    return json;
  },

  /**
   * Passwort vergessen
   */
  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Passwort zurücksetzen
   */
  resetPassword: async (token: string, newPassword: string) => {
    const response = await api.post('/auth/reset-password', {
      token,
      new_password: newPassword,
    });
    return response.data;
  },
};

// =========================================
// Users API
// =========================================
export const usersApi = {
  /**
   * Eigenes Profil abrufen
   */
  getProfile: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  /**
   * Profil aktualisieren
   */
  updateProfile: async (data: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    address_street?: string;
    address_city?: string;
    address_zip?: string;
    address_country?: string;
    date_of_birth?: string; // YYYY-MM-DD
    newsletter_opt_in?: boolean;
    whatsapp_opt_in?: boolean;
    whatsapp_channel_opt_in?: boolean;
    onboarding_completed?: boolean;
  }) => {
    const response = await api.put('/users/me', data);
    return response.data;
  },

  /**
   * Meine Klassen abrufen
   */
  getMyClasses: async () => {
    const response = await api.get('/users/me/classes');
    return response.data;
  },

  /**
   * Meine Einschreibungen abrufen
   */
  getMyEnrollments: async () => {
    const response = await api.get('/users/me/enrollments');
    return response.data;
  },

  /**
   * Meinen Fortschritt abrufen
   */
  getMyProgress: async (courseId?: string) => {
    const url = courseId 
      ? `/users/me/progress?course_id=${courseId}` 
      : '/users/me/progress';
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Meine Zertifikate abrufen
   */
  getMyCertificates: async () => {
    const response = await api.get('/users/me/certificates');
    return response.data;
  },

  /**
   * Meine Rechnungen abrufen
   */
  getMyInvoices: async () => {
    const response = await api.get('/users/me/invoices');
    return response.data;
  },
};

// =========================================
// Sessions API
// =========================================
export const sessionsApi = {
  /**
   * Meine Sessions abrufen
   */
  getMySessions: async (upcomingOnly: boolean = true) => {
    const response = await api.get(`/sessions?upcoming_only=${upcomingOnly}`);
    return response.data;
  },

  /**
   * Kommende Sessions abrufen (für Dashboard)
   */
  getUpcoming: async (days: number = 7) => {
    const response = await api.get(`/sessions/upcoming?days=${days}`);
    return response.data;
  },

  /**
   * Unbestätigte Sessions abrufen (für Erinnerungs-Widget)
   */
  getUnconfirmed: async () => {
    const response = await api.get('/sessions/unconfirmed');
    return response.data;
  },

  /**
   * Teilnahme bestätigen
   */
  confirmAttendance: async (sessionId: string, willAttend: boolean, absenceReason?: string) => {
    const response = await api.post(`/sessions/${sessionId}/confirm`, {
      will_attend: willAttend,
      absence_reason: absenceReason,
    });
    return response.data;
  },

  /**
   * Zoom-Link erhalten
   */
  joinSession: async (sessionId: string) => {
    const response = await api.post(`/sessions/${sessionId}/join`);
    return response.data;
  },

  /**
   * Anwesenheitsliste einer Session abrufen (für Lehrer)
   */
  getSessionAttendance: async (sessionId: string) => {
    const response = await api.get(`/sessions/${sessionId}/attendance`);
    return response.data;
  },

  /**
   * Anwesenheit für Session aktualisieren (für Lehrer)
   */
  updateSessionAttendance: async (sessionId: string, attendances: Array<{
    user_id: string;
    status: 'present' | 'absent_excused' | 'absent_unexcused';
    notes?: string;
  }>) => {
    const response = await api.post(`/sessions/${sessionId}/attendance`, {
      attendances,
    });
    return response.data;
  },
};

// =========================================
// Exams API
// =========================================
export const examsApi = {
  /**
   * Verfügbare Prüfungstermine abrufen
   */
  getSlots: async (courseId?: string) => {
    const url = courseId 
      ? `/exams/slots?course_id=${courseId}` 
      : '/exams/slots';
    const response = await api.get(url);
    return response.data;
  },

  /**
   * PVL-Status abrufen
   */
  getPVLStatus: async (courseId: string) => {
    const response = await api.get(`/exams/my-pvl/${courseId}`);
    return response.data;
  },

  /**
   * Prüfung buchen
   */
  bookExam: async (examSlotId: string) => {
    const response = await api.post('/exams/book', {
      exam_slot_id: examSlotId,
    });
    return response.data;
  },

  /**
   * Meine Buchungen abrufen
   */
  getMyBookings: async () => {
    const response = await api.get('/exams/my-bookings');
    return response.data;
  },

  /**
   * Meine Noten abrufen
   */
  getMyGrades: async () => {
    const response = await api.get('/exams/my-grades');
    return response.data;
  },
};

// =========================================
// Courses API (jetzt über FastAPI)
// =========================================
export const coursesApi = {
  /**
   * Alle Kurse abrufen
   */
  getAll: async () => {
    const response = await api.get('/courses');
    return response.data;
  },

  /**
   * Featured Kurse abrufen
   */
  getFeatured: async (limit: number = 6) => {
    const response = await api.get(`/courses/featured?limit=${limit}`);
    return response.data;
  },

  /**
   * Einzelnen Kurs abrufen
   */
  getBySlug: async (slug: string) => {
    const response = await api.get(`/courses/${slug}`);
    return response.data;
  },

  /**
   * Kurse nach Kategorie abrufen
   */
  getByCategory: async (category: string) => {
    const response = await api.get(`/courses?category=${category}`);
    return response.data;
  },

  /**
   * Kurse durchsuchen
   */
  search: async (query: string) => {
    const response = await api.get(`/courses?search=${encodeURIComponent(query)}`);
    return response.data;
  },
};

// =========================================
// Content API (Lehrer, FAQs, etc.)
// =========================================
export const contentApi = {
  /**
   * Alle Lehrer abrufen
   */
  getTeachers: async () => {
    const response = await api.get('/content/teachers');
    return response.data;
  },

  /**
   * Einzelnen Lehrer abrufen
   */
  getTeacher: async (slug: string) => {
    const response = await api.get(`/content/teachers/${slug}`);
    return response.data;
  },

  /**
   * FAQs abrufen
   */
  getFAQs: async (category?: string) => {
    const url = category ? `/content/faqs?category=${category}` : '/content/faqs';
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Testimonials abrufen
   */
  getTestimonials: async (options?: { featured?: boolean; limit?: number }) => {
    const params = new URLSearchParams();
    if (options?.featured !== undefined) params.append('featured', String(options.featured));
    if (options?.limit) params.append('limit', String(options.limit));
    
    const url = `/content/testimonials${params.toString() ? '?' + params.toString() : ''}`;
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Ankündigungen abrufen
   */
  getAnnouncements: async () => {
    const response = await api.get('/content/announcements');
    return response.data;
  },

  /**
   * Tageshinweis abrufen
   */
  getDailyGuidance: async (isRamadan: boolean = false) => {
    const response = await api.get(`/content/daily-guidance?is_ramadan=${isRamadan}`);
    return response.data;
  },
};

// =========================================
// Dashboard API (für alle Dashboard-Typen)
// =========================================
export const dashboardApi = {
  /**
   * Studenten-Dashboard Daten abrufen
   */
  getStudentDashboard: async () => {
    const response = await api.get('/users/me/dashboard');
    return response.data;
  },

  /**
   * Lehrer-Dashboard Daten abrufen
   */
  getTeacherDashboard: async () => {
    const response = await api.get('/users/me/teacher-dashboard');
    return response.data;
  },

  /**
   * Admin-Dashboard Daten abrufen
   */
  getAdminDashboard: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  /**
   * Admin-Statistiken abrufen
   */
  getAdminStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },
};

// =========================================
// Admin API
// =========================================
export const adminApi = {
  /**
   * Alle Benutzer abrufen
   */
  getUsers: async (params?: { role?: string; search?: string; skip?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.role) searchParams.append('role', params.role);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.skip) searchParams.append('skip', String(params.skip));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    
    const url = `/admin/users${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Alle Zahlungen abrufen
   */
  getPayments: async (params?: { status?: string; skip?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.skip) searchParams.append('skip', String(params.skip));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    
    const url = `/admin/payments${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Alle Klassen abrufen
   */
  getClasses: async () => {
    const response = await api.get('/admin/classes');
    return response.data;
  },
};

export default api;
