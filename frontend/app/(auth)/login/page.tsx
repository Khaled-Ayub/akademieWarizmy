// ===========================================
// WARIZMY EDUCATION - Login-Seite
// ===========================================

'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BookOpen, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

import { useAuthStore } from '@/stores/authStore';
import { getErrorMessage } from '@/lib/api';

// =========================================
// Validierung
// =========================================
const loginSchema = z.object({
  email: z.string()
    .min(1, 'E-Mail ist erforderlich')
    .email('Ungültige E-Mail-Adresse'),
  password: z.string()
    .min(1, 'Passwort ist erforderlich')
    .min(8, 'Passwort muss mindestens 8 Zeichen haben'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// =========================================
// Login-Seite
// =========================================
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading, user } = useAuthStore();
  
  // State
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });
  
  // Form absenden
  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    
    try {
      const user = await login(data.email, data.password);
      const next = searchParams.get('next');
      const safeNext =
        next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';
      // If student hasn't completed onboarding, force onboarding first.
      if (user?.role === 'student' && !user?.onboarding_completed) {
        router.push(`/onboarding?next=${encodeURIComponent(safeNext)}`);
        return;
      }
      router.push(safeNext);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };
  
  return (
    <div className="min-h-screen flex">
      {/* Linke Seite - Formular */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading text-xl font-bold text-gray-900">
              WARIZMY
            </span>
          </Link>
          
          {/* Titel */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Willkommen zurück
          </h1>
          <p className="text-gray-600 mb-8">
            Melden Sie sich an, um fortzufahren
          </p>
          
          {/* Fehler-Anzeige */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}
          
          {/* Formular */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* E-Mail */}
            <div>
              <label htmlFor="email" className="input-label">
                E-Mail-Adresse
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="ihre@email.de"
                  className={`input pl-12 ${errors.email ? 'input-error' : ''}`}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="input-error-message">{errors.email.message}</p>
              )}
            </div>
            
            {/* Passwort */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="input-label mb-0">
                  Passwort
                </label>
                <Link 
                  href="/passwort-vergessen" 
                  className="text-sm text-primary-500 hover:text-primary-600"
                >
                  Vergessen?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`input pl-12 pr-12 ${errors.password ? 'input-error' : ''}`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="input-error-message">{errors.password.message}</p>
              )}
            </div>
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Wird angemeldet...
                </>
              ) : (
                'Anmelden'
              )}
            </button>
          </form>
          
          {/* Register Link */}
          <p className="mt-8 text-center text-gray-600">
            Noch kein Konto?{' '}
            <Link href="/registrieren" className="text-primary-500 hover:text-primary-600 font-medium">
              Jetzt registrieren
            </Link>
          </p>
        </div>
      </div>
      
      {/* Rechte Seite - Dekorativ */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-500 to-primary-700 items-center justify-center p-12">
        <div className="max-w-lg text-center text-white">
          <div className="text-6xl mb-8">📚</div>
          <h2 className="text-3xl font-bold mb-4">
            Lernen Sie mit den Besten
          </h2>
          <p className="text-lg text-white/80">
            Zugang zu hochwertigen Kursen in Arabisch und islamischen Wissenschaften 
            mit erfahrenen Lehrern.
          </p>
          
          {/* Testimonial */}
          <div className="mt-12 p-6 bg-white/10 backdrop-blur-sm rounded-2xl">
            <p className="text-white/90 italic mb-4">
              &ldquo;Die beste Entscheidung meines Lebens. Die Lehrer sind 
              kompetent und die Plattform ist sehr benutzerfreundlich.&rdquo;
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20" />
              <div className="text-left">
                <div className="font-medium">Ahmad M.</div>
                <div className="text-sm text-white/70">Student</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

