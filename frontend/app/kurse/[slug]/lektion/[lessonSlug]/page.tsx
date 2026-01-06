// ===========================================
// WARIZMY EDUCATION - Lektionsseite
// ===========================================
// Video-Player + Navigation + Materialien

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { 
  BookOpen, 
  ChevronLeft,
  ChevronRight,
  Play,
  FileText,
  Download,
  CheckCircle,
  Clock,
  List,
  ClipboardList,
  Calendar,
  Video,
  File,
  AlertCircle,
  GraduationCap
} from 'lucide-react';
import { 
  getLessonBySlug,
  getCourses,
  getLessonsByCourse,
  getMediaUrl,
  Lesson
} from '@/lib/content';

// Vimeo Player Komponente importieren
import VimeoPlayer from '@/components/VimeoPlayer';

// =========================================
// Statische Pfade generieren (für SSG)
// =========================================
export async function generateStaticParams() {
  const courses = await getCourses();
  const params: { slug: string; lessonSlug: string }[] = [];
  
  for (const course of courses) {
    const lessons = await getLessonsByCourse(course.slug);
    for (const lesson of lessons) {
      if (lesson.slug) {
        params.push({
          slug: course.slug,
          lessonSlug: lesson.slug,
        });
      }
    }
  }
  
  return params;
}

// =========================================
// Metadata generieren
// =========================================
export async function generateMetadata({ 
  params 
}: { 
  params: { slug: string; lessonSlug: string } 
}) {
  const data = await getLessonBySlug(params.slug, params.lessonSlug);
  
  if (!data) {
    return { title: 'Lektion nicht gefunden | WARIZMY Education' };
  }
  
  return {
    title: `${data.lesson.title} | ${data.course.title} | WARIZMY Education`,
    description: data.lesson.description || `Lektion aus dem Kurs ${data.course.title}`,
  };
}

// =========================================
// Lektions-Sidebar (Liste aller Lektionen)
// =========================================
function LessonsSidebar({ 
  lessons, 
  currentSlug, 
  courseSlug 
}: { 
  lessons: Lesson[]; 
  currentSlug: string;
  courseSlug: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2 text-gray-700 font-medium">
          <List className="w-4 h-4" />
          <span>Kursinhalt</span>
          <span className="text-gray-400 text-sm ml-auto">{lessons.length} Lektionen</span>
        </div>
      </div>
      
      {/* Lektionsliste */}
      <div className="max-h-[60vh] overflow-y-auto">
        {lessons.map((lesson, index) => {
          const isActive = lesson.slug === currentSlug;
          const lessonUrl = `/kurse/${courseSlug}/lektion/${lesson.slug}`;
          const hasHomework = (lesson as any).has_homework || ((lesson as any).homework && (lesson as any).homework.length > 0);
          
          return (
            <Link
              key={lesson.id}
              href={lessonUrl}
              className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0 transition-colors ${
                isActive 
                  ? 'bg-primary-50 border-l-4 border-l-primary-500' 
                  : hasHomework
                    ? 'bg-amber-50/50 hover:bg-amber-50 border-l-4 border-l-amber-300'
                    : 'hover:bg-gray-50'
              }`}
            >
              {/* Nummer */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium ${
                isActive 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {index + 1}
              </div>
              
              {/* Titel & Dauer */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className={`text-sm truncate ${isActive ? 'text-primary-700 font-medium' : 'text-gray-700'}`}>
                    {lesson.title}
                  </p>
                  {/* Hausaufgaben-Icon */}
                  {hasHomework && (
                    <span className="flex-shrink-0 text-amber-500" title="Hat Hausaufgaben">
                      📝
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {lesson.duration_minutes && (
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {lesson.duration_minutes} Min.
                    </p>
                  )}
                  {hasHomework && (
                    <span className="text-[9px] font-medium text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                      Hausaufgabe
                    </span>
                  )}
                </div>
              </div>
              
              {/* Vorschau-Badge */}
              {lesson.is_free_preview && (
                <span className="text-[10px] font-medium text-green-600 bg-green-100 px-1.5 py-0.5 rounded">
                  Frei
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// =========================================
// Materialien-Sektion
// =========================================
function MaterialsSection({ materials }: { materials?: { name: string; url: string; type: string }[] }) {
  if (!materials || materials.length === 0) return null;
  
  return (
    <div className="mt-8 p-6 bg-gray-50 rounded-xl">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary-500" />
        Materialien
      </h3>
      <div className="space-y-2">
        {materials.map((file, index) => (
          <a
            key={index}
            href={getMediaUrl(file.url)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors group"
          >
            <Download className="w-5 h-5 text-gray-400 group-hover:text-primary-500" />
            <span className="text-sm text-gray-700 group-hover:text-primary-700">
              {file.name || 'Download'}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

// =========================================
// Hausaufgaben-Sektion (Hervorgehoben)
// =========================================
interface HomeworkDisplay {
  id: string;
  title: string;
  description?: string;
  deadline?: string;
  max_points?: number;
  content_type?: string;
  vimeo_video_url?: string;
  text_content?: string;
  pdf_url?: string;
  pdf_name?: string;
  vocabulary_list_id?: string;
  vocabulary_list?: {
    id: string;
    title: string;
    title_arabic?: string;
    slug: string;
    item_count: number;
    level: string;
    word_type: string;
  };
}

function HomeworkSection({ homework }: { homework?: HomeworkDisplay[] }) {
  if (!homework || homework.length === 0) return null;
  
  return (
    <div className="mt-8">
      {/* Hervorgehobener Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-t-xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <ClipboardList className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">📝 Hausaufgaben</h3>
          <p className="text-amber-100 text-sm">Aufgaben zu dieser Lektion</p>
        </div>
      </div>
      
      {/* Hausaufgaben-Inhalt */}
      <div className="border-2 border-t-0 border-amber-200 rounded-b-xl bg-amber-50/30 divide-y divide-amber-100">
        {homework.map((hw, index) => (
          <div key={hw.id || index} className="p-6">
            {/* Titel & Meta */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h4 className="text-lg font-bold text-gray-900">{hw.title}</h4>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  {hw.deadline && (
                    <span className="flex items-center gap-1.5 text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                      <Calendar className="w-4 h-4" />
                      Fällig: {new Date(hw.deadline).toLocaleDateString('de-DE', { 
                        day: '2-digit', 
                        month: 'long', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  )}
                  {hw.max_points && (
                    <span className="flex items-center gap-1.5 text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                      <AlertCircle className="w-4 h-4" />
                      {hw.max_points} Punkte
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Beschreibung */}
            {hw.description && (
              <div className="prose prose-gray max-w-none text-gray-600 mb-4 p-4 bg-white rounded-lg border border-amber-100">
                <div dangerouslySetInnerHTML={{ __html: hw.description }} />
              </div>
            )}
            
            {/* Video (wenn vorhanden) */}
            {hw.vimeo_video_url && (hw.content_type === 'video' || hw.content_type === 'mixed') && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-blue-700 mb-3">
                  <Video className="w-5 h-5" />
                  <span className="font-medium">Erklärungsvideo</span>
                </div>
                <a 
                  href={hw.vimeo_video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Play className="w-4 h-4" />
                  Video ansehen
                </a>
              </div>
            )}
            
            {/* Text-Inhalt (wenn vorhanden) */}
            {hw.text_content && (hw.content_type === 'text' || hw.content_type === 'mixed') && (
              <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 text-gray-700 mb-3">
                  <FileText className="w-5 h-5" />
                  <span className="font-medium">Aufgabenstellung</span>
                </div>
                <div className="prose prose-sm max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: hw.text_content }} />
                </div>
              </div>
            )}
            
            {/* PDF (wenn vorhanden) */}
            {hw.pdf_url && (hw.content_type === 'pdf' || hw.content_type === 'mixed') && (
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 text-red-700 mb-3">
                  <File className="w-5 h-5" />
                  <span className="font-medium">Arbeitsblatt (PDF)</span>
                </div>
                <a 
                  href={getMediaUrl(hw.pdf_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <Download className="w-4 h-4" />
                  {hw.pdf_name || 'PDF herunterladen'}
                </a>
              </div>
            )}
            
            {/* Vokabelliste (wenn zugeordnet) */}
            {hw.vocabulary_list && (
              <div className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 text-purple-700 mb-3">
                  <BookOpen className="w-5 h-5" />
                  <span className="font-medium">📚 Vokabeln lernen</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900">{hw.vocabulary_list.title}</p>
                    {hw.vocabulary_list.title_arabic && (
                      <p className="text-sm text-gray-500 font-arabic" dir="rtl">{hw.vocabulary_list.title_arabic}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {hw.vocabulary_list.item_count} Vokabeln • {hw.vocabulary_list.level.toUpperCase()} •
                      {hw.vocabulary_list.word_type === 'verb' ? ' ⚡ Verben' : hw.vocabulary_list.word_type === 'particle' ? ' 🔗 Partikel' : ' 📦 Nomen'}
                    </p>
                  </div>
                  <Link
                    href={`/vokabeln/${hw.vocabulary_list.slug}`}
                    className="inline-flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-violet-700 transition-all"
                  >
                    <GraduationCap className="w-5 h-5" />
                    Vokabeln lernen
                  </Link>
                </div>
                <p className="text-xs text-purple-600 mt-3">
                  💡 Lerne mit Karteikarten oder teste dein Wissen im Quiz!
                </p>
              </div>
            )}
            
            {/* Abgabe-Button (Platzhalter) */}
            <div className="mt-6 pt-4 border-t border-amber-200">
              <button className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2">
                <ClipboardList className="w-5 h-5" />
                Hausaufgabe abgeben
              </button>
              <p className="text-xs text-center text-gray-500 mt-2">
                Melden Sie sich an, um Ihre Lösung hochzuladen
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =========================================
// Header
// =========================================
function Header({ courseTitle, courseSlug }: { courseTitle: string; courseSlug: string }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="container-custom">
        <div className="flex items-center justify-between h-14">
          {/* Logo + Zurück */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
            </Link>
            <div className="h-6 w-px bg-gray-200" />
            <Link 
              href={`/kurse/${courseSlug}`}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary-500"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{courseTitle}</span>
              <span className="sm:hidden">Zurück</span>
            </Link>
          </div>
          
          {/* Auth */}
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-primary-500">
              Anmelden
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

// =========================================
// Hauptseite
// =========================================
export default async function LessonPage({ 
  params 
}: { 
  params: { slug: string; lessonSlug: string } 
}) {
  // Lektion laden
  const data = await getLessonBySlug(params.slug, params.lessonSlug);
  
  if (!data) {
    notFound();
  }
  
  const { lesson, course, allLessons } = data;
  
  // Navigation: vorherige/nächste Lektion
  const currentIndex = allLessons.findIndex(l => l.slug === params.lessonSlug);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  return (
    <>
      <Header courseTitle={course.title} courseSlug={course.slug} />
      
      <main className="pt-14 min-h-screen bg-gray-100">
        <div className="container-custom py-6">
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Hauptinhalt (Video + Beschreibung) */}
            <div className="lg:col-span-3 space-y-6">
              {/* Video Player */}
              <VimeoPlayer 
                videoId={lesson.vimeo_video_id || undefined} 
                videoUrl={lesson.vimeo_video_url || undefined}
                title={lesson.title}
              />
              
              {/* Lektionstitel + Navigation */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                {/* Titel */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-sm text-primary-600 font-medium mb-1">
                      Lektion {currentIndex + 1} von {allLessons.length}
                    </p>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {lesson.title}
                    </h1>
                  </div>
                  {lesson.duration_minutes && (
                    <div className="flex items-center gap-1.5 text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full text-sm">
                      <Clock className="w-4 h-4" />
                      <span>{lesson.duration_minutes} Min.</span>
                    </div>
                  )}
                </div>
                
                {/* Beschreibung */}
                {lesson.description && (
                  <div className="prose prose-gray max-w-none text-gray-600 mb-6">
                    <div dangerouslySetInnerHTML={{ __html: lesson.description }} />
                  </div>
                )}
                
                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  {prevLesson ? (
                    <Link
                      href={`/kurse/${params.slug}/lektion/${prevLesson.slug}`}
                      className="flex items-center gap-2 text-gray-600 hover:text-primary-500 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                      <div className="text-left">
                        <p className="text-xs text-gray-400">Vorherige</p>
                        <p className="text-sm font-medium truncate max-w-[150px]">
                          {prevLesson.title}
                        </p>
                      </div>
                    </Link>
                  ) : (
                    <div />
                  )}
                  
                  {nextLesson ? (
                    <Link
                      href={`/kurse/${params.slug}/lektion/${nextLesson.slug}`}
                      className="flex items-center gap-2 text-primary-600 hover:text-primary-700 transition-colors"
                    >
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Nächste</p>
                        <p className="text-sm font-medium truncate max-w-[150px]">
                          {nextLesson.title}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  ) : (
                    <Link
                      href={`/kurse/${params.slug}`}
                      className="flex items-center gap-2 text-green-600 hover:text-green-700 transition-colors"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Kurs abschließen</span>
                    </Link>
                  )}
                </div>
              </div>
              
              {/* Materialien */}
              <MaterialsSection materials={lesson.materials} />
              
              {/* Hausaufgaben (hervorgehoben) */}
              <HomeworkSection homework={(lesson as any).homework} />
            </div>
            
            {/* Sidebar (Lektionsliste) */}
            <div className="lg:col-span-1">
              <div className="sticky top-20">
                <LessonsSidebar 
                  lessons={allLessons} 
                  currentSlug={params.lessonSlug}
                  courseSlug={params.slug}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
