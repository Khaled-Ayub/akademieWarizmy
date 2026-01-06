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
 * Einzelner Termin-Eintrag
 */
function ScheduleItem({ schedule }: { schedule: Schedule }) {
  const colors = getColorClasses(schedule.color);
  const typeInfo = getTypeLabel(schedule.type);
  const TypeIcon = typeInfo.icon;
  
  return (
    <div 
      className={`${colors.bg} border-l-4 ${colors.border} rounded-r-lg p-4 hover:shadow-md transition-shadow`}
    >
      {/* Kopfzeile mit Zeit und Typ */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span className="font-medium">
            {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
          </span>
        </div>
        <div className={`flex items-center gap-1 text-xs ${colors.text} font-medium`}>
          <TypeIcon className="w-3.5 h-3.5" />
          <span>{typeInfo.label}</span>
        </div>
      </div>
      
      {/* Titel */}
      <h4 className="font-bold text-gray-900 mb-1">
        {schedule.title}
      </h4>
      
      {/* Kurs-Link (falls vorhanden) */}
      {schedule.course && (
        <Link 
          href={`/kurse/${schedule.course.slug}`}
          className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 mb-2"
        >
          <BookOpen className="w-3.5 h-3.5" />
          {schedule.course.title}
        </Link>
      )}
      
      {/* Lehrer (falls vorhanden) */}
      {schedule.teacher && (
        <p className="text-sm text-gray-500">
          {schedule.teacher.name}
        </p>
      )}
      
      {/* Ort (falls vor_ort oder hybrid) */}
      {schedule.location && schedule.type !== 'online' && (
        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
          <MapPin className="w-3.5 h-3.5" />
          {schedule.location}
        </p>
      )}
    </div>
  );
}

/**
 * Tagesgruppe mit Datum-Header und Terminen
 */
function DayGroup({ date, schedules }: { date: string; schedules: Schedule[] }) {
  const isToday = date === new Date().toISOString().split('T')[0];
  
  return (
    <div className="mb-6 last:mb-0">
      {/* Datum-Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          isToday ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'
        }`}>
          <span className="text-sm font-bold">
            {new Date(date).getDate()}
          </span>
        </div>
        <div>
          <p className={`font-semibold ${isToday ? 'text-primary-600' : 'text-gray-900'}`}>
            {isToday ? 'Heute' : formatDate(date)}
          </p>
          <p className="text-xs text-gray-500">
            {schedules.length} Unterricht{schedules.length !== 1 ? 'e' : ''}
          </p>
        </div>
      </div>
      
      {/* Termine */}
      <div className="space-y-3 pl-[52px]">
        {schedules.map(schedule => (
          <ScheduleItem key={schedule.id} schedule={schedule} />
        ))}
      </div>
    </div>
  );
}

/**
 * Leerer Zustand
 */
function EmptyState({ view }: { view: ViewType }) {
  const messages: Record<ViewType, string> = {
    heute: 'Heute sind keine Unterrichte geplant.',
    woche: 'Diese Woche sind keine Unterrichte geplant.',
    monat: 'Diesen Monat sind keine Unterrichte geplant.',
  };
  
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
        <Calendar className="w-8 h-8 text-gray-400" />
      </div>
      <p className="text-gray-500">{messages[view]}</p>
      <p className="text-sm text-gray-400 mt-1">
        Neue Termine werden bald hinzugefügt.
      </p>
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
  
  // Skeleton während SSR um Hydration-Fehler zu vermeiden
  if (!mounted) {
    return (
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="bg-gray-100 rounded-2xl p-6 h-[400px]"></div>
          </div>
        </div>
      </section>
    );
  }
  
  return (
    <section className="py-16 bg-white">
      <div className="container-custom">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h2 className="section-title flex items-center gap-3">
              <Calendar className="w-8 h-8 text-primary-500" />
              Unterrichtsplan
            </h2>
            <p className="section-subtitle">
              Übersicht über anstehende Unterrichte und Termine
            </p>
          </div>
        </div>
        
        {/* Tab-Navigation */}
        <div className="flex gap-2 mb-8 bg-gray-100 p-1 rounded-xl w-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${
                view === tab.id
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Kalender-Inhalt */}
        <div className="bg-gray-50 rounded-2xl p-6 min-h-[400px]">
          {/* Datum-Header für aktuelle Ansicht */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <div>
              <p className="text-sm text-gray-500">
                {view === 'heute' && formatFullDate(new Date().toISOString())}
                {view === 'woche' && (() => {
                  const { from, to } = getDateRange('woche');
                  return `${formatDate(from)} - ${formatDate(to)}`;
                })()}
                {view === 'monat' && new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="text-sm text-gray-500">
              {!loading && (
                <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full font-medium">
                  {schedules.length} Termin{schedules.length !== 1 ? 'e' : ''}
                </span>
              )}
            </div>
          </div>
          
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          
          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-12 text-red-500">
              <p>{error}</p>
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
        
        {/* Footer Link */}
        <div className="text-center mt-6">
          <Link 
            href="/stundenplan" 
            className="text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-2"
          >
            Vollständigen Stundenplan ansehen
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

