// ===========================================
// WARIZMY EDUCATION - Registrieren
// ===========================================

'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BookOpen, Mail, Lock, User, Loader2, Eye, EyeOff } from 'lucide-react';

import { useAuthStore } from '@/stores/authStore';
import { getErrorMessage } from '@/lib/api';

const registerSchema = z
  .object({
    first_name: z.string().min(1, 'Vorname ist erforderlich'),
    last_name: z.string().min(1, 'Nachname ist erforderlich'),
    email: z.string().min(1, 'E-Mail ist erforderlich').email('Ungültige E-Mail-Adresse'),
    password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen haben'),
    password_confirm: z.string().min(1, 'Bitte Passwort bestätigen'),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: 'Passwörter stimmen nicht überein',
    path: ['password_confirm'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register: doRegister, isLoading } = useAuthStore();

  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    try {
      const user = await doRegister({
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
      });

      const next = searchParams.get('next');
      const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';

      // Students go to onboarding if needed
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
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading text-xl font-bold text-gray-900">WARIZMY</span>
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Konto erstellen</h1>
          <p className="text-gray-600 mb-8">Registriere dich, um loszulegen</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="input-label">Vorname</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input className={`input pl-12 ${errors.first_name ? 'input-error' : ''}`} {...register('first_name')} />
                </div>
                {errors.first_name && <p className="input-error-message">{errors.first_name.message}</p>}
              </div>
              <div>
                <label className="input-label">Nachname</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input className={`input pl-12 ${errors.last_name ? 'input-error' : ''}`} {...register('last_name')} />
                </div>
                {errors.last_name && <p className="input-error-message">{errors.last_name.message}</p>}
              </div>
            </div>

            <div>
              <label className="input-label">E-Mail-Adresse</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  autoComplete="email"
                  className={`input pl-12 ${errors.email ? 'input-error' : ''}`}
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="input-error-message">{errors.email.message}</p>}
            </div>

            <div>
              <label className="input-label">Passwort</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={`input pl-12 pr-12 ${errors.password ? 'input-error' : ''}`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="input-error-message">{errors.password.message}</p>}
            </div>

            <div>
              <label className="input-label">Passwort bestätigen</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword2 ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={`input pl-12 pr-12 ${errors.password_confirm ? 'input-error' : ''}`}
                  {...register('password_confirm')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword2(!showPassword2)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword2 ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password_confirm && (
                <p className="input-error-message">{errors.password_confirm.message}</p>
              )}
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full py-4">
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Wird erstellt...
                </>
              ) : (
                'Registrieren'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-gray-600">
            Schon ein Konto?{' '}
            <Link href="/login" className="text-primary-500 hover:text-primary-600 font-medium">
              Anmelden
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-500 to-primary-700 items-center justify-center p-12">
        <div className="max-w-lg text-center text-white">
          <div className="text-6xl mb-8">✨</div>
          <h2 className="text-3xl font-bold mb-4">Starte jetzt</h2>
          <p className="text-lg text-white/80">
            Erhalte Zugriff auf Kurse, Live-Unterricht und Aufzeichnungen – alles an einem Ort.
          </p>
        </div>
      </div>
    </div>
  );
}


