// ===========================================
// WARIZMY EDUCATION - Lektionsinhalt
// ===========================================
// Client Component mit dem eigentlichen Lektionsinhalt

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ChevronLeft,
  ChevronRight,
  Play,
  FileText,
  Download,
  CheckCircle,
  CheckCircle2,
  List,
} from 'lucide-react';
import { getMediaUrl, Lesson } from '@/lib/content';
import { usersApi } from '@/lib/api';
import { notifyProgressChange } from '@/hooks/useProgressSync';
import VimeoPlayer from '@/components/VimeoPlayer';
import LessonNavbar from '@/components/LessonNavbar';
import LessonAccessCheck from './LessonAccessCheck';

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
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2 text-gray-700 font-medium">
          <List className="w-4 h-4" />
          <span>Kursinhalt</span>
          <span className="text-gray-400 text-sm ml-auto">{lessons.length} Lektionen</span>
        </div>
      </div>
      
      <div className="max-h-[60vh] overflow-y-auto">
        {lessons.map((lesson, index) => {
          const isActive = lesson.slug === currentSlug;
          const lessonUrl = `/kurse/${courseSlug}/lektion/${lesson.slug}`;

          return (
            <Link
              key={lesson.id}
              href={lessonUrl}
              className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0 transition-colors ${
                isActive 
                  ? 'bg-primary-50 border-l-4 border-l-primary-500' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium ${
                isActive 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {index + 1}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className={`text-sm truncate ${isActive ? 'text-primary-700 font-medium' : 'text-gray-700'}`}>
                    {lesson.title}
                  </p>
                </div>
              </div>
              
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
// Hauptkomponente
// =========================================
interface LessonContentProps {
  lesson: any;
  course: any;
  allLessons: Lesson[];
  currentIndex: number;
  prevLesson: Lesson | null;
  nextLesson: Lesson | null;
  params: { slug: string; lessonSlug: string };
}

export default function LessonContent({
  lesson,
  course,
  allLessons,
  currentIndex,
  prevLesson,
  nextLesson,
  params
}: LessonContentProps) {
  const [isCompleted, setIsCompleted] = useState(false);
  const [markingComplete, setMarkingComplete] = useState(false);

  // Lektion beim Öffnen automatisch als abgeschlossen markieren
  useEffect(() => {
    const markAsCompleted = async () => {
      if (!lesson.id || markingComplete) {
        return;
      }
      
      setMarkingComplete(true);
      try {
        const lessonId = String(lesson.id);
        const courseId = String(course.id);
        
        console.log('Markiere Lektion als abgeschlossen:', { lessonId, courseId, lesson });
        
        const response = await usersApi.markLessonComplete(lessonId);
        console.log('Lektion markiert:', response);
        
        setIsCompleted(true);
        
        // Benachrichtige alle Listener (z.B. Dashboard) über die Änderung
        notifyProgressChange({
          lessonId,
          courseId,
          completed: true
        });
      } catch (err: any) {
        console.error('Fehler beim Markieren der Lektion:', {
          error: err,
          errorMessage: err?.message,
          response: err?.response?.data,
          lessonId: lesson.id
        });
      } finally {
        setMarkingComplete(false);
      }
    };
    
    markAsCompleted();
  }, [lesson.id, course.id]);

  return (
    <LessonAccessCheck
      courseId={course.id}
      courseSlug={course.slug}
      courseTitle={course.title}
      lessonIndex={currentIndex}
      isFreePreview={lesson.is_free_preview}
    >
      <LessonNavbar courseTitle={course.title} courseSlug={course.slug} />
      
      <main className="pt-14 min-h-screen bg-gray-100">
        <div className="container-custom py-6">
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Hauptinhalt */}
            <div className="lg:col-span-3 space-y-6">
              {/* Video nur anzeigen wenn vorhanden */}
              {(lesson.vimeo_video_id || lesson.vimeo_video_url) && (
                <VimeoPlayer 
                  videoId={lesson.vimeo_video_id || undefined} 
                  videoUrl={lesson.vimeo_video_url || undefined}
                  title={lesson.title}
                />
              )}
              
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-sm text-primary-600 font-medium mb-1">
                      Lektion {currentIndex + 1} von {allLessons.length}
                    </p>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {lesson.title}
                    </h1>
                  </div>
                </div>
                
                {lesson.description && (
                  <div className="prose prose-gray max-w-none text-gray-600 mb-6">
                    <div dangerouslySetInnerHTML={{ __html: lesson.description }} />
                  </div>
                )}

                {lesson.text_content && (
                  <div className="prose prose-gray max-w-none text-gray-700 mb-6 p-4 bg-white rounded-lg border border-gray-200">
                    <div dangerouslySetInnerHTML={{ __html: lesson.text_content }} />
                  </div>
                )}

                {lesson.pdf_url && (
                  <div className="mb-6 space-y-3">
                    <div className="rounded-lg overflow-hidden border border-gray-200 bg-white">
                      <object
                        data={getMediaUrl(lesson.pdf_url)}
                        type="application/pdf"
                        className="w-full h-[70vh]"
                      >
                        <iframe
                          src={getMediaUrl(lesson.pdf_url)}
                          title={lesson.pdf_name || 'PDF'}
                          className="w-full h-[70vh]"
                          loading="lazy"
                        />
                      </object>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <a
                        href={getMediaUrl(lesson.pdf_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium transition-colors"
                      >
                        PDF in neuem Tab
                      </a>
                      <a
                        href={getMediaUrl(lesson.pdf_url)}
                        download
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
                      >
                        <Download className="w-5 h-5" />
                        {lesson.pdf_name || 'PDF herunterladen'}
                      </a>
                    </div>
                  </div>
                )}

                {/* Lektion bereits abgeschlossen */}
                {isCompleted && (
                  <div className="py-4 border-t border-gray-100">
                    <div className="flex items-center justify-between gap-2 bg-green-50 px-4 py-3 rounded-lg">
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-medium">Lektion abgeschlossen!</span>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            await usersApi.updateLessonProgress(String(lesson.id), { completed: false });
                            setIsCompleted(false);
                            notifyProgressChange({ lessonId: String(lesson.id), courseId: String(course.id), completed: false });
                          } catch (err) {
                            console.error('Fehler beim Zurücksetzen:', err);
                          }
                        }}
                        className="text-sm text-gray-500 hover:text-gray-700 underline"
                      >
                        Wiederholen
                      </button>
                    </div>
                  </div>
                )}
                
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
                      href="/dashboard/meine-kurse"
                      className="flex items-center gap-2 text-green-600 hover:text-green-700 transition-colors"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Kurs abschließen</span>
                    </Link>
                  )}
                </div>
              </div>
              
              <MaterialsSection materials={lesson.materials} />
            </div>
            
            {/* Sidebar */}
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
    </LessonAccessCheck>
  );
}
