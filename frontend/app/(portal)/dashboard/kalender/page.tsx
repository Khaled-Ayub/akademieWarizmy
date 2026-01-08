// ===========================================
// WARIZMY EDUCATION - Kalender
// ===========================================
// Übersicht über kommende Sessions und Termine

'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon,
  Clock,
  Video,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';

import { sessionsApi, getErrorMessage } from '@/lib/api';

// =========================================
// Typen
// =========================================
interface Session {
  id: string;
  title: string;
  course_name: string;
  teacher_name: string;
  date: string;
  time: string;
  duration: number;
  type: 'online' | 'onsite' | 'hybrid';
  confirmed: boolean | null;
  zoom_link?: string;
  location?: string;
}

// =========================================
// Hilfsfunktionen
// =========================================
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

const formatDate = (date: Date) => {
  return date.toISOString().split('T')[0];
};

const monthNames = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];

const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

// =========================================
// Session-Karte
// =========================================
function SessionCard({ 
  session, 
  onConfirm 
}: { 
  session: Session;
  onConfirm: (id: string, attending: boolean) => void;
}) {
  const typeIcons = {
    online: Video,
    onsite: MapPin,
    hybrid: Users,
  };
  const typeLabels = {
    online: 'Online (Zoom)',
    onsite: 'Vor Ort',
    hybrid: 'Hybrid',
  };
  const TypeIcon = typeIcons[session.type];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
            <TypeIcon className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{session.title}</h3>
            <p className="text-sm text-gray-500">{session.course_name}</p>
          </div>
        </div>
        <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
          {typeLabels[session.type]}
        </span>
      </div>
      
      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
        <span className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {session.time} Uhr • {session.duration} Min.
        </span>
        <span>mit {session.teacher_name}</span>
      </div>
      
      {/* Teilnahme-Bestätigung */}
      {session.confirmed === null ? (
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
          <span className="text-sm text-gray-600 mr-auto">Nimmst du teil?</span>
          <button 
            onClick={() => onConfirm(session.id, true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
          >
            <CheckCircle2 className="w-4 h-4" />
            Ja
          </button>
          <button 
            onClick={() => onConfirm(session.id, false)}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
          >
            <XCircle className="w-4 h-4" />
            Nein
          </button>
        </div>
      ) : (
        <div className={`flex items-center gap-2 pt-3 border-t border-gray-100 text-sm ${
          session.confirmed ? 'text-green-600' : 'text-red-600'
        }`}>
          {session.confirmed ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Du hast zugesagt</span>
              {session.zoom_link && (
                <a 
                  href={session.zoom_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-primary-600 hover:text-primary-700 font-medium"
                >
                  Zoom beitreten →
                </a>
              )}
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4" />
              <span>Du hast abgesagt</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// =========================================
// Hauptseite
// =========================================
export default function KalenderPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(formatDate(new Date()));
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await sessionsApi.getUpcoming(30);
      setSessions(data || []);
    } catch (err) {
      // Mock-Daten
      setSessions([
        {
          id: '1',
          title: 'Arabisch A1 - Lektion 5',
          course_name: 'Arabisch für Anfänger',
          teacher_name: 'Ustadh Ahmad',
          date: formatDate(new Date()),
          time: '18:00',
          duration: 90,
          type: 'hybrid',
          confirmed: null,
        },
        {
          id: '2',
          title: 'Tajweed Grundlagen',
          course_name: 'Quran Rezitation',
          teacher_name: 'Ustadha Fatima',
          date: formatDate(new Date(Date.now() + 86400000)),
          time: '19:30',
          duration: 60,
          type: 'online',
          confirmed: true,
          zoom_link: 'https://zoom.us/j/123456789',
        },
        {
          id: '3',
          title: 'Sira des Propheten ﷺ',
          course_name: 'Islamische Geschichte',
          teacher_name: 'Sheikh Abdullah',
          date: formatDate(new Date(Date.now() + 2 * 86400000)),
          time: '17:00',
          duration: 90,
          type: 'onsite',
          confirmed: false,
          location: 'Röckstraße 10, 45894 Gelsenkirchen',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (sessionId: string, attending: boolean) => {
    try {
      await sessionsApi.confirmAttendance(sessionId, attending);
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, confirmed: attending } : s
      ));
    } catch (err) {
      // Fallback: Lokal aktualisieren
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, confirmed: attending } : s
      ));
    }
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getSessionsForDate = (date: string) => {
    return sessions.filter(s => s.date === date);
  };

  const selectedSessions = selectedDate ? getSessionsForDate(selectedDate) : [];

  // Kalender-Tage generieren
  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Kalender</h1>
        <p className="text-gray-500 mt-1">Deine kommenden Unterrichtstermine</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Kalender */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          {/* Monat Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={prevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900">
              {monthNames[month]} {year}
            </h2>
            <button 
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Wochentage */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Tage */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="h-12" />;
              }
              
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const daySessions = getSessionsForDate(dateStr);
              const isSelected = selectedDate === dateStr;
              const isToday = dateStr === formatDate(new Date());
              const hasSessions = daySessions.length > 0;
              
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`h-12 rounded-lg text-sm font-medium transition-colors relative ${
                    isSelected
                      ? 'bg-primary-500 text-white'
                      : isToday
                        ? 'bg-primary-100 text-primary-700'
                        : hasSessions
                          ? 'bg-green-50 text-green-700 hover:bg-green-100'
                          : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {day}
                  {hasSessions && !isSelected && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-green-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sessions für ausgewählten Tag */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {selectedDate === formatDate(new Date()) 
              ? 'Heute' 
              : selectedDate 
                ? new Date(selectedDate).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })
                : 'Wähle einen Tag'
            }
          </h2>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
          ) : selectedSessions.length > 0 ? (
            <div className="space-y-3">
              {selectedSessions.map(session => (
                <SessionCard 
                  key={session.id} 
                  session={session}
                  onConfirm={handleConfirm}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <CalendarIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Keine Termine an diesem Tag</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
