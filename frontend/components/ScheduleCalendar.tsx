// ===========================================
// WARIZMY EDUCATION - Schedule Calendar Component
// ===========================================
// Kalender-Komponente für Unterrichtstermine auf der Startseite
// Zeigt Termine für Heute, diese Woche und diesen Monat

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  Users,
  ChevronLeft,
  ChevronRight,
  BookOpen
} from 'lucide-react';

// ===========================================
// TYPEN (angepasst für FastAPI - flache Struktur)
// ===========================================

// Schedule-Typ basierend auf FastAPI-Schema
interface Schedule {
  id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  type: 'online' | 'vor_ort' | 'hybrid';
  location?: string;
  zoom_link?: string;
  description?: string;
  max_participants?: number;
  color: 'primary' | 'secondary' | 'green' | 'amber' | 'red' | 'purple';
  course?: {
    id: string;
    title: string;
    slug: string;
  };
  teacher?: {
    id: string;
    name: string;
  };
}

// View-Typ für Tab-Auswahl
type ViewType = 'heute' | 'woche' | 'monat';

// ===========================================
// HILFSFUNKTIONEN
// ===========================================

/**
 * Formatiert ein Datum in deutsches Format
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });
}

/**
 * Formatiert ein Datum als vollständiges deutsches Datum
 */
function formatFullDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Formatiert eine Zeit (HH:MM:SS -> HH:MM)
 */
function formatTime(timeString: string): string {
  return timeString.slice(0, 5);
}

/**
 * Gibt das Start- und Enddatum für einen Zeitraum zurück
 */
function getDateRange(view: ViewType): { from: string; to: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let from = new Date(today);
  let to = new Date(today);
  
  switch (view) {
    case 'heute':
      // Nur heute
      break;
    case 'woche':
      // Aktuelle Woche (Montag bis Sonntag)
      const dayOfWeek = today.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      from.setDate(today.getDate() + diffToMonday);
      to.setDate(from.getDate() + 6);
      break;
    case 'monat':
      // Aktueller Monat
      from = new Date(today.getFullYear(), today.getMonth(), 1);
      to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      break;
  }
  
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
}

/**
 * Gruppiert Termine nach Datum
 */
function groupByDate(schedules: Schedule[]): Map<string, Schedule[]> {
  const grouped = new Map<string, Schedule[]>();
  
  schedules.forEach(schedule => {
    const date = schedule.date;
    if (!grouped.has(date)) {
      grouped.set(date, []);
    }
    grouped.get(date)!.push(schedule);
  });
  
  return grouped;
}

/**
 * Gibt die Farb-Klassen für eine Schedule-Farbe zurück
 */
function getColorClasses(color: string): { bg: string; border: string; text: string } {
  const colors: Record<string, { bg: string; border: string; text: string }> = {
    primary: { bg: 'bg-primary-50', border: 'border-l-primary-500', text: 'text-primary-700' },
    secondary: { bg: 'bg-secondary-50', border: 'border-l-secondary-500', text: 'text-secondary-700' },
    green: { bg: 'bg-emerald-50', border: 'border-l-emerald-500', text: 'text-emerald-700' },
    amber: { bg: 'bg-amber-50', border: 'border-l-amber-500', text: 'text-amber-700' },
    red: { bg: 'bg-red-50', border: 'border-l-red-500', text: 'text-red-700' },
    purple: { bg: 'bg-purple-50', border: 'border-l-purple-500', text: 'text-purple-700' },
  };
  return colors[color] || colors.primary;
}

/**
 * Gibt das Label für den Unterrichtstyp zurück
 */
function getTypeLabel(type: string): { label: string; icon: typeof Video } {
  switch (type) {
    case 'online':
      return { label: 'Online', icon: Video };
    case 'vor_ort':
      return { label: 'Vor Ort', icon: MapPin };
    case 'hybrid':
      return { label: 'Hybrid', icon: Users };
    default:
      return { label: 'Online', icon: Video };
  }
}

// ===========================================
// KOMPONENTEN
// ===========================================

/**
 * Einzelner Termin-Eintrag - Clean Minimal Design
 */
function ScheduleItem({ schedule }: { schedule: Schedule }) {
  const typeInfo = getTypeLabel(schedule.type);
  const TypeIcon = typeInfo.icon;
  const isLive = schedule.type === 'online';
  
  return (
    <Link 
      href={schedule.course ? `/kurse/${schedule.course.slug}` : '#'}
      className="group flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all duration-200"
    >
      {/* Zeit-Block */}
      <div className="flex-shrink-0 text-center w-14">
        <p className="text-lg font-bold text-gray-900">{formatTime(schedule.start_time)}</p>
        <p className="text-[10px] text-gray-400 uppercase tracking-wider">Uhr</p>
      </div>
      
      {/* Vertikale Linie mit Live-Indikator */}
      <div className="relative flex-shrink-0 w-px h-12 bg-gray-200">
        {isLive && (
          <>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-emerald-500 rounded-full" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
          </>
        )}
        {!isLive && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-gray-300 rounded-full" />
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h4 className="font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
            {schedule.title}
          </h4>
          {isLive && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase rounded tracking-wider">
              <Video className="w-3 h-3" />
              Live
            </span>
          )}
        </div>
        {schedule.course && (
          <p className="text-sm text-gray-500 truncate">{schedule.course.title}</p>
        )}
      </div>
      
      {/* Dauer */}
      <div className="flex-shrink-0 text-right">
        <p className="text-xs text-gray-400">
          {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
        </p>
        {schedule.location && schedule.type !== 'online' && (
          <p className="text-xs text-gray-400 flex items-center gap-1 justify-end mt-0.5">
            <MapPin className="w-3 h-3" />
            {schedule.location}
          </p>
        )}
      </div>
      
      {/* Hover Arrow */}
      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
    </Link>
  );
}

/**
 * Tagesgruppe mit Datum-Header - Clean Minimal
 */
function DayGroup({ date, schedules }: { date: string; schedules: Schedule[] }) {
  const isToday = date === new Date().toISOString().split('T')[0];
  const dateObj = new Date(date);
  const weekday = dateObj.toLocaleDateString('de-DE', { weekday: 'short' });
  const day = dateObj.getDate();
  
  return (
    <div className="mb-6 last:mb-0">
      {/* Kompakter Datum-Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
          isToday 
            ? 'bg-primary-500 text-white' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          <span>{weekday}</span>
          <span className="font-bold">{day}</span>
          {isToday && (
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          )}
        </div>
        <span className="text-xs text-gray-400">
          {schedules.length} {schedules.length === 1 ? 'Termin' : 'Termine'}
        </span>
      </div>
      
      {/* Termine Liste */}
      <div className="space-y-2">
        {schedules.map(schedule => (
          <ScheduleItem key={schedule.id} schedule={schedule} />
        ))}
      </div>
    </div>
  );
}

/**
 * Leerer Zustand - Minimal
 */
function EmptyState({ view }: { view: ViewType }) {
  const messages: Record<ViewType, string> = {
    heute: 'Heute keine Termine',
    woche: 'Diese Woche keine Termine',
    monat: 'Keine Termine in diesem Monat',
  };
  
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
        <Calendar className="w-6 h-6 text-gray-400" />
      </div>
      <p className="text-sm text-gray-500 mb-4">{messages[view]}</p>
      <Link 
        href="/kurse"
        className="text-sm font-medium text-primary-600 hover:text-primary-700"
      >
        Kurse entdecken →
      </Link>
    </div>
  );
}

// ===========================================
// HAUPTKOMPONENTE
// ===========================================

export default function ScheduleCalendar() {
  // State
  const [view, setView] = useState<ViewType>('woche');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Mounted state für Hydration - verhindert Server/Client Mismatch
  const [mounted, setMounted] = useState(false);
  
  // Erst nach Mount rendern (verhindert Hydration-Fehler)
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Daten laden wenn sich die Ansicht ändert
  useEffect(() => {
    async function fetchSchedules() {
      setLoading(true);
      setError(null);
      
      try {
        const { from, to } = getDateRange(view);
        const res = await fetch(`/api/schedules?from=${from}&to=${to}`);
        
        if (!res.ok) {
          throw new Error('Fehler beim Laden');
        }
        
        const data = await res.json();
        // FastAPI gibt direkt ein Array oder { data: [...] } zurück
        setSchedules(Array.isArray(data) ? data : (data.data || data.items || []));
      } catch (err) {
        console.error('Schedule fetch error:', err);
        setError('Termine konnten nicht geladen werden.');
        setSchedules([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchSchedules();
  }, [view]);
  
  // Termine nach Datum gruppieren
  const groupedSchedules = groupByDate(schedules);
  
  // Tab-Konfiguration
  const tabs: { id: ViewType; label: string }[] = [
    { id: 'heute', label: 'Heute' },
    { id: 'woche', label: 'Diese Woche' },
    { id: 'monat', label: 'Dieser Monat' },
  ];
  
  // Skeleton während SSR
  if (!mounted) {
    return (
      <section className="py-16 bg-gray-50/50">
        <div className="container-custom">
          <div className="animate-pulse">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gray-200 rounded-xl" />
              <div className="h-6 bg-gray-200 rounded w-32" />
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-5 h-[300px]" />
          </div>
        </div>
      </section>
    );
  }
  
  return (
    <section className="py-16 bg-gray-50/50">
      <div className="container-custom">
        {/* Clean Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Stundenplan</h2>
              <p className="text-sm text-gray-500">Kommende Unterrichte</p>
            </div>
          </div>
          
          {/* Kompakte Tab-Navigation */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setView(tab.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  view === tab.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Clean Container */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 min-h-[300px]">
          {/* Mini Header */}
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
            <p className="text-sm text-gray-500">
              {view === 'heute' && formatFullDate(new Date().toISOString())}
              {view === 'woche' && (() => {
                const { from, to } = getDateRange('woche');
                return `${formatDate(from)} – ${formatDate(to)}`;
              })()}
              {view === 'monat' && new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
            </p>
            {!loading && schedules.length > 0 && (
              <span className="text-xs font-medium text-gray-400">
                {schedules.length} {schedules.length === 1 ? 'Termin' : 'Termine'}
              </span>
            )}
          </div>
          
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          
          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-8">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}
          
          {/* Empty State */}
          {!loading && !error && schedules.length === 0 && (
            <EmptyState view={view} />
          )}
          
          {/* Schedule List */}
          {!loading && !error && schedules.length > 0 && (
            <div>
              {Array.from(groupedSchedules.entries()).map(([date, daySchedules]) => (
                <DayGroup key={date} date={date} schedules={daySchedules} />
              ))}
            </div>
          )}
        </div>
        
        {/* Clean Footer Link */}
        <div className="flex justify-center mt-5">
          <Link 
            href="/kurse" 
            className="text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors"
          >
            Alle Kurse ansehen →
          </Link>
        </div>
      </div>
    </section>
  );
}

