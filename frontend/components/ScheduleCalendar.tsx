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
 * Einzelner Termin-Eintrag - Modernes Card-Design
 */
function ScheduleItem({ schedule }: { schedule: Schedule }) {
  const typeInfo = getTypeLabel(schedule.type);
  const TypeIcon = typeInfo.icon;
  
  // Dynamische Farben basierend auf Kurstyp
  const getGradient = () => {
    if (schedule.title.toLowerCase().includes('arabisch') || schedule.title.toLowerCase().includes('a1') || schedule.title.toLowerCase().includes('a2')) {
      return 'from-emerald-500 to-teal-600';
    }
    if (schedule.title.toLowerCase().includes('islam') || schedule.title.toLowerCase().includes('quran')) {
      return 'from-amber-500 to-orange-600';
    }
    return 'from-primary-500 to-primary-600';
  };
  
  return (
    <div className="group relative bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100">
      {/* Gradient Accent Bar */}
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${getGradient()}`} />
      
      <div className="p-5">
        {/* Header mit Zeit-Badge und Typ */}
        <div className="flex items-start justify-between mb-4">
          {/* Zeit-Badge */}
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${getGradient()} text-white text-sm font-semibold shadow-sm`}>
            <Clock className="w-4 h-4" />
            {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
          </div>
          
          {/* Typ-Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
            <TypeIcon className="w-3.5 h-3.5" />
            {typeInfo.label}
          </div>
        </div>
        
        {/* Klassen-Titel */}
        <h4 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
          {schedule.title}
        </h4>
        
        {/* Kurs-Info Card */}
        {schedule.course && (
          <Link 
            href={`/kurse/${schedule.course.slug}`}
            className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-primary-50 transition-colors mb-3 group/link"
          >
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getGradient()} flex items-center justify-center shadow-sm`}>
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 group-hover/link:text-primary-600 truncate">
                {schedule.course.title}
              </p>
              <p className="text-xs text-gray-500">Zum Kurs →</p>
            </div>
          </Link>
        )}
        
        {/* Footer mit zusätzlichen Infos */}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          {/* Lehrer */}
          {schedule.teacher && (
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-gray-500" />
              </div>
              <span>{schedule.teacher.name}</span>
            </div>
          )}
          
          {/* Ort */}
          {schedule.location && schedule.type !== 'online' && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>{schedule.location}</span>
            </div>
          )}
          
          {/* Online-Badge */}
          {schedule.type === 'online' && (
            <div className="flex items-center gap-1.5 text-emerald-600">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium">Live Online</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Tagesgruppe mit Datum-Header und Terminen - Premium Design
 */
function DayGroup({ date, schedules }: { date: string; schedules: Schedule[] }) {
  const isToday = date === new Date().toISOString().split('T')[0];
  const dateObj = new Date(date);
  const weekday = dateObj.toLocaleDateString('de-DE', { weekday: 'long' });
  const dayMonth = dateObj.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
  
  return (
    <div className="mb-8 last:mb-0">
      {/* Datum-Header */}
      <div className="flex items-center gap-4 mb-4">
        <div className={`relative flex flex-col items-center justify-center w-16 h-16 rounded-2xl shadow-sm ${
          isToday 
            ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white' 
            : 'bg-white border border-gray-200 text-gray-700'
        }`}>
          {isToday && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
          )}
          <span className="text-2xl font-bold leading-none">
            {dateObj.getDate()}
          </span>
          <span className={`text-[10px] uppercase tracking-wider font-medium ${isToday ? 'text-primary-100' : 'text-gray-400'}`}>
            {dateObj.toLocaleDateString('de-DE', { month: 'short' })}
          </span>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className={`text-lg font-bold ${isToday ? 'text-primary-600' : 'text-gray-900'}`}>
              {isToday ? '✨ Heute' : weekday}
            </p>
            {isToday && (
              <span className="px-2 py-0.5 text-xs font-semibold bg-primary-100 text-primary-700 rounded-full">
                Aktuell
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {schedules.length} Unterricht{schedules.length !== 1 ? 'e' : ''} geplant
          </p>
        </div>
      </div>
      
      {/* Termine Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {schedules.map(schedule => (
          <ScheduleItem key={schedule.id} schedule={schedule} />
        ))}
      </div>
    </div>
  );
}

/**
 * Leerer Zustand - Premium Design
 */
function EmptyState({ view }: { view: ViewType }) {
  const messages: Record<ViewType, { title: string; subtitle: string }> = {
    heute: { 
      title: 'Heute keine Unterrichte', 
      subtitle: 'Genieße deinen freien Tag! 🌟' 
    },
    woche: { 
      title: 'Diese Woche keine Unterrichte', 
      subtitle: 'Schau bald wieder vorbei für neue Termine.' 
    },
    monat: { 
      title: 'Diesen Monat keine Unterrichte', 
      subtitle: 'Neue Kurse starten bald!' 
    },
  };
  
  return (
    <div className="text-center py-16">
      <div className="relative inline-block mb-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto">
          <Calendar className="w-10 h-10 text-gray-400" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center">
          <span className="text-lg">📅</span>
        </div>
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{messages[view].title}</h3>
      <p className="text-gray-500 mb-6">{messages[view].subtitle}</p>
      <Link 
        href="/kurse"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors shadow-sm"
      >
        <BookOpen className="w-4 h-4" />
        Alle Kurse entdecken
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
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container-custom">
        {/* Header mit dekorativem Element */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/25 mb-6">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Unterrichtsplan
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Übersicht über alle anstehenden Unterrichte und Live-Sessions
          </p>
        </div>
        
        {/* Tab-Navigation - Premium */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex gap-1 p-1.5 bg-white rounded-2xl shadow-sm border border-gray-200">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setView(tab.id)}
                className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  view === tab.id
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/25'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Kalender-Inhalt */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 min-h-[400px]">
          {/* Datum-Header für aktuelle Ansicht */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">
                Zeitraum
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {view === 'heute' && formatFullDate(new Date().toISOString())}
                {view === 'woche' && (() => {
                  const { from, to } = getDateRange('woche');
                  return `${formatDate(from)} - ${formatDate(to)}`;
                })()}
                {view === 'monat' && new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div>
              {!loading && (
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-full border border-emerald-200">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-semibold text-emerald-700">
                    {schedules.length} Termin{schedules.length !== 1 ? 'e' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
                <div className="absolute inset-0 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
              </div>
              <p className="mt-4 text-sm text-gray-500 font-medium">Lade Termine...</p>
            </div>
          )}
          
          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <p className="text-red-600 font-medium">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Erneut versuchen →
              </button>
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
        
        {/* Footer CTA */}
        <div className="text-center mt-10">
          <Link 
            href="/kurse" 
            className="group inline-flex items-center gap-3 px-6 py-3 bg-white rounded-2xl shadow-sm border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center group-hover:bg-primary-500 transition-colors">
              <BookOpen className="w-5 h-5 text-primary-600 group-hover:text-white transition-colors" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Alle Kurse entdecken</p>
              <p className="text-sm text-gray-500">Finde den passenden Kurs für dich</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
          </Link>
        </div>
      </div>
    </section>
  );
}

