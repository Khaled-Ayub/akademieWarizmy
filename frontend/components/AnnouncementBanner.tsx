// ===========================================
// WARIZMY EDUCATION - Ankündigungs-Banner
// ===========================================
// Laufband-Banner für Ankündigungen
// Roter Hintergrund, Text scrollt von rechts nach links

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

// =========================================
// TypeScript Typen (neue flache Struktur von FastAPI)
// =========================================

interface Announcement {
  id: string;
  text: string;
  is_active: boolean;
  priority: number;
  start_date?: string;
  end_date?: string;
  link_url?: string;
  link_text?: string;
}

// Props für die Komponente
interface AnnouncementBannerProps {
  // Optional: Feste Ankündigungen (für Server-Side Rendering)
  initialAnnouncements?: Announcement[];
}

// =========================================
// API URL Konfiguration
// =========================================
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// =========================================
// Komponente
// =========================================

export default function AnnouncementBanner({ initialAnnouncements }: AnnouncementBannerProps) {
  // State für Ankündigungen
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements || []);
  // State für Ladezustand
  const [isLoading, setIsLoading] = useState(!initialAnnouncements);
  // State für Animation pausieren (bei Hover)
  const [isPaused, setIsPaused] = useState(false);
  // State für geschlossen
  const [isClosed, setIsClosed] = useState(false);

  // =========================================
  // Ankündigungen laden
  // =========================================
  useEffect(() => {
    // Wenn bereits Daten vorhanden, nicht erneut laden
    if (initialAnnouncements && initialAnnouncements.length > 0) {
      return;
    }

    const fetchAnnouncements = async () => {
      try {
        // Ankündigungen von FastAPI abrufen
        const response = await fetch(`${API_URL}/content/announcements`);

        if (response.ok) {
          const data = await response.json();
          // FastAPI gibt direkt ein Array zurück
          setAnnouncements(data || []);
        }
      } catch (error) {
        console.error('Fehler beim Laden der Ankündigungen:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnnouncements();
    
    // Ankündigungen alle 5 Minuten aktualisieren
    const interval = setInterval(fetchAnnouncements, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [initialAnnouncements]);

  // =========================================
  // Render
  // =========================================

  // Nichts anzeigen wenn keine Ankündigungen, noch lädt oder geschlossen
  if (isLoading || announcements.length === 0 || isClosed) {
    return null;
  }

  // Alle Ankündigungstexte zusammenfügen
  const announcementText = announcements
    .map((a, index) => {
      const text = a.text;
      const linkUrl = a.link_url;
      const linkText = a.link_text || 'Mehr erfahren';
      
      // Mit oder ohne Link
      if (linkUrl) {
        return (
          <span key={a.id} className="inline-flex items-center">
            <span>{text}</span>
            <Link 
              href={linkUrl}
              className="ml-2 underline underline-offset-2 hover:text-white/80 font-semibold"
            >
              {linkText} →
            </Link>
            {/* Trennzeichen zwischen Ankündigungen */}
            {index < announcements.length - 1 && (
              <span className="mx-8 text-white/50">•••</span>
            )}
          </span>
        );
      }
      
      return (
        <span key={a.id}>
          {text}
          {index < announcements.length - 1 && (
            <span className="mx-8 text-white/50">•••</span>
          )}
        </span>
      );
    });

  return (
    <div 
      className="announcement-banner bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white overflow-visible sticky top-0 left-0 right-0 z-50 shadow-lg"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Container für den scrollenden Text */}
      <div className="py-2.5 whitespace-nowrap flex-1">
        {/* Erster Text (scrollt) */}
        <div 
          className={`inline-block animate-marquee ${isPaused ? 'pause-animation' : ''}`}
          style={{
            animationDuration: `${Math.max(20, announcements.length * 15)}s`,
          }}
        >
          <span className="inline-flex items-center text-sm md:text-base tracking-wide font-[var(--font-poppins)]">
            {/* Passende Emojis für roten Hintergrund */}
            {announcementText}
            {/* Leerzeichen am Ende für nahtlosen Übergang */}
            <span className="mx-12 text-white/40">✦</span>
          </span>
        </div>
        
        {/* Duplizierter Text für nahtlose Schleife */}
        <div 
          className={`inline-block animate-marquee ${isPaused ? 'pause-animation' : ''}`}
          style={{
            animationDuration: `${Math.max(20, announcements.length * 15)}s`,
          }}
        >
          <span className="inline-flex items-center text-sm md:text-base tracking-wide font-[var(--font-poppins)]">
            {announcementText}
            <span className="mx-12 text-white/40">✦</span>
          </span>
        </div>
      </div>

      {/* Gradient-Overlay an den Seiten für besseren Übergang */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-red-600 to-transparent pointer-events-none z-10" />
      <div className="absolute right-12 top-0 bottom-0 w-12 bg-gradient-to-l from-red-600 to-transparent pointer-events-none z-10" />
      
      {/* Schließen-Button */}
      <button
        onClick={() => setIsClosed(true)}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-40 p-1 hover:bg-red-700 rounded-full transition-colors bg-red-600"
        aria-label="Ankündigung schließen"
      >
        <X className="w-5 h-5 text-white" />
      </button>
    </div>
  );
}
