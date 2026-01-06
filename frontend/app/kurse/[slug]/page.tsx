// ===========================================
// WARIZMY EDUCATION - Kursdetails
// ===========================================
// Dynamische Seite für einzelne Kurse

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { 
  BookOpen, 
  Clock, 
  Users, 
  Award, 
  Play, 
  CheckCircle,
  ChevronLeft,
  User
} from 'lucide-react';
import { 
  getCourseBySlug, 
  getCourses,
  getCategoryLabel, 
  getLevelLabel,
  getMediaUrl 
} from '@/lib/content';

// Vimeo Player für Vorschau-Video
import VimeoPlayer from '@/components/VimeoPlayer';

// Statische Pfade generieren (für SSG)
export async function generateStaticParams() {
  const courses = await getCourses();
  return courses.map((course) => ({
    slug: course.slug,
  }));
}

// Metadata generieren
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const course = await getCourseBySlug(params.slug);
  
  if (!course) {
    return {
      title: 'Kurs nicht gefunden | WARIZMY Education',
    };
  }
  
  return {
    title: `${course.title} | WARIZMY Education`,
    description: course.short_description || course.description,
  };
}

// Header Komponente
function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading text-xl font-bold text-gray-900">
              WARIZMY
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/kurse" className="text-primary-500 font-medium">
              Kurse
            </Link>
            <Link href="/ueber-uns" className="text-gray-600 hover:text-primary-500 font-medium">
              Über uns
            </Link>
            <Link href="/faq" className="text-gray-600 hover:text-primary-500 font-medium">
              FAQ
            </Link>
          </nav>
          
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-gray-600 hover:text-primary-500 font-medium hidden sm:block">
              Anmelden
            </Link>
            <Link href="/registrieren" className="btn-primary py-2 px-4 text-sm">
              Registrieren
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

// Hauptseite
export default async function KursDetailPage({ 
  params 
}: { 
  params: { slug: string } 
}) {
  // Kurs von API laden
  const course = await getCourseBySlug(params.slug);
  
  // 404 wenn Kurs nicht gefunden
  if (!course) {
    notFound();
  }

  const lessons = course.lessons || [];
  const teachers = course.teachers || [];
  const teacher = teachers[0] || null;

  return (
    <>
      <Header />
      <main className="pt-16">
        {/* Hero mit Kursbild */}
        <section className="relative bg-gray-900 text-white">
          {/* Hintergrundbild */}
          <div className="absolute inset-0">
            {course.thumbnail_url ? (
              <img 
                src={getMediaUrl(course.thumbnail_url)}
                alt={course.title}
                className="w-full h-full object-cover opacity-30"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary-600 to-primary-800" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-gray-900/60" />
          </div>

          {/* Content */}
          <div className="relative container-custom py-16 md:py-24">
            {/* Zurück Link */}
            <Link 
              href="/kurse"
              className="inline-flex items-center text-white/80 hover:text-white mb-6"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Alle Kurse
            </Link>

            <div className="max-w-3xl">
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="badge-primary">
                  {getCategoryLabel(course.category)}
                </span>
                <span className="bg-white/20 text-white text-xs font-medium px-3 py-1 rounded-full">
                  {getLevelLabel(course.level)}
                </span>
              </div>

              {/* Titel */}
              <h1 className="text-3xl md:text-5xl font-bold mb-4">
                {course.title}
              </h1>

              {/* Kurzbeschreibung */}
              {course.short_description && (
                <p className="text-lg text-white/90 mb-6">
                  {course.short_description}
                </p>
              )}

              {/* Meta-Infos */}
              <div className="flex flex-wrap gap-6 text-white/80">
                {course.duration_weeks && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    <span>{course.duration_weeks} Wochen</span>
                  </div>
                )}
                {lessons.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Play className="w-5 h-5" />
                    <span>{lessons.length} Lektionen</span>
                  </div>
                )}
                {course.max_students && (
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    <span>Max. {course.max_students} Teilnehmer</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  <span>Zertifikat</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Hauptinhalt */}
        <section className="py-16">
          <div className="container-custom">
            <div className="grid lg:grid-cols-3 gap-12">
              {/* Linke Spalte - Beschreibung */}
              <div className="lg:col-span-2">
                {/* Vorschau-Video (falls vorhanden) */}
                {course.preview_video_url && (
                  <div className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      Kursvorschau
                    </h2>
                    <VimeoPlayer 
                      videoUrl={course.preview_video_url}
                      title={`Vorschau: ${course.title}`}
                    />
                  </div>
                )}

                {/* Beschreibung */}
                <div className="prose prose-lg max-w-none mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Über diesen Kurs
                  </h2>
                  <div className="text-gray-600 whitespace-pre-line">
                    {course.description}
                  </div>
                </div>

                {/* Lektionen */}
                {lessons.length > 0 && (
                  <div className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      Kursinhalt ({lessons.length} Lektionen)
                    </h2>
                    <div className="space-y-3">
                      {lessons.map((lesson, index) => (
                        <Link
                          key={lesson.id}
                          href={`/kurse/${course.slug}/lektion/${lesson.slug}`}
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
                          {lesson.is_free_preview && (
                            <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                              Vorschau
                            </span>
                          )}
                          <Play className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lehrer */}
                {teacher && (
                  <div className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      Ihr Lehrer
                    </h2>
                    <div className="flex items-start gap-6 p-6 bg-gray-50 rounded-xl">
                      {/* Foto */}
                      <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {teacher.photo_url ? (
                          <img 
                            src={getMediaUrl(teacher.photo_url)}
                            alt={teacher.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-10 h-10 text-primary-500" />
                        )}
                      </div>
                      
                      {/* Info */}
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {teacher.name}
                        </h3>
                        {teacher.bio && (
                          <p className="text-gray-600 mt-2 line-clamp-3">
                            {teacher.bio}
                          </p>
                        )}
                        {teacher.qualifications && (
                          <p className="text-sm text-gray-500 mt-2">
                            {teacher.qualifications}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Rechte Spalte - Buchung */}
              <div className="lg:col-span-1">
                <div className="sticky top-24 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                  {/* Preis */}
                  <div className="p-6 border-b border-gray-100">
                    {course.price > 0 ? (
                      <div className="text-center">
                        <span className="text-4xl font-bold text-gray-900">
                          €{course.price}
                        </span>
                        <span className="text-gray-500 ml-2">
                          pro Kurs
                        </span>
                      </div>
                    ) : (
                      <div className="text-center">
                        <span className="text-4xl font-bold text-green-600">
                          Kostenlos
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3 text-gray-600">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span>Lebenslanger Zugang</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span>Zertifikat nach Abschluss</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span>Live-Unterricht via Zoom</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span>Aufzeichnungen verfügbar</span>
                    </div>
                  </div>

                  {/* CTA Buttons */}
                  <div className="p-6 bg-gray-50 space-y-3">
                    <Link 
                      href="/registrieren"
                      className="btn-primary w-full text-center"
                    >
                      Jetzt einschreiben
                    </Link>
                    <Link 
                      href="/kontakt"
                      className="btn-outline w-full text-center"
                    >
                      Fragen? Kontaktieren Sie uns
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
