// ===========================================
// WARIZMY EDUCATION - Content API Service
// ===========================================
// Service für die Kommunikation mit FastAPI Backend (Kurse, Content)

// =========================================
// Konfiguration
// =========================================
const API_URL_SERVER = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const API_URL_CLIENT = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const API_URL = typeof window === 'undefined' ? API_URL_SERVER : API_URL_CLIENT;

// =========================================
// TypeScript Typen (angepasst für FastAPI)
// =========================================

// Kurs
export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  thumbnail_url: string | null;
  preview_video_url: string | null;
  price: number;
  price_type: 'one_time' | 'subscription' | 'both';
  subscription_price: number | null;
  course_type: 'course' | 'seminar';
  category: 'arabic' | 'islamic';
  level: 'beginner' | 'intermediate' | 'advanced';
  book_affiliate_link: string | null;
  book_pdf_url: string | null;
  duration_weeks: number | null;
  max_students: number | null;
  order: number;
  is_active: boolean;
  is_featured: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  lesson_count: number;
  total_duration_minutes: number;
  teachers: Teacher[];
  lessons?: Lesson[];
}

// Lektion
export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  slug: string;
  description: string | null;
  order: number;
  vimeo_video_id: string | null;
  vimeo_video_url: string | null;
  duration_minutes: number | null;
  materials: { name: string; url: string; type: string }[];
  has_quiz: boolean;
  quiz_title: string | null;
  quiz_passing_score: number;
  quiz_questions: QuizQuestion[];
  is_free_preview: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

// Quiz-Frage
export interface QuizQuestion {
  question_text: string;
  question_type: 'multiple_choice' | 'true_false';
  options: string[];
  correct_answer: number;
  explanation: string | null;
}

// Lehrer
export interface Teacher {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  qualifications: string | null;
  email: string | null;
  photo_url: string | null;
  order: number;
  is_active: boolean;
  created_at: string;
}

// Testimonial
export interface Testimonial {
  id: string;
  name: string;
  content: string;
  rating: number;
  photo_url: string | null;
  course_id: string | null;
  is_featured: boolean;
  is_published: boolean;
  order: number;
  created_at: string;
}

// FAQ
export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  order: number;
  is_published: boolean;
  created_at: string;
}

// Ankündigung
export interface Announcement {
  id: string;
  text: string;
  link_url: string | null;
  link_text: string;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  priority: number;
  is_visible: boolean;
  created_at: string;
}

// Tageshinweis
export interface DailyGuidance {
  id: string;
  title: string | null;
  text: string;
  link_url: string | null;
  link_text: string;
  weekday: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday' | 'everyday';
  ramadan_mode: 'only' | 'exclude' | 'both';
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  priority: number;
  created_at: string;
}

// Paginierte Response
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
}

// =========================================
// Hilfsfunktionen
// =========================================

/**
 * Baut die vollständige URL für Medien
 */
export function getMediaUrl(url: string | null | undefined): string {
  if (!url) {
    return '/placeholder-image.jpg';
  }
  
  // Wenn URL bereits absolut ist
  if (url.startsWith('http')) {
    return url;
  }
  
  // Relative URL mit API-URL kombinieren
  return url;
}

/**
 * Kategorie-Label für die Anzeige
 */
export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    arabic: 'Arabisch',
    islamic: 'Islamwissenschaften',
  };
  return labels[category] || category;
}

/**
 * Level-Label für die Anzeige
 */
export function getLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    beginner: 'Anfänger',
    intermediate: 'Fortgeschritten',
    advanced: 'Experte',
  };
  return labels[level] || level;
}

// =========================================
// API Funktionen
// =========================================

/**
 * Generische Fetch-Funktion für FastAPI
 */
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
    // Cache für 60 Sekunden (ISR)
    next: { revalidate: 60 },
    ...options,
  });

  if (!response.ok) {
    console.error(`API Error: ${response.status} ${response.statusText}`);
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}

// =========================================
// Kurse API
// =========================================

/**
 * Alle veröffentlichten Kurse abrufen
 */
export async function getCourses(): Promise<Course[]> {
  try {
    const response = await fetchAPI<PaginatedResponse<Course>>('/courses');
    return response.items || [];
  } catch (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
}

/**
 * Featured Kurse abrufen (für Homepage)
 */
export async function getFeaturedCourses(limit: number = 3): Promise<Course[]> {
  try {
    const response = await fetchAPI<Course[]>(`/courses/featured?limit=${limit}`);
    return response || [];
  } catch (error) {
    console.error('Error fetching featured courses:', error);
    return [];
  }
}

/**
 * Einzelnen Kurs per Slug abrufen
 */
export async function getCourseBySlug(slug: string): Promise<Course | null> {
  try {
    const course = await fetchAPI<Course>(`/courses/${slug}`);
    return course || null;
  } catch (error) {
    console.error('Error fetching course:', error);
    return null;
  }
}

/**
 * Kurse nach Kategorie abrufen
 */
export async function getCoursesByCategory(category: string): Promise<Course[]> {
  try {
    const response = await fetchAPI<PaginatedResponse<Course>>(`/courses?category=${category}`);
    return response.items || [];
  } catch (error) {
    console.error('Error fetching courses by category:', error);
    return [];
  }
}

// =========================================
// Lektionen API
// =========================================

/**
 * Einzelne Lektion per Slug abrufen (inkl. Kurs-Info für Navigation)
 * Direkter Aufruf des Backend-Endpoints für volle Daten
 */
export async function getLessonBySlug(
  courseSlug: string,
  lessonSlug: string
): Promise<{ lesson: Lesson; course: Course; allLessons: Lesson[] } | null> {
  try {
    // Direkt vom Backend laden (inkl. Kurs-Details für Navigation)
    const response = await fetch(`${API_URL}/courses/${courseSlug}/lessons/${lessonSlug}`, {
      cache: 'no-store',
    });
    
    if (!response.ok) {
      // Fallback: Kurs laden und Lektion daraus extrahieren
      const course = await getCourseBySlug(courseSlug);
      if (!course) return null;
      
      const allLessons = course.lessons || [];
      const lesson = allLessons.find(l => l.slug === lessonSlug);
      
      if (!lesson) return null;
      
      return { lesson, course, allLessons };
    }
    
    const lesson = await response.json();
    
    // Kurs für Navigation laden
    const course = await getCourseBySlug(courseSlug);
    if (!course) return null;
    
    return { 
      lesson, 
      course, 
      allLessons: course.lessons || [] 
    };
  } catch (error) {
    console.error('Error fetching lesson:', error);
    return null;
  }
}

/**
 * Alle Lektionen eines Kurses abrufen (sortiert nach order)
 */
export async function getLessonsByCourse(courseSlug: string): Promise<Lesson[]> {
  try {
    const course = await getCourseBySlug(courseSlug);
    return course?.lessons || [];
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return [];
  }
}

// =========================================
// Lehrer API
// =========================================

/**
 * Alle Lehrer abrufen
 */
export async function getTeachers(): Promise<Teacher[]> {
  try {
    const teachers = await fetchAPI<Teacher[]>('/content/teachers');
    return teachers || [];
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return [];
  }
}

/**
 * Einzelnen Lehrer per Slug abrufen
 */
export async function getTeacherBySlug(slug: string): Promise<Teacher | null> {
  try {
    const teacher = await fetchAPI<Teacher>(`/content/teachers/${slug}`);
    return teacher || null;
  } catch (error) {
    console.error('Error fetching teacher:', error);
    return null;
  }
}

// =========================================
// Testimonials API
// =========================================

/**
 * Testimonials abrufen
 */
export async function getTestimonials(limit?: number): Promise<Testimonial[]> {
  try {
    const limitParam = limit ? `?limit=${limit}` : '';
    const testimonials = await fetchAPI<Testimonial[]>(`/content/testimonials${limitParam}`);
    return testimonials || [];
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return [];
  }
}

// =========================================
// FAQ API
// =========================================

/**
 * FAQs abrufen
 */
export async function getFAQs(): Promise<FAQ[]> {
  try {
    const faqs = await fetchAPI<FAQ[]>('/content/faqs');
    return faqs || [];
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return [];
  }
}

/**
 * FAQs nach Kategorie abrufen
 */
export async function getFAQsByCategory(category: string): Promise<FAQ[]> {
  try {
    const faqs = await fetchAPI<FAQ[]>(`/content/faqs?category=${category}`);
    return faqs || [];
  } catch (error) {
    console.error('Error fetching FAQs by category:', error);
    return [];
  }
}

// =========================================
// Ankündigungs API
// =========================================

/**
 * Aktive Ankündigungen abrufen
 */
export async function getAnnouncements(): Promise<Announcement[]> {
  try {
    const announcements = await fetchAPI<Announcement[]>('/content/announcements');
    return announcements || [];
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return [];
  }
}

// =========================================
// Tageshinweise API
// =========================================

/**
 * Tageshinweis für heute abrufen
 */
export async function getDailyGuidances(params: {
  weekday: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  isRamadan: boolean;
  limit?: number;
}): Promise<DailyGuidance[]> {
  try {
    const guidance = await fetchAPI<DailyGuidance>(`/content/daily-guidance?is_ramadan=${params.isRamadan}`);
    return guidance ? [guidance] : [];
  } catch (error) {
    console.error('Error fetching daily guidances:', error);
    return [];
  }
}

