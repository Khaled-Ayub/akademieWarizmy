// ===========================================
// WARIZMY EDUCATION - Strapi API Service
// ===========================================
// Service für die Kommunikation mit Strapi CMS

// =========================================
// Konfiguration
// =========================================
// Für Server-Side: Docker-Netzwerk nutzen (strapi:1337)
// Für Client-Side: localhost nutzen (wird vom Browser aufgerufen)
const STRAPI_URL_SERVER = process.env.STRAPI_URL_SERVER || 'http://strapi:1337';
const STRAPI_URL_CLIENT = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const STRAPI_URL = typeof window === 'undefined' ? STRAPI_URL_SERVER : STRAPI_URL_CLIENT;
const STRAPI_API_URL = `${STRAPI_URL}/api`;

// API Token für authentifizierte Anfragen
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || '4e9bca1c92293ed1805c3e627f5d09d03d26bdec4eb6efb23279a9380d3a83591ffc3b0c71331fe13b52cc9b342e37264307d3b2f2019b6e924611208e387a386abd47a3871509271f729f1e57ca00cd8a1e5baa7f1adb4b9bde6aa2ca37b69284eeb9dcc16d98ef6cb6cf5661dd756ba73e2ecb965bf88763e7a5f9d34b185e';

// =========================================
// TypeScript Typen für Strapi Responses
// =========================================

// Basis-Attribute von Strapi
export interface StrapiAttributes {
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

// Strapi Media Format
export interface StrapiMedia {
  id: number;
  attributes: {
    name: string;
    url: string;
    formats?: {
      thumbnail?: { url: string };
      small?: { url: string };
      medium?: { url: string };
      large?: { url: string };
    };
  };
}

// Kurs Content-Type
export interface Course {
  id: number;
  attributes: StrapiAttributes & {
    title: string;
    slug: string;
    description: string;
    short_description?: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    category: 'arabic' | 'quran' | 'islamic_studies' | 'other';
    price: number;
    duration_weeks?: number;
    max_students?: number;
    is_active: boolean;
    is_featured?: boolean;
    thumbnail?: { data: StrapiMedia };
    teacher?: { data: Teacher };
    lessons?: { data: Lesson[] };
  };
}

// Lektion Content-Type
export interface Lesson {
  id: number;
  attributes: StrapiAttributes & {
    title: string;
    description?: string;
    order: number;
    duration_minutes?: number;
    vimeo_id?: string;
    is_free?: boolean;
    course?: { data: Course };
  };
}

// Lehrer Content-Type
export interface Teacher {
  id: number;
  attributes: StrapiAttributes & {
    name: string;
    slug: string;
    bio?: string;
    short_bio?: string;
    qualifications?: string;
    photo?: { data: StrapiMedia };
  };
}

// Testimonial Content-Type
export interface Testimonial {
  id: number;
  attributes: StrapiAttributes & {
    name: string;
    content: string;
    rating: number;
    course?: { data: Course };
    photo?: { data: StrapiMedia };
  };
}

// FAQ Content-Type
export interface FAQ {
  id: number;
  attributes: StrapiAttributes & {
    question: string;
    answer: string;
    order?: number;
    category?: string;
  };
}

// Strapi Collection Response
export interface StrapiResponse<T> {
  data: T[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

// Strapi Single Response
export interface StrapiSingleResponse<T> {
  data: T;
  meta: {};
}

// =========================================
// Hilfsfunktionen
// =========================================

/**
 * Baut die vollständige URL für Strapi-Medien
 */
export function getStrapiMediaUrl(media: StrapiMedia | null | undefined): string {
  if (!media?.attributes?.url) {
    return '/placeholder-image.jpg'; // Fallback
  }
  
  const url = media.attributes.url;
  
  // Wenn URL bereits absolut ist, direkt zurückgeben
  if (url.startsWith('http')) {
    return url;
  }
  
  // Relative URL mit Strapi-URL kombinieren
  return `${STRAPI_URL}${url}`;
}

/**
 * Kategorie-Label für die Anzeige
 */
export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    arabic: 'Arabisch',
    quran: 'Quran',
    islamic_studies: 'Islamwissenschaften',
    other: 'Sonstiges',
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
 * Generische Fetch-Funktion für Strapi
 * Verwendet API-Token für authentifizierte Anfragen
 */
async function fetchStrapi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${STRAPI_API_URL}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      // API-Token für Authentifizierung
      'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
    },
    // Cache für 60 Sekunden (ISR)
    next: { revalidate: 60 },
    ...options,
  });

  if (!response.ok) {
    console.error(`Strapi API Error: ${response.status} ${response.statusText}`);
    throw new Error(`Strapi API Error: ${response.status}`);
  }

  return response.json();
}

// =========================================
// Kurse API
// =========================================

/**
 * Alle veröffentlichten Kurse abrufen
 * Hinweis: Strapi gibt nur veröffentlichte Einträge zurück (publishedAt != null)
 */
export async function getCourses(): Promise<Course[]> {
  try {
    const response = await fetchStrapi<StrapiResponse<Course>>(
      '/courses?populate=*&sort=createdAt:desc'
    );
    return response.data || [];
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
    const response = await fetchStrapi<StrapiResponse<Course>>(
      `/courses?populate=*&filters[is_active][$eq]=true&filters[is_featured][$eq]=true&pagination[limit]=${limit}&sort=createdAt:desc`
    );
    return response.data;
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
    const response = await fetchStrapi<StrapiResponse<Course>>(
      `/courses?filters[slug][$eq]=${slug}&populate[thumbnail]=*&populate[teacher][populate]=photo&populate[lessons]=*`
    );
    return response.data[0] || null;
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
    const response = await fetchStrapi<StrapiResponse<Course>>(
      `/courses?populate=*&filters[is_active][$eq]=true&filters[category][$eq]=${category}&sort=createdAt:desc`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching courses by category:', error);
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
    const response = await fetchStrapi<StrapiResponse<Teacher>>(
      '/teachers?populate=*'
    );
    return response.data;
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
    const response = await fetchStrapi<StrapiResponse<Teacher>>(
      `/teachers?filters[slug][$eq]=${slug}&populate=*`
    );
    return response.data[0] || null;
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
    const limitParam = limit ? `&pagination[limit]=${limit}` : '';
    const response = await fetchStrapi<StrapiResponse<Testimonial>>(
      `/testimonials?populate=*&sort=createdAt:desc${limitParam}`
    );
    return response.data;
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
    const response = await fetchStrapi<StrapiResponse<FAQ>>(
      '/faqs?sort=order:asc'
    );
    return response.data;
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
    const response = await fetchStrapi<StrapiResponse<FAQ>>(
      `/faqs?filters[category][$eq]=${category}&sort=order:asc`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching FAQs by category:', error);
    return [];
  }
}

// =========================================
// Ankündigungs API
// =========================================

// Ankündigung Content-Type
export interface Announcement {
  id: number;
  attributes: StrapiAttributes & {
    text: string;
    is_active: boolean;
    priority: number;
    start_date?: string;
    end_date?: string;
    link_url?: string;
    link_text?: string;
  };
}

// Tageshinweis (Wochentag / Ramadan)
export interface DailyGuidance {
  id: number;
  attributes: StrapiAttributes & {
    title?: string;
    text: string;
    weekday:
      | 'monday'
      | 'tuesday'
      | 'wednesday'
      | 'thursday'
      | 'friday'
      | 'saturday'
      | 'sunday'
      | 'everyday';
    ramadan_mode: 'only' | 'exclude' | 'both';
    is_active: boolean;
    priority: number;
    start_date?: string;
    end_date?: string;
    link_url?: string;
    link_text?: string;
  };
}

/**
 * Aktive Ankündigungen abrufen
 * Filtert nach: aktiv, veröffentlicht, im gültigen Zeitraum
 */
export async function getAnnouncements(): Promise<Announcement[]> {
  try {
    const now = new Date().toISOString();
    
    // Einfacher Filter für aktive Ankündigungen
    const response = await fetchStrapi<StrapiResponse<Announcement>>(
      `/announcements?filters[is_active][$eq]=true&sort=priority:desc&pagination[limit]=10`
    );
    
    // Client-seitig nach Datum filtern (Strapi OR-Filter kann komplex sein)
    const filtered = response.data.filter(a => {
      const startOk = !a.attributes.start_date || new Date(a.attributes.start_date) <= new Date();
      const endOk = !a.attributes.end_date || new Date(a.attributes.end_date) >= new Date();
      return startOk && endOk;
    });
    
    return filtered;
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return [];
  }
}

// =========================================
// Tageshinweise API
// =========================================

/**
 * Tageshinweise für einen Wochentag abrufen.
 *
 * Regel:
 * - Holt Einträge für `weekday` ODER `everyday`
 * - Filtert nach aktiv
 * - Filtert nach Ramadan-Mode (only/exclude/both)
 * - Filtert client-/serverseitig nach Datum (start/end) wie bei announcements
 */
export async function getDailyGuidances(params: {
  weekday:
    | 'monday'
    | 'tuesday'
    | 'wednesday'
    | 'thursday'
    | 'friday'
    | 'saturday'
    | 'sunday';
  isRamadan: boolean;
  limit?: number;
}): Promise<DailyGuidance[]> {
  const { weekday, isRamadan, limit = 5 } = params;

  try {
    const ramadanMode = isRamadan ? 'only' : 'exclude';

    // Wir holen (weekday OR everyday) und (ramadan_mode == both OR ramadan_mode == ramadanMode)
    // Hinweis: Strapi OR-Filter ist etwas verbose, daher bauen wir den Query direkt.
    const endpoint =
      `/daily-guidances?` +
      `filters[is_active][$eq]=true&` +
      `filters[$or][0][weekday][$eq]=${weekday}&` +
      `filters[$or][1][weekday][$eq]=everyday&` +
      `filters[$and][0][$or][0][ramadan_mode][$eq]=both&` +
      `filters[$and][0][$or][1][ramadan_mode][$eq]=${ramadanMode}&` +
      `sort=priority:desc&` +
      `pagination[limit]=${limit}`;

    const response = await fetchStrapi<StrapiResponse<DailyGuidance>>(endpoint);

    // Datum-Fenster filtern (start/end)
    const now = new Date();
    const filtered = (response.data || []).filter((d) => {
      const startOk = !d.attributes.start_date || new Date(d.attributes.start_date) <= now;
      const endOk = !d.attributes.end_date || new Date(d.attributes.end_date) >= now;
      return startOk && endOk;
    });

    return filtered;
  } catch (error) {
    console.error('Error fetching daily guidances:', error);
    return [];
  }
}

