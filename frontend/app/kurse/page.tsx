// ===========================================
// WARIZMY EDUCATION - Kurse Übersicht
// ===========================================
// Zeigt alle verfügbaren Kurse von der API

import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Star, Clock, Users, ChevronRight, Filter } from 'lucide-react';
import { 
  getCourses, 
  Course, 
  getCategoryLabel, 
  getLevelLabel,
  getMediaUrl 
} from '@/lib/content';

import Navbar from '@/components/Navbar';

// Metadata für SEO
export const metadata = {
  title: 'Kurse | WARIZMY Education',
  description: 'Entdecken Sie unsere Kurse für Arabisch und islamische Bildung.',
};

// Kurs-Karte Komponente
function CourseCard({ course }: { course: Course }) {
  return (
    <div className="card-hover group">
      {/* Thumbnail */}
      <div className="h-48 bg-gradient-to-br from-primary-500 to-primary-600 relative overflow-hidden">
        {course.thumbnail_url ? (
          <img 
            src={getMediaUrl(course.thumbnail_url)}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <>
            <div className="absolute inset-0 pattern-overlay opacity-20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="w-16 h-16 text-white/50" />
            </div>
          </>
        )}
        
        {/* Kategorie Badge */}
        <div className="absolute bottom-4 left-4">
          <span className="badge-primary">
            {getCategoryLabel(course.category)}
          </span>
        </div>
        
        {/* Featured Badge */}
        {course.is_featured && (
          <div className="absolute top-4 right-4">
            <span className="bg-amber-400 text-amber-900 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
              <Star className="w-3 h-3 fill-current" />
              Beliebt
            </span>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-6">
        {/* Meta */}
        <div className="flex items-center gap-2 mb-3">
          <span className="badge-secondary">
            {getLevelLabel(course.level)}
          </span>
          {course.duration_weeks && (
            <span className="flex items-center text-sm text-gray-500">
              <Clock className="w-4 h-4 mr-1" />
              {course.duration_weeks} Wochen
            </span>
          )}
        </div>
        
        {/* Titel */}
        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-500 transition-colors">
          {course.title}
        </h3>
        
        {/* Beschreibung */}
        {course.short_description && (
          <p className="text-gray-600 text-sm line-clamp-2 mb-4">
            {course.short_description}
          </p>
        )}
        
        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          {/* Preis */}
          <div>
            {course.price > 0 ? (
              <span className="text-lg font-bold text-primary-600">
                €{course.price}
              </span>
            ) : (
              <span className="text-lg font-bold text-green-600">
                Kostenlos
              </span>
            )}
          </div>
          
          {/* Link */}
          <Link 
            href={`/kurse/${course.slug}`}
            className="inline-flex items-center text-primary-500 font-medium hover:text-primary-600"
          >
            Details
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// Leerer Zustand
function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
        <BookOpen className="w-10 h-10 text-gray-400" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        Noch keine Kurse verfügbar
      </h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        Unsere Kurse werden bald hier erscheinen. 
        Fügen Sie Kurse im Admin-Bereich hinzu, um sie anzuzeigen.
      </p>
      <Link 
        href="/admin/kurse"
        className="btn-primary"
      >
        Kurse verwalten
      </Link>
    </div>
  );
}

// Hauptseite
export default async function KursePage() {
  // Kurse von API laden
  const courses = await getCourses();

  return (
    <>
      <Navbar />
      <main className="pt-16">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary-500/10 via-background-light to-secondary-500/10 py-16">
          <div className="container-custom">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Unsere Kurse
              </h1>
              <p className="text-lg text-gray-600">
                Entdecken Sie unser vielfältiges Angebot an Kursen für 
                Arabisch und islamische Bildung.
              </p>
            </div>
          </div>
        </section>

        {/* Kurse Grid */}
        <section className="py-16">
          <div className="container-custom">
            {courses.length > 0 ? (
              <>
                {/* Anzahl */}
                <p className="text-gray-600 mb-8">
                  {courses.length} Kurs{courses.length !== 1 ? 'e' : ''} gefunden
                </p>
                
                {/* Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {courses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              </>
            ) : (
              <EmptyState />
            )}
          </div>
        </section>
      </main>
    </>
  );
}
