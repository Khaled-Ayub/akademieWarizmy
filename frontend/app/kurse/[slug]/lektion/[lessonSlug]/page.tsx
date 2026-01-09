// ===========================================
// WARIZMY EDUCATION - Lektionsseite
// ===========================================
// Server Component - lädt Daten und gibt an Client weiter

import { notFound } from 'next/navigation';
import { getLessonBySlug } from '@/lib/content';

import LessonContent from './LessonContent';

export const dynamic = 'force-dynamic';
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
    <LessonContent
      lesson={lesson}
      course={course}
      allLessons={allLessons}
      currentIndex={currentIndex}
      prevLesson={prevLesson}
      nextLesson={nextLesson}
      params={params}
    />
  );
}

