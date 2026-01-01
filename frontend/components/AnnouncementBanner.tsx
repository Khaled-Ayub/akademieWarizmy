// ===========================================
// WARIZMY EDUCATION - Ankündigungs-Banner
// ===========================================
// Laufband-Banner für Ankündigungen
// Roter Hintergrund, Text scrollt von rechts nach links

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// =========================================
// TypeScript Typen
// =========================================

// Ankündigung aus Strapi
interface Announcement {
  id: number;
  attributes: {
    text: string;
    is_active: boolean;
    priority: number;
    start_date?: string;
    end_date?: string;
    link_url?: string;
    link_text?: string;
    publishedAt?: string;
  };
}

// Props für die Komponente
interface AnnouncementBannerProps {
  // Optional: Feste Ankündigungen (für Server-Side Rendering)
  initialAnnouncements?: Announcement[];
}

// =========================================
// Strapi URL Konfiguration
// =========================================
const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

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
        // Aktuelles Datum für Filter
        const now = new Date().toISOString();
        
        // Ankündigungen von Strapi abrufen
        // Filter: aktiv, veröffentlicht, im gültigen Zeitraum
        const response = await fetch(
          `${STRAPI_URL}/api/announcements?` +
          `filters[is_active][$eq]=true&` +
          `filters[$or][0][start_date][$null]=true&` +
          `filters[$or][1][start_date][$lte]=${now}&` +
          `filters[$or][0][end_date][$null]=true&` +
          `filters[$or][1][end_date][$gte]=${now}&` +
          `sort=priority:desc&` +
          `pagination[limit]=10`
        );

        if (response.ok) {
          const data = await response.json();
          setAnnouncements(data.data || []);
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

  // Nichts anzeigen wenn keine Ankündigungen oder noch lädt
  if (isLoading || announcements.length === 0) {
    return null;
  }

  // Alle Ankündigungstexte zusammenfügen
  const announcementText = announcements
    .map((a, index) => {
      const text = a.attributes.text;
      const linkUrl = a.attributes.link_url;
      const linkText = a.attributes.link_text || 'Mehr erfahren';
      
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
      className="announcement-banner bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white overflow-hidden fixed top-16 left-0 right-0 z-40 shadow-lg"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Container für den scrollenden Text */}
      <div className="py-2.5 whitespace-nowrap">
        {/* Erster Text (scrollt) */}
        <div 
          className={`inline-block animate-marquee ${isPaused ? 'pause-animation' : ''}`}
          style={{
            animationDuration: `${Math.max(20, announcements.length * 15)}s`,
          }}
        >
          <span className="inline-flex items-center text-sm md:text-base tracking-wide font-[var(--font-poppins)]">
            {/* Passende Emojis für roten Hintergrund */}
            <span className="mr-3 text-lg">🔥</span>
            <span className="mr-2 text-yellow-300">⚡</span>
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
            <span className="mr-3 text-lg">🔥</span>
            <span className="mr-2 text-yellow-300">⚡</span>
            {announcementText}
            <span className="mx-12 text-white/40">✦</span>
          </span>
        </div>
      </div>

      {/* Gradient-Overlay an den Seiten für besseren Übergang */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-red-600 to-transparent pointer-events-none z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-red-600 to-transparent pointer-events-none z-10" />
    </div>
  );
}

