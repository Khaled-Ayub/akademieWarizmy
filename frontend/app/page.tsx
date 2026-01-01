// ===========================================
// WARIZMY EDUCATION - Startseite
// ===========================================
// Öffentliche Landingpage mit Strapi-Integration

import Link from 'next/link';
import { 
  BookOpen, 
  Users, 
  Award, 
  Play, 
  Calendar, 
  Star,
  ChevronRight,
  CheckCircle,
  Globe,
  Video
} from 'lucide-react';

// Strapi API importieren
import { 
  getCourses, 
  Course, 
  getCategoryLabel, 
  getLevelLabel,
  getStrapiMediaUrl 
} from '@/lib/strapi';

// Hijri Datum + Tages-Empfehlung (Islam)
import { getIslamicDailyInfo } from '@/lib/islamicDate';
import { getDailyGuidances } from '@/lib/strapi';

// Ankündigungs-Banner importieren
import AnnouncementBanner from '@/components/AnnouncementBanner';

// Hero-Sektion
async function HeroSection() {
  const islamicToday = getIslamicDailyInfo();
  const strapiGuidances =
    islamicToday
      ? await getDailyGuidances({
          weekday: islamicToday.weekdayKey,
          isRamadan: islamicToday.isRamadan,
          limit: 3,
        })
      : [];

  const guidanceFromStrapi =
    strapiGuidances.length > 0
      ? strapiGuidances.map((g) => g.attributes.text).join(' ')
      : null;

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Hintergrund mit Muster */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-background-light to-secondary-500/10 pattern-overlay" />
      
      {/* Content */}
      <div className="container-custom relative z-10">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-6 animate-fade-in">
            <Star className="w-4 h-4 fill-current" />
            <span>Neue Kurse verfügbar</span>
          </div>

          {/* Hijri Datum + Wochentag + Empfehlung */}
          {islamicToday && (
            <div className="mb-6 inline-flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white/80 px-4 py-3 backdrop-blur-sm animate-fade-in">
              <div className="text-sm text-gray-700">
                <span className="font-semibold">
                  {islamicToday.weekday}
                </span>
                <span className="mx-2 text-gray-300">•</span>
                <span>
                  {islamicToday.hijriFormatted}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium text-gray-700">Empfehlung für heute:</span>{' '}
                {guidanceFromStrapi || islamicToday.guidance}
              </div>
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

// Features-Sektion
function FeaturesSection() {
  const features = [
    {
      icon: Video,
      title: 'Live-Unterricht',
      description: 'Interaktive Online-Stunden mit erfahrenen Lehrern via Zoom.',
    },
    {
      icon: Users,
      title: 'Vor-Ort-Kurse',
      description: 'Präsenzunterricht für intensives Lernen in kleinen Gruppen.',
    },
    {
      icon: Play,
      title: 'Aufzeichnungen',
      description: 'Alle Lektionen als Video verfügbar – lernen Sie in Ihrem Tempo.',
    },
    {
      icon: Calendar,
      title: 'Flexibler Stundenplan',
      description: 'Wählen Sie Zeiten, die zu Ihrem Alltag passen.',
    },
    {
      icon: Award,
      title: 'Zertifikate',
      description: 'Offizielle Zertifikate nach erfolgreicher Prüfung.',
    },
    {
      icon: Globe,
      title: 'Von überall',
      description: 'Lernen Sie von zu Hause oder unterwegs – weltweit.',
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="section-title">Warum WARIZMY?</h2>
          <p className="section-subtitle mx-auto">
            Wir bieten Ihnen die beste Lernerfahrung mit modernen Methoden 
            und traditionellem Wissen.
          </p>
        </div>
        
        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              className="card-hover p-8 group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center mb-6 group-hover:bg-primary-500 transition-colors duration-300">
                <feature.icon className="w-7 h-7 text-primary-500 group-hover:text-white transition-colors duration-300" />
              </div>
              
              {/* Content */}
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Kurse-Preview (Daten werden von Strapi geladen)
async function CoursesPreview() {
  // Kurse von Strapi abrufen
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
                Fügen Sie Kurse in Strapi hinzu, um sie hier anzuzeigen.
              </p>
              <Link 
                href="http://localhost:1337/admin" 
                target="_blank"
                className="btn-primary mt-4 inline-block"
              >
                Strapi Admin öffnen
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
        
        {/* Course Cards - Dynamisch von Strapi */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.slice(0, 6).map((course) => (
            <div key={course.id} className="card-hover">
              {/* Thumbnail */}
              <div className="h-48 bg-gradient-to-br from-primary-500 to-primary-600 relative overflow-hidden">
                {course.attributes.thumbnail?.data ? (
                  <img 
                    src={getStrapiMediaUrl(course.attributes.thumbnail.data)}
                    alt={course.attributes.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 pattern-overlay opacity-20" />
                )}
                <div className="absolute bottom-4 left-4">
                  <span className="badge-primary">
                    {getCategoryLabel(course.attributes.category)}
                  </span>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="badge-secondary">
                    {getLevelLabel(course.attributes.level)}
                  </span>
                  {course.attributes.price > 0 && (
                    <span className="text-sm font-semibold text-primary-600">
                      €{course.attributes.price}
                    </span>
                  )}
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {course.attributes.title}
                </h3>
                
                {course.attributes.short_description && (
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {course.attributes.short_description}
                  </p>
                )}
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  {course.attributes.duration_weeks && (
                    <span className="text-sm text-gray-500">
                      {course.attributes.duration_weeks} Wochen
                    </span>
                  )}
                  <Link 
                    href={`/kurse/${course.attributes.slug}`}
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

// Header Komponente
function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading text-xl font-bold text-gray-900">
              WARIZMY
            </span>
          </Link>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/kurse" className="text-gray-600 hover:text-primary-500 font-medium">
              Kurse
            </Link>
            <Link href="/ueber-uns" className="text-gray-600 hover:text-primary-500 font-medium">
              Über uns
            </Link>
            <Link href="/faq" className="text-gray-600 hover:text-primary-500 font-medium">
              FAQ
            </Link>
            <Link href="/kontakt" className="text-gray-600 hover:text-primary-500 font-medium">
              Kontakt
            </Link>
          </nav>
          
          {/* Auth Buttons */}
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

// Footer Komponente
function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-16">
      <div className="container-custom">
        <div className="grid md:grid-cols-4 gap-12">
          {/* Logo & Info */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="font-heading text-xl font-bold text-white">
                WARIZMY
              </span>
            </div>
            <p className="text-gray-400 max-w-md">
              Ihre Plattform für Arabisch und islamische Bildung. 
              Lernen Sie mit erfahrenen Lehrern – online oder vor Ort.
            </p>
          </div>
          
          {/* Links */}
          <div>
            <h4 className="font-bold text-white mb-4">Links</h4>
            <ul className="space-y-2">
              <li><Link href="/kurse" className="hover:text-primary-400">Kurse</Link></li>
              <li><Link href="/ueber-uns" className="hover:text-primary-400">Über uns</Link></li>
              <li><Link href="/faq" className="hover:text-primary-400">FAQ</Link></li>
              <li><Link href="/kontakt" className="hover:text-primary-400">Kontakt</Link></li>
            </ul>
          </div>
          
          {/* Legal */}
          <div>
            <h4 className="font-bold text-white mb-4">Rechtliches</h4>
            <ul className="space-y-2">
              <li><Link href="/impressum" className="hover:text-primary-400">Impressum</Link></li>
              <li><Link href="/datenschutz" className="hover:text-primary-400">Datenschutz</Link></li>
              <li><Link href="/agb" className="hover:text-primary-400">AGB</Link></li>
            </ul>
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
      <Header />
      {/* Ankündigungs-Banner - fixed unter der Navbar */}
      <AnnouncementBanner />
      {/* Extra padding für Header (64px) + Banner (ca. 40px) */}
      <main className="pt-[104px]">
        {/* @ts-expect-error Async Server Component */}
        <HeroSection />
        <FeaturesSection />
        {/* @ts-expect-error Async Server Component */}
        <CoursesPreview />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}

