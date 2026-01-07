// ===========================================
// WARIZMY EDUCATION - Admin Kurse Übersicht
// ===========================================
// Liste aller Kurse mit CRUD Aktionen

'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  BookOpen,
  ChevronRight,
  Loader2
} from 'lucide-react';

// =========================================
// Types
// =========================================
interface Course {
  id: string;
  title: string;
  slug: string;
  category: string;
  level: string;
  price: number;
  is_active: boolean;
  is_published: boolean;
  lesson_count: number;
  created_at: string;
}

// =========================================
// Kurs-Karte
// =========================================
function CourseCard({ course, onDelete }: { course: Course; onDelete: (id: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const categoryLabels: Record<string, string> = {
    arabic: 'Arabisch',
    islamic: 'Islamisch',
  };

  const levelLabels: Record<string, string> = {
    beginner: 'Anfänger',
    intermediate: 'Fortgeschritten',
    advanced: 'Experte',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              course.category === 'arabic' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-purple-100 text-purple-700'
            }`}>
              {categoryLabels[course.category] || course.category}
            </span>
            <span className="text-xs text-gray-500">
              {levelLabels[course.level] || course.level}
            </span>
            {!course.is_published && (
              <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                Entwurf
              </span>
            )}
          </div>
          
          {/* Dropdown Menu */}
          <div className="relative">
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>
            
            {menuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  <Link
                    href={`/kurse/${course.slug}`}
                    target="_blank"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Eye className="w-4 h-4" />
                    Ansehen
                  </Link>
                  <Link
                    href={`/admin/kurse/${course.id}`}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Edit className="w-4 h-4" />
                    Bearbeiten
                  </Link>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(course.id);
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                  >
                    <Trash2 className="w-4 h-4" />
                    Löschen
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {course.title}
        </h3>

        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            {course.lesson_count} Lektionen
          </span>
          {course.price > 0 && (
            <span className="font-medium text-gray-900">
              €{course.price}
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
        <Link
          href={`/admin/kurse/${course.id}`}
          className="flex items-center justify-between text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          <span>Bearbeiten</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

// =========================================
// Hauptseite
// =========================================
export default function AdminKursePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Kurse laden (über lokale API-Route mit Server-Token)
  useEffect(() => {
    async function loadCourses() {
      try {
        const res = await fetch('/api/admin/courses', { cache: 'no-store' });
        const data = await res.json();
        // FastAPI gibt { items: [...] } zurück - immer als Array behandeln
        const items = Array.isArray(data?.items) ? data.items : 
                      Array.isArray(data) ? data : [];
        setCourses(items);
      } catch (error) {
        console.error('Error loading courses:', error);
        setCourses([]); // Bei Fehler leeres Array setzen
      } finally {
        setLoading(false);
      }
    }
    loadCourses();
  }, []);

  // Kurs löschen
  const handleDelete = async (id: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diesen Kurs löschen möchten?')) return;
    
    try {
      await fetch(`/api/admin/courses/${id}`, { method: 'DELETE' });
      setCourses(courses.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Fehler beim Löschen des Kurses');
    }
  };

  // Gefilterte Kurse
  const filteredCourses = courses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kurse & Lektionen</h1>
          <p className="text-gray-500 mt-1">Verwalten Sie Ihre Kurse und deren Inhalte</p>
        </div>
        <Link
          href="/admin/kurse/neu"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Neuer Kurs
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Kurse durchsuchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {search ? 'Keine Kurse gefunden' : 'Noch keine Kurse'}
          </h3>
          <p className="text-gray-500 mb-6">
            {search 
              ? 'Versuchen Sie einen anderen Suchbegriff' 
              : 'Erstellen Sie Ihren ersten Kurs'
            }
          </p>
          {!search && (
            <Link
              href="/admin/kurse/neu"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Kurs erstellen
            </Link>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map((course) => (
            <CourseCard 
              key={course.id} 
              course={course} 
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

