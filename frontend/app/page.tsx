// ===========================================
// WARIZMY EDUCATION - Startseite
// ===========================================
// Öffentliche Landingpage mit FastAPI-Integration

import Link from 'next/link';
import Image from 'next/image';
import { 
  BookOpen, 
  ChevronRight,
  CheckCircle,
  Moon
} from 'lucide-react';

// API importieren
import { 
  getCourses, 
  Course, 
  getCategoryLabel, 
  getLevelLabel,
  getMediaUrl 
} from '@/lib/content';

// Hijri Datum + Tages-Empfehlung (Islam)
import { getIslamicDailyInfo } from '@/lib/islamicDate';
import { getDailyGuidances } from '@/lib/content';

// Ankündigungs-Banner importieren
import AnnouncementBanner from '@/components/AnnouncementBanner';

// Kalender-Komponente für Unterrichtstermine
import ScheduleCalendar from '@/components/ScheduleCalendar';

// Newsletter-Komponente
import Newsletter from '@/components/Newsletter';

// Kurs-Suche Komponente
import CourseSearch from '@/components/CourseSearch';

// Neue Navbar-Komponente
import Navbar from '@/components/Navbar';

// Hero-Sektion
async function HeroSection() {
  const islamicToday = getIslamicDailyInfo();
  const dailyGuidances =
    islamicToday
      ? await getDailyGuidances({
          weekday: islamicToday.weekdayKey,
          isRamadan: islamicToday.isRamadan,
          limit: 3,
        })
      : [];

  const guidanceFromAPI =
    dailyGuidances.length > 0
      ? dailyGuidances.map((g) => g.text).join(' ')
      : null;

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Hintergrund mit Muster */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-background-light to-secondary-500/10 pattern-overlay" />
      
      {/* Content */}
      <div className="container-custom relative z-10">
        <div className="max-w-3xl">
          {/* Hijri Datum — kompakt & modern */}
          {islamicToday && (
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/60 px-3 py-1.5 text-xs backdrop-blur-sm animate-fade-in cursor-default" title={guidanceFromAPI || islamicToday.guidance}>
              <Moon className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-800 font-medium">{islamicToday.weekday}</span>
              <span className="text-emerald-300">•</span>
              <span className="text-emerald-700">{islamicToday.hijriFormatted}</span>
            </div>
          )}
          
          {/* Titel */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight animate-slide-up">
            Arabisch & Islamische
            <span className="text-gradient block mt-2">Bildung erleben</span>
          </h1>
          
          {/* Untertitel */}
          <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-2xl animate-slide-up animation-delay-100">
            Lerne Arabisch und islamische Wissenschaften mit erfahrenen Lehrern – 
            online, vor Ort oder hybrid. Flexible Lernformate für jeden Zeitplan.
          </p>
          
          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 animate-slide-up animation-delay-200">
            <Link href="/kurse" className="btn-primary text-lg">
              Kurse entdecken
              <ChevronRight className="w-5 h-5 ml-2" />
            </Link>
            <Link href="/registrieren" className="btn-outline text-lg">
              Kostenlos starten
            </Link>
          </div>
          
          {/* Kurs-Suche */}
          <div className="mt-8 animate-slide-up animation-delay-250">
            <CourseSearch 
              placeholder="Suchen Sie nach Kursen..." 
              className="max-w-xl"
            />
          </div>
          
          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-8 animate-slide-up animation-delay-300">
            <div>
              <div className="text-3xl font-bold text-primary-500">500+</div>
              <div className="text-sm text-gray-600 mt-1">Studenten</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary-500">20+</div>
              <div className="text-sm text-gray-600 mt-1">Kurse</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary-500">98%</div>
              <div className="text-sm text-gray-600 mt-1">Zufriedenheit</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Dekorative Elemente */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 h-full hidden lg:block">
        <div className="absolute right-20 top-20 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl" />
        <div className="absolute right-40 bottom-20 w-48 h-48 bg-secondary-500/20 rounded-full blur-3xl" />
      </div>
    </section>
  );
}

// Kurse-Preview (Daten werden von FastAPI geladen)
async function CoursesPreview() {
  // Kurse von API abrufen
  const courses = await getCourses();
  
  // Fallback wenn keine Kurse vorhanden
  if (courses.length === 0) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="container-custom">
          <div className="text-center">
            <h2 className="section-title">Beliebte Kurse</h2>
            <p className="section-subtitle mx-auto mb-8">
              Unsere Kurse werden bald verfügbar sein.
            </p>
            <div className="bg-white rounded-xl p-8 shadow-sm max-w-md mx-auto">
              <BookOpen className="w-12 h-12 text-primary-500 mx-auto mb-4" />
              <p className="text-gray-600">
                Fügen Sie Kurse im Admin-Bereich hinzu, um sie hier anzuzeigen.
              </p>
              <Link 
                href="/admin/kurse" 
                className="btn-primary mt-4 inline-block"
              >
                Kurse verwalten
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gray-50">
      <div className="container-custom">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
          <div>
            <h2 className="section-title">Beliebte Kurse</h2>
            <p className="section-subtitle">
              Entdecken Sie unsere meistgebuchten Kurse.
            </p>
          </div>
          <Link 
            href="/kurse" 
            className="mt-6 md:mt-0 inline-flex items-center text-primary-500 font-medium hover:text-primary-600"
          >
            Alle Kurse ansehen
            <ChevronRight className="w-5 h-5 ml-1" />
          </Link>
        </div>
        
        {/* Course Cards - Dynamisch von API */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.slice(0, 6).map((course) => (
            <div key={course.id} className="card-hover">
              {/* Thumbnail */}
              <div className="h-48 bg-gradient-to-br from-primary-500 to-primary-600 relative overflow-hidden">
                {course.thumbnail_url ? (
                  <img 
                    src={getMediaUrl(course.thumbnail_url)}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 pattern-overlay opacity-20" />
                )}
                <div className="absolute bottom-4 left-4">
                  <span className="badge-primary">
                    {getCategoryLabel(course.category)}
                  </span>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="badge-secondary">
                    {getLevelLabel(course.level)}
                  </span>
                  {course.price > 0 && (
                    <span className="text-sm font-semibold text-primary-600">
                      €{course.price}
                    </span>
                  )}
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {course.title}
                </h3>
                
                {course.short_description && (
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {course.short_description}
                  </p>
                )}
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  {course.duration_weeks && (
                    <span className="text-sm text-gray-500">
                      {course.duration_weeks} Wochen
                    </span>
                  )}
                  <Link 
                    href={`/kurse/${course.slug}`}
                    className="text-primary-500 font-medium hover:text-primary-600 text-sm"
                  >
                    Details →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// CTA-Sektion
function CTASection() {
  return (
    <section className="py-20 bg-primary-500 relative overflow-hidden">
      {/* Muster */}
      <div className="absolute inset-0 pattern-overlay opacity-10" />
      
      <div className="container-custom relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Bereit, Ihre Reise zu beginnen?
          </h2>
          <p className="text-lg text-white/90 mb-8">
            Registrieren Sie sich jetzt und erhalten Sie Zugang zu unseren 
            kostenlosen Einführungslektionen.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/registrieren" className="btn bg-white text-primary-500 hover:bg-gray-100">
              Jetzt registrieren
            </Link>
            <Link href="/kontakt" className="btn border-2 border-white text-white hover:bg-white/10">
              Beratung anfordern
            </Link>
          </div>
          
          {/* Trust Badges */}
          <div className="mt-12 flex flex-wrap justify-center gap-8 text-white/80 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>Keine Kreditkarte erforderlich</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>Jederzeit kündbar</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>14 Tage Geld-zurück</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Footer Komponente
function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-16">
      <div className="container-custom">
        <div className="grid md:grid-cols-4 gap-12">
          {/* Logo & Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-sm">
                <Image
                  src="/images/Logo/full (1).jpg"
                  alt="WARIZMY Logo"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="font-heading text-xl font-bold text-white">
                WARIZMY
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              Ihre Plattform für Arabisch und islamische Bildung. 
              Lernen Sie mit erfahrenen Lehrern.
            </p>
          </div>
          
          {/* Links */}
          <div>
            <h4 className="font-bold text-white mb-4">Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/kurse" className="hover:text-primary-400 transition-colors">Kurse</Link></li>
              <li><Link href="/lehrer" className="hover:text-primary-400 transition-colors">Lehrer</Link></li>
              <li><Link href="/ueber-uns" className="hover:text-primary-400 transition-colors">Über uns</Link></li>
              <li><Link href="/faq" className="hover:text-primary-400 transition-colors">FAQ</Link></li>
              <li><Link href="/kontakt" className="hover:text-primary-400 transition-colors">Kontakt</Link></li>
            </ul>
          </div>
          
          {/* Legal */}
          <div>
            <h4 className="font-bold text-white mb-4">Rechtliches</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/impressum" className="hover:text-primary-400 transition-colors">Impressum</Link></li>
              <li><Link href="/datenschutz" className="hover:text-primary-400 transition-colors">Datenschutz</Link></li>
              <li><Link href="/agb" className="hover:text-primary-400 transition-colors">AGB</Link></li>
            </ul>
          </div>
          
          {/* Newsletter */}
          <div>
            <Newsletter variant="footer" />
          </div>
        </div>
        
        {/* Copyright */}
        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} WARIZMY Education. Alle Rechte vorbehalten.
        </div>
      </div>
    </footer>
  );
}

// Hauptseite (Server Component mit async)
export default async function HomePage() {
  return (
    <>
      <Navbar />
      {/* Extra padding für Header (64px) */}
      <main className="pt-16">
        <HeroSection />
        {/* Unterrichtsplan-Kalender */}
        <ScheduleCalendar />
        <CoursesPreview />
        {/* Newsletter Sektion */}
        <section className="py-16 bg-white">
          <div className="container-custom max-w-4xl">
            <Newsletter />
          </div>
        </section>
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
