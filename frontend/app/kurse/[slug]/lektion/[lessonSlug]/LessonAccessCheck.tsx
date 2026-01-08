// ===========================================
// WARIZMY EDUCATION - Lektions-Zugriffsprüfung
// ===========================================
// Prüft ob Benutzer Zugriff auf die Lektion hat

'use client';

import { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { Lock, ArrowLeft, LogIn } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { usersApi } from '@/lib/api';

interface LessonAccessCheckProps {
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  lessonIndex: number;
  isFreePreview?: boolean;
  children: ReactNode;
}

export default function LessonAccessCheck({
  courseId,
  courseSlug,
  courseTitle,
  lessonIndex,
  isFreePreview,
  children
}: LessonAccessCheckProps) {
  const { user, isAuthenticated, isLoading: authLoading, checkAuth } = useAuthStore();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // Erst Auth prüfen
  useEffect(() => {
    const initAuth = async () => {
      await checkAuth();
      setAuthChecked(true);
    };
    initAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authChecked) {
      checkAccess();
    }
  }, [authChecked, user, courseId]);

  const checkAccess = async () => {
    // Free Preview oder erste Lektion = immer zugänglich
    if (isFreePreview || lessonIndex === 0) {
      setHasAccess(true);
      setLoading(false);
      return;
    }

    // Nicht eingeloggt = kein Zugriff
    if (!isAuthenticated || !user) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    try {
      // Prüfe Einschreibung
      const enrollments = await usersApi.getMyEnrollments();
      console.log('Access Check Debug:', { 
        courseId, 
        enrollments: enrollments.map((e: any) => ({ id: e.course?.id, title: e.course?.title })),
      });
      const enrolled = enrollments.some(
        (e: any) => String(e.course?.id).toLowerCase() === String(courseId).toLowerCase()
      );
      console.log('Is enrolled:', enrolled);
      setHasAccess(enrolled);
    } catch (error) {
      console.error('Zugriffsprüfung fehlgeschlagen:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  // Ladezustand
  if (loading || !authChecked) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  // Kein Zugriff
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Icon */}
          <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-amber-600" />
          </div>

          {/* Titel */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Lektion gesperrt
          </h1>
          <p className="text-gray-600 mb-6">
            Du benötigst eine Einschreibung in diesen Kurs, um auf diese Lektion zuzugreifen.
          </p>

          {/* Kurs-Info */}
          <div className="p-4 bg-gray-50 rounded-xl mb-6">
            <p className="text-sm text-gray-500">Kurs</p>
            <p className="font-semibold text-gray-900">{courseTitle}</p>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            {isAuthenticated ? (
              <Link 
                href="/dashboard/meine-kurse"
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                Zum Dashboard
              </Link>
            ) : (
              <Link 
                href="/login"
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Anmelden
              </Link>
            )}
            <Link 
              href={`/kurse/${courseSlug}`}
              className="btn-outline w-full flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Zurück zum Kurs
            </Link>
          </div>

          {/* Registrieren */}
          {!isAuthenticated && (
            <p className="mt-6 text-sm text-gray-500">
              Noch kein Konto?{' '}
              <Link href="/registrieren" className="text-primary-600 hover:underline font-medium">
                Jetzt registrieren
              </Link>
            </p>
          )}
        </div>
      </div>
    );
  }

  // Zugriff gewährt - zeige Lektion
  return <>{children}</>;
}
