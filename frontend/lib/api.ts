// ===========================================
// WARIZMY EDUCATION - API Client
// ===========================================
// Zentraler API-Client für Backend-Kommunikation

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

// =========================================
// Konfiguration
// =========================================
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

// =========================================
// Token Management
// =========================================
const TOKEN_KEY = 'warizmy_access_token';
const REFRESH_TOKEN_KEY = 'warizmy_refresh_token';

/**
 * Access Token speichern
 */
export function setAccessToken(token: string): void {
  Cookies.set(TOKEN_KEY, token, { 
    expires: 1/48, // 30 Minuten
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
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
  Cookies.set(REFRESH_TOKEN_KEY, token, { 
    expires: 7, // 7 Tage
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
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
  Cookies.remove(TOKEN_KEY);
  Cookies.remove(REFRESH_TOKEN_KEY);
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
          // Token erneuern
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          
          const { access_token, refresh_token } = response.data;
          
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
// Strapi Client
// =========================================
export const strapiApi: AxiosInstance = axios.create({
  baseURL: `${STRAPI_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  /**
   * Benutzer anmelden
   */
  login: async (email: string, password: string) => {
    // OAuth2 Password Flow erwartet Form-Daten
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    
    const response = await api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    const { access_token, refresh_token, user } = response.data;
    
    // Tokens speichern
    setAccessToken(access_token);
    setRefreshToken(refresh_token);
    
    return { user };
  },

  /**
   * Benutzer abmelden
   */
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      clearTokens();
    }
  },

  /**
   * Aktuellen Benutzer abrufen
   */
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
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
  getMyProgress: async (courseId?: number) => {
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
};

// =========================================
// Exams API
// =========================================
export const examsApi = {
  /**
   * Verfügbare Prüfungstermine abrufen
   */
  getSlots: async (courseId?: number) => {
    const url = courseId 
      ? `/exams/slots?course_id=${courseId}` 
      : '/exams/slots';
    const response = await api.get(url);
    return response.data;
  },

  /**
   * PVL-Status abrufen
   */
  getPVLStatus: async (courseId: number) => {
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
// Strapi API (für Kursinhalte)
// =========================================
export const coursesApi = {
  /**
   * Alle Kurse abrufen
   */
  getAll: async () => {
    const response = await strapiApi.get('/courses?populate=*');
    return response.data;
  },

  /**
   * Einzelnen Kurs abrufen
   */
  getBySlug: async (slug: string) => {
    const response = await strapiApi.get(`/courses?filters[slug][$eq]=${slug}&populate=*`);
    return response.data.data[0];
  },

  /**
   * Lektionen eines Kurses abrufen
   */
  getLessons: async (courseId: number) => {
    const response = await strapiApi.get(`/lessons?filters[course][id][$eq]=${courseId}&populate=*&sort=order:asc`);
    return response.data;
  },
};

export default api;

