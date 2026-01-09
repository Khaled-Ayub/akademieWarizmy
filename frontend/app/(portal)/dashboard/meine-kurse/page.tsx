// ===========================================
// WARIZMY EDUCATION - Meine Kurse
// ===========================================
// Übersicht über alle eingeschriebenen Kurse

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  Play, 
  Clock, 
  CheckCircle,
  Award,
  ChevronRight,
  Loader2,
  GraduationCap,
  Video
} from 'lucide-react';

import { usersApi, getErrorMessage } from '@/lib/api';

// =========================================
// Typen
// =========================================
interface Enrollment {
  id: string;
  course: {
    id: string;
    title: string;
    slug: string;
    short_description?: string;
    thumbnail_url?: string;
    duration_weeks?: number;
    total_lessons?: number;
  };
  progress: number;
  completed_lessons: number;
  status: 'active' | 'completed' | 'paused';
  enrolled_at: string;
  completed_at?: string;
  next_lesson_slug?: string;
}

// =========================================
// Kurs-Karte Komponente
// =========================================
function CourseCard({ enrollment }: { enrollment: Enrollment }) {
  const { course, progress, completed_lessons, status, next_lesson_slug } = enrollment;
  const isCompleted = status === 'completed';
  
  return (
    <div className={`bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-all ${
      isCompleted ? 'border-green-200' : 'border-gray-200'
    }`}>
      {/* Thumbnail */}
      <div className="h-40 bg-gradient-to-br from-primary-500 to-primary-600 relative">
        {course.thumbnail_url ? (
          <img 
            src={course.thumbnail_url}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-white/30" />
          </div>
        )}
        
        {/* Status Badge */}
        {isCompleted && (
          <div className="absolute top-3 right-3">
            <span className="flex items-center gap-1 px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
              <CheckCircle className="w-3.5 h-3.5" />
              Abgeschlossen
            </span>
          </div>
        )}
        
        {/* Progress Overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
          <div 
            className={`h-full ${isCompleted ? 'bg-green-400' : 'bg-primary-300'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
          {course.title}
        </h3>
        
        {course.short_description && (
          <p className="text-sm text-gray-500 mb-4 line-clamp-2">
            {course.short_description}
          </p>
        )}
        
        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <span className="flex items-center gap-1">
            <Video className="w-4 h-4" />
            {completed_lessons}/{course.total_lessons || '?'} Lektionen
          </span>
          {course.duration_weeks && (
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {course.duration_weeks} Wochen
            </span>
          )}
        </div>
        
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Fortschritt</span>
            <span className={`font-medium ${isCompleted ? 'text-green-600' : 'text-primary-600'}`}>
              {progress}%
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                isCompleted ? 'bg-green-500' : 'bg-primary-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        
        {/* Action Button */}
        {isCompleted ? (
          <div className="flex flex-col gap-2">
            <Link
              href={`/kurse/${course.slug}`}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-colors bg-primary-50 text-primary-700 hover:bg-primary-100"
            >
              <BookOpen className="w-4 h-4" />
              Kurs ansehen
            </Link>
            <Link
              href="/dashboard/zertifikate"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-colors bg-green-50 text-green-700 hover:bg-green-100"
            >
              <Award className="w-4 h-4" />
              Zertifikat ansehen
            </Link>
          </div>
        ) : (
          <Link
            href={next_lesson_slug ? `/kurse/${course.slug}/lektion/${next_lesson_slug}` : `/kurse/${course.slug}`}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-colors bg-primary-50 text-primary-700 hover:bg-primary-100"
          >
            <Play className="w-4 h-4" />
            Weiter lernen
          </Link>
        )}
      </div>
    </div>
  );
}

// =========================================
// Leerer Zustand
// =========================================
function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
        <GraduationCap className="w-10 h-10 text-gray-400" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        Noch keine Kurse
      </h2>
      <p className="text-gray-500 max-w-md mx-auto mb-6">
        Du hast dich noch für keinen Kurs eingeschrieben. 
        Entdecke unsere Kurse und starte deine Lernreise!
      </p>
      <Link href="/kurse" className="btn-primary inline-flex items-center gap-2">
        <BookOpen className="w-5 h-5" />
        Kurse entdecken
      </Link>
    </div>
  );
}

// =========================================
// Hauptseite
// =========================================
export default function MeineKursePage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    loadEnrollments();
  }, []);

  const loadEnrollments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await usersApi.getMyEnrollments();
      setEnrollments(data || []);
    } catch (err) {
      console.error('Kurse laden fehlgeschlagen:', err);
      setError('Kurse konnten nicht geladen werden');
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredEnrollments = enrollments.filter(e => {
    if (filter === 'all') return true;
    if (filter === 'active') return e.status === 'active';
    if (filter === 'completed') return e.status === 'completed';
    return true;
  });

  const activeCount = enrollments.filter(e => e.status === 'active').length;
  const completedCount = enrollments.filter(e => e.status === 'completed').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meine Kurse</h1>
          <p className="text-gray-500 mt-1">
            {enrollments.length} Kurs{enrollments.length !== 1 ? 'e' : ''} • {activeCount} aktiv • {completedCount} abgeschlossen
          </p>
        </div>
        
        {/* Filter */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Alle
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === 'active' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Aktiv
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === 'completed' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Abgeschlossen
          </button>
        </div>
      </div>

      {/* Kurse Grid */}
      {filteredEnrollments.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEnrollments.map((enrollment) => (
            <CourseCard key={enrollment.id} enrollment={enrollment} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}

      {/* Neue Kurse entdecken */}
      {enrollments.length > 0 && (
        <div className="mt-8 p-6 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl border border-primary-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Mehr lernen?</h3>
              <p className="text-sm text-gray-600 mt-1">Entdecke weitere Kurse und erweitere dein Wissen.</p>
            </div>
            <Link href="/kurse" className="btn-primary flex items-center gap-2">
              Alle Kurse
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
