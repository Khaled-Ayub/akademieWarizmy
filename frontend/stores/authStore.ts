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
  date_of_birth?: string | null;
  newsletter_opt_in?: boolean;
  whatsapp_opt_in?: boolean;
  whatsapp_channel_opt_in?: boolean;
  onboarding_completed?: boolean;
  profile_picture_url?: string | null;
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
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<User>;
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
          return user;
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
          console.log('[authStore] Starting registration...');
          await authApi.register(data);
          console.log('[authStore] Registration successful, starting auto-login...');
          
          // Nach Registrierung automatisch einloggen
          const { user } = await authApi.login(data.email, data.password);
          console.log('[authStore] Auto-login successful:', user);
          
          // Store aktualisieren
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false 
          });
          
          return user;
        } catch (error) {
          console.error('[authStore] Registration/Login error:', error);
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
        console.log('[authStore.checkAuth] token present?', !!token);

        if (!token) {
          set({ 
            user: null, 
            isAuthenticated: false 
          });
          return false;
        }

        try {
          console.log('[authStore.checkAuth] fetching user via fetchUser()');
          await get().fetchUser();
          console.log('[authStore.checkAuth] fetchUser succeeded, user:', get().user);
          return true;
        } catch (err) {
          console.error('[authStore.checkAuth] fetchUser failed:', err);
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

