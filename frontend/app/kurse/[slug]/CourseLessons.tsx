// ===========================================
// WARIZMY EDUCATION - Kurslektionen mit Zugriffskontrolle
// ===========================================
// Zeigt Lektionen basierend auf Einschreibungsstatus

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, Lock, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { usersApi } from '@/lib/api';

interface Lesson {
  id: string;
  title: string;
  slug: string;
  duration_minutes?: number | null;
  is_free_preview?: boolean;
  order_index?: number;
}

interface CourseLessonsProps {
  courseId: string;
  courseSlug: string;
  lessons: Lesson[];
}

export default function CourseLessons({ courseId, courseSlug, lessons }: CourseLessonsProps) {
  const { user, isAuthenticated } = useAuthStore();
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkEnrollment();
  }, [user, courseId]);

  const checkEnrollment = async () => {
    if (!isAuthenticated || !user) {
      setIsEnrolled(false);
      setLoading(false);
      return;
    }

    try {
      // Prüfe ob User in diesem Kurs eingeschrieben ist
      const enrollments = await usersApi.getMyEnrollments();
      const enrolled = enrollments.some(
        (e: any) => e.course?.id === courseId
      );
      setIsEnrolled(enrolled);
    } catch (error) {
      console.error('Einschreibungsprüfung fehlgeschlagen:', error);
      setIsEnrolled(false);
    } finally {
      setLoading(false);
    }
  };

  // Sortiere Lektionen nach order_index (falls vorhanden)
  const sortedLessons = [...lessons].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

  // Filtere sichtbare Lektionen
  const getVisibleLessons = () => {
    if (isEnrolled) {
      // Eingeschriebene sehen alle Lektionen
      return sortedLessons;
    }
    // Besucher sehen nur Free-Preview Lektionen oder die erste Lektion
    return sortedLessons.filter((lesson, index) => 
      lesson.is_free_preview || index === 0
    );
  };

  const visibleLessons = getVisibleLessons();
  const lockedLessons = sortedLessons.filter(l => !visibleLessons.includes(l));

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-gray-100 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-gray-200" />
            <div className="flex-1 h-4 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Kursinhalt ({lessons.length} Lektionen)
      </h2>

      {/* Info-Banner für nicht eingeschriebene */}
      {!isEnrolled && lockedLessons.length > 0 && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-800 font-medium">
              {visibleLessons.length} von {lessons.length} Lektionen verfügbar
            </p>
            <p className="text-amber-700 text-sm mt-1">
              Schreibe dich ein, um Zugriff auf alle Lektionen zu erhalten.
            </p>
          </div>
        </div>
      )}

      {/* Sichtbare Lektionen */}
      <div className="space-y-3">
        {sortedLessons.map((lesson, index) => {
          const isAccessible = isEnrolled || lesson.is_free_preview || index === 0;
          
          if (isAccessible) {
            return (
              <Link
                key={lesson.id}
                href={`/kurse/${courseSlug}/lektion/${lesson.slug}`}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-primary-50 hover:border-primary-200 border border-transparent transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-primary-100 group-hover:bg-primary-500 flex items-center justify-center flex-shrink-0 transition-colors">
                  <span className="text-primary-600 group-hover:text-white font-bold">
                    {index + 1}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 group-hover:text-primary-700">
                    {lesson.title}
                  </h3>
                  {lesson.duration_minutes && (
                    <span className="text-sm text-gray-500">
                      {lesson.duration_minutes} Min.
                    </span>
                  )}
                </div>
                {lesson.is_free_preview && !isEnrolled && (
                  <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    Vorschau
                  </span>
                )}
                <Play className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" />
              </Link>
            );
          } else {
            // Gesperrte Lektion
            return (
              <div
                key={lesson.id}
                className="flex items-center gap-4 p-4 bg-gray-100 rounded-xl opacity-60 cursor-not-allowed"
              >
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-500 font-bold">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-600">{lesson.title}</h3>
                  {lesson.duration_minutes && (
                    <span className="text-sm text-gray-400">
                      {lesson.duration_minutes} Min.
                    </span>
                  )}
                </div>
                <Lock className="w-5 h-5 text-gray-400" />
              </div>
            );
          }
        })}
      </div>

      {/* CTA für nicht eingeschriebene */}
      {!isEnrolled && (
        <div className="mt-6 p-6 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl border border-primary-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Vollen Zugriff erhalten</h3>
              <p className="text-sm text-gray-600 mt-1">
                Schreibe dich ein und erhalte Zugang zu allen {lessons.length} Lektionen.
              </p>
            </div>
            <Link 
              href={isAuthenticated ? "/dashboard" : "/registrieren"}
              className="btn-primary"
            >
              {isAuthenticated ? "Zum Dashboard" : "Jetzt einschreiben"}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
