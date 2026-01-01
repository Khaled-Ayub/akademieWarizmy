// ===========================================
// WARIZMY EDUCATION - Auth Store
// ===========================================
// Zustand Store für Authentifizierung

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, clearTokens, getAccessToken } from '@/lib/api';

// =========================================
// Types
// =========================================
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: 'student' | 'teacher' | 'admin';
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
}

interface AuthState {
  // State
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  fetchUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  checkAuth: () => Promise<boolean>;
}

interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

// =========================================
// Store
// =========================================
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // =========================================
      // Initial State
      // =========================================
      user: null,
      isLoading: false,
      isAuthenticated: false,
      
      // =========================================
      // Actions
      // =========================================
      
      /**
       * Benutzer anmelden
       */
      login: async (email: string, password: string) => {
        set({ isLoading: true });
        
        try {
          const { user } = await authApi.login(email, password);
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      
      /**
       * Benutzer abmelden
       */
      logout: async () => {
        set({ isLoading: true });
        
        try {
          await authApi.logout();
        } finally {
          clearTokens();
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false 
          });
        }
      },
      
      /**
       * Benutzer registrieren
       */
      register: async (data: RegisterData) => {
        set({ isLoading: true });
        
        try {
          await authApi.register(data);
          // Nach Registrierung automatisch einloggen
          await get().login(data.email, data.password);
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      
      /**
       * Benutzerdaten vom Server abrufen
       */
      fetchUser: async () => {
        set({ isLoading: true });
        
        try {
          const user = await authApi.getMe();
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } catch (error) {
          clearTokens();
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false 
          });
          throw error;
        }
      },
      
      /**
       * Benutzer direkt setzen (z.B. nach Token-Refresh)
       */
      setUser: (user: User | null) => {
        set({ 
          user, 
          isAuthenticated: !!user 
        });
      },
      
      /**
       * Authentifizierung prüfen (z.B. beim App-Start)
       */
      checkAuth: async () => {
        const token = getAccessToken();
        
        if (!token) {
          set({ 
            user: null, 
            isAuthenticated: false 
          });
          return false;
        }
        
        try {
          await get().fetchUser();
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      // Persistenz-Konfiguration
      name: 'warizmy-auth-storage',
      // Nur bestimmte Felder speichern
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// =========================================
// Selektoren
// =========================================
export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectIsLoading = (state: AuthState) => state.isLoading;
export const selectIsAdmin = (state: AuthState) => state.user?.role === 'admin';
export const selectIsTeacher = (state: AuthState) => state.user?.role === 'teacher';
export const selectIsStudent = (state: AuthState) => state.user?.role === 'student';

