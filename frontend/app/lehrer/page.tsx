// ===========================================
// WARIZMY EDUCATION - Lehrer-Profile
// ===========================================
// Übersicht aller Lehrer mit ihren Qualifikationen

import Link from 'next/link';
import { 
  BookOpen, 
  Mail, 
  Award, 
  ChevronRight,
  User,
  GraduationCap
} from 'lucide-react';
import { getMediaUrl } from '@/lib/content';

// ===========================================
// TYPEN (neue flache Struktur von FastAPI)
// ===========================================

interface Teacher {
  id: string;
  name: string;
  slug: string;
  bio?: string;
  photo_url?: string;
  qualifications?: string;
  email?: string;
  courses?: Array<{
    id: string;
    title: string;
    slug: string;
  }>;
}

// ===========================================
// DATEN LADEN
// ===========================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

async function getTeachers(): Promise<Teacher[]> {
  try {
    const res = await fetch(
      `${API_URL}/content/teachers`,
      { next: { revalidate: 300 } }
    );
    
    if (!res.ok) return [];
    
    const data = await res.json();
    return data || [];
  } catch (error) {
    console.error('Failed to fetch teachers:', error);
    return [];
  }
}

// ===========================================
// METADATA
// ===========================================

export const metadata = {
  title: 'Unsere Lehrer | WARIZMY Education',
  description: 'Lernen Sie unsere erfahrenen Lehrer kennen – Experten für Arabisch und islamische Wissenschaften.',
};

// ===========================================
// HEADER
// ===========================================

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
            <Link href="/kurse" className="text-gray-600 hover:text-primary-500 font-medium">
              Kurse
            </Link>
            <Link href="/lehrer" className="text-primary-500 font-medium">
              Lehrer
            </Link>
            <Link href="/faq" className="text-gray-600 hover:text-primary-500 font-medium">
              FAQ
            </Link>
            <Link href="/kontakt" className="text-gray-600 hover:text-primary-500 font-medium">
              Kontakt
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

// ===========================================
// LEHRER KARTE
// ===========================================

function TeacherCard({ teacher }: { teacher: Teacher }) {
  const photoUrl = teacher.photo_url ? getMediaUrl(teacher.photo_url) : null;
  const courseCount = teacher.courses?.length || 0;
  
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 group">
      {/* Foto */}
      <div className="aspect-[4/3] bg-gradient-to-br from-primary-100 to-secondary-100 relative overflow-hidden">
        {photoUrl ? (
          <img 
            src={photoUrl}
            alt={teacher.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="w-24 h-24 text-primary-300" />
          </div>
        )}
        {/* Overlay bei Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      {/* Info */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
          {teacher.name}
        </h3>
        
        {/* Qualifikationen */}
        {teacher.qualifications && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">
            {teacher.qualifications}
          </p>
        )}
        
        {/* Bio */}
        {teacher.bio && (
          <p className="text-gray-600 text-sm line-clamp-3 mb-4">
            {teacher.bio}
          </p>
        )}
        
        {/* Stats */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <GraduationCap className="w-4 h-4" />
            <span>{courseCount} Kurs{courseCount !== 1 ? 'e' : ''}</span>
          </div>
          
          {teacher.slug && (
            <Link 
              href={`/lehrer/${teacher.slug}`}
              className="text-primary-600 hover:text-primary-700 font-medium text-sm inline-flex items-center gap-1"
            >
              Profil ansehen
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ===========================================
// LEERER ZUSTAND
// ===========================================

function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
        <User className="w-10 h-10 text-gray-400" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Lehrer werden bald hinzugefügt
      </h2>
      <p className="text-gray-600 max-w-md mx-auto">
        Unsere erfahrenen Lehrer werden hier vorgestellt. 
        Schauen Sie bald wieder vorbei!
      </p>
    </div>
  );
}

// ===========================================
// HAUPTSEITE
// ===========================================

export default async function LehrerPage() {
  const teachers = await getTeachers();
  
  return (
    <>
      <Header />
      
      <main className="pt-16 min-h-screen bg-gray-50">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-500 text-white py-20">
          <div className="container-custom">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Unsere Lehrer
              </h1>
              <p className="text-xl text-white/90">
                Lernen Sie von erfahrenen Experten für Arabisch und islamische Wissenschaften.
                Unsere Lehrer bringen jahrelange Erfahrung und Leidenschaft mit.
              </p>
            </div>
          </div>
        </section>
        
        {/* Lehrer-Grid */}
        <section className="py-16">
          <div className="container-custom">
            {teachers.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {teachers.map(teacher => (
                  <TeacherCard key={teacher.id} teacher={teacher} />
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </div>
        </section>
        
        {/* CTA */}
        <section className="py-16 bg-white">
          <div className="container-custom text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Werden Sie Teil unseres Teams
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-8">
              Sie sind Experte für Arabisch oder islamische Wissenschaften und möchten 
              Ihr Wissen weitergeben? Wir freuen uns auf Ihre Bewerbung.
            </p>
            <Link href="/kontakt" className="btn-primary">
              Jetzt bewerben
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
