// ===========================================
// WARIZMY EDUCATION - 404 Fehlerseite
// ===========================================
// Wird angezeigt wenn eine Seite nicht gefunden wird

import Link from 'next/link';
import { BookOpen, Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <div className="text-center max-w-2xl mx-auto">
        {/* 404 Animation */}
        <div className="relative mb-8">
          {/* Große 404 Zahl */}
          <div className="text-[150px] md:text-[200px] font-bold text-gray-100 leading-none select-none">
            404
          </div>
          
          {/* Überlagernde Animation */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* Schwebender Icon */}
              <div className="w-24 h-24 rounded-2xl bg-primary-500 flex items-center justify-center shadow-xl animate-bounce">
                <BookOpen className="w-12 h-12 text-white" />
              </div>
              
              {/* Dekorative Kreise */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-secondary-400 rounded-full opacity-60 animate-pulse" />
              <div className="absolute -bottom-2 -left-6 w-6 h-6 bg-primary-300 rounded-full opacity-60 animate-pulse" style={{ animationDelay: '500ms' }} />
            </div>
          </div>
        </div>
        
        {/* Text */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Seite nicht gefunden
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
          Die gesuchte Seite existiert leider nicht oder wurde verschoben. 
          Keine Sorge, wir helfen Ihnen weiter!
        </p>
        
        {/* Aktionen */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link 
            href="/"
            className="btn-primary inline-flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Zur Startseite
          </Link>
          <Link 
            href="/kurse"
            className="btn-outline inline-flex items-center justify-center gap-2"
          >
            <Search className="w-5 h-5" />
            Kurse durchsuchen
          </Link>
        </div>
        
        {/* Hilfreiche Links */}
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">
            Das könnte Ihnen helfen:
          </h2>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <Link 
              href="/kurse"
              className="p-3 rounded-xl bg-gray-50 hover:bg-primary-50 text-gray-700 hover:text-primary-700 transition-colors"
            >
              📚 Alle Kurse
            </Link>
            <Link 
              href="/faq"
              className="p-3 rounded-xl bg-gray-50 hover:bg-primary-50 text-gray-700 hover:text-primary-700 transition-colors"
            >
              ❓ FAQ
            </Link>
            <Link 
              href="/kontakt"
              className="p-3 rounded-xl bg-gray-50 hover:bg-primary-50 text-gray-700 hover:text-primary-700 transition-colors"
            >
              📧 Kontakt
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
