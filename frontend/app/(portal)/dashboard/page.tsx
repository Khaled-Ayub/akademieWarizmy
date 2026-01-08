// ===========================================
// WARIZMY EDUCATION - Studenten Dashboard
// ===========================================
// Hauptübersicht für eingeloggte Studenten

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Award,
  Play,
  ChevronRight,
  Video,
  MapPin,
  Users,
  Loader2
} from 'lucide-react';
import { dashboardApi, sessionsApi } from '@/lib/api';

// =========================================
// Typen
// =========================================
interface DashboardStats {
  active_courses: number;
  avg_progress: number;
  sessions_this_week: number;
  certificates: number;
}

interface UpcomingSession {
  id: string;
  title: string;
  course: string;
  date: string;
  time: string;
  duration: number;
  type: string;
  teacher: string;
  confirmed: boolean | null;
}

interface MyCourse {
  id: string;
  title: string;
  progress: number;
  next_lesson: string;
  total_lessons: number;
  completed_lessons: number;
}

interface PVLStatus {
  course_name: string;
  attendance_required: number;
  current_attendance: number;
  videos_required: number;
  current_videos: number;
  can_take_exam: boolean;
}

interface DashboardData {
  stats: DashboardStats;
  upcoming_sessions: UpcomingSession[];
  my_courses: MyCourse[];
  pvl_status: PVLStatus | null;
}

// =========================================
// Statistik-Karte
// =========================================
function StatCard({ 
  title, 
  value, 
  subtitle,
  icon: Icon,
  color = 'primary',
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string;
  icon: any;
  color?: 'primary' | 'green' | 'orange' | 'purple';
}) {
  const colors = {
    primary: 'bg-primary-100 text-primary-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

// =========================================
// Kommende Session Karte
// =========================================
function SessionCard({ session, onConfirm }: { 
  session: UpcomingSession;
  onConfirm: (id: string, attending: boolean) => void;
}) {
  const typeIcons = {
    online: Video,
    onsite: MapPin,
    hybrid: Users,
  };
  const typeLabels = {
    online: 'Online',
    onsite: 'Vor Ort',
    hybrid: 'Hybrid',
  };
  const TypeIcon = typeIcons[session.type as keyof typeof typeIcons] || Video;

  const sessionDate = new Date(session.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const isToday = sessionDate.toDateString() === today.toDateString();
  const isTomorrow = sessionDate.toDateString() === tomorrow.toDateString();

  const dateLabel = isToday ? 'Heute' : isTomorrow ? 'Morgen' : sessionDate.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <div className={`bg-white rounded-xl border ${isToday ? 'border-primary-300 ring-2 ring-primary-100' : 'border-gray-200'} p-4`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${isToday ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'}`}>
            {dateLabel} • {session.time} Uhr
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <TypeIcon className="w-3.5 h-3.5" />
          <span>{typeLabels[session.type as keyof typeof typeLabels] || session.type}</span>
        </div>
      </div>
      
      <h3 className="font-semibold text-gray-900 mb-1">{session.title}</h3>
      <p className="text-sm text-gray-500 mb-3">{session.course} • {session.teacher}</p>
      
      {/* Teilnahme-Bestätigung */}
      {session.confirmed === null ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 mr-2">Nimmst du teil?</span>
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
        <div className={`flex items-center gap-2 text-sm ${session.confirmed ? 'text-green-600' : 'text-red-600'}`}>
          {session.confirmed ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Du hast zugesagt</span>
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4" />
              <span>Du hast abgesagt</span>
            </>
          )}
          <button className="text-gray-400 hover:text-gray-600 ml-2 text-xs underline">
            Ändern
          </button>
        </div>
      )}
    </div>
  );
}

// =========================================
// Kurs-Fortschritt Karte
// =========================================
function CourseProgressCard({ course }: { course: MyCourse }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:border-primary-300 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-900">{course.title}</h3>
        <span className="text-sm font-medium text-primary-600">{course.progress}%</span>
      </div>
      
      {/* Progress Bar */}
      <div className="h-2 bg-gray-100 rounded-full mb-3 overflow-hidden">
        <div 
          className="h-full bg-primary-500 rounded-full transition-all duration-500"
          style={{ width: `${course.progress}%` }}
        />
      </div>
      
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">
          {course.completed_lessons}/{course.total_lessons} Lektionen
        </span>
        <Link 
          href={`/dashboard/meine-kurse/${course.id}`}
          className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
        >
          Weiter
          <Play className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

// =========================================
// PVL Status Widget
// =========================================
function PVLStatusWidget({ pvl }: { pvl: PVLStatus }) {
  const attendanceMet = pvl.current_attendance >= pvl.attendance_required;
  const videosMet = pvl.current_videos >= pvl.videos_required;
  const canTakeExam = attendanceMet && videosMet;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">PVL-Status</h3>
        <span className="text-xs text-gray-500">{pvl.course_name}</span>
      </div>
      
      {/* Anwesenheit */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-600">Anwesenheit</span>
          <span className={attendanceMet ? 'text-green-600 font-medium' : 'text-orange-600 font-medium'}>
            {pvl.current_attendance}% / {pvl.attendance_required}%
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${attendanceMet ? 'bg-green-500' : 'bg-orange-500'}`}
            style={{ width: `${Math.min(pvl.current_attendance, 100)}%` }}
          />
        </div>
      </div>
      
      {/* Video-Fortschritt */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-600">Video-Lektionen</span>
          <span className={videosMet ? 'text-green-600 font-medium' : 'text-orange-600 font-medium'}>
            {pvl.current_videos}% / {pvl.videos_required}%
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${videosMet ? 'bg-green-500' : 'bg-orange-500'}`}
            style={{ width: `${Math.min(pvl.current_videos, 100)}%` }}
          />
        </div>
      </div>
      
      {/* Prüfungsstatus */}
      <div className={`p-3 rounded-lg ${canTakeExam ? 'bg-green-50' : 'bg-orange-50'}`}>
        <div className="flex items-center gap-2">
          {canTakeExam ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-700">Prüfung möglich!</p>
                <p className="text-xs text-green-600">Du kannst einen Prüfungstermin buchen.</p>
              </div>
            </>
          ) : (
            <>
              <Clock className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-orange-700">PVL noch nicht erfüllt</p>
                <p className="text-xs text-orange-600">
                  {!attendanceMet && `Noch ${pvl.attendance_required - pvl.current_attendance}% Anwesenheit nötig. `}
                  {!videosMet && `Noch ${pvl.videos_required - pvl.current_videos}% Videos nötig.`}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// =========================================
// Hauptseite
// =========================================
export default function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [sessions, setSessions] = useState<UpcomingSession[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardApi.getStudentDashboard();
      setDashboardData(data);
      setSessions(data.upcoming_sessions || []);
    } catch (err: any) {
      console.error('Dashboard laden fehlgeschlagen:', err);
      setError('Dashboard konnte nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAttendance = async (sessionId: string, attending: boolean) => {
    try {
      await sessionsApi.confirmAttendance(sessionId, attending);
      // Update local state
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, confirmed: attending } : s
      ));
    } catch (err) {
      console.error('Bestätigung fehlgeschlagen:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={loadDashboard}
          className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        >
          Erneut versuchen
        </button>
      </div>
    );
  }

  const stats = dashboardData?.stats || { active_courses: 0, avg_progress: 0, sessions_this_week: 0, certificates: 0 };
  const courses = dashboardData?.my_courses || [];
  const pvl = dashboardData?.pvl_status;

  return (
    <div className="space-y-6">
      {/* Begrüßung */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Hier ist deine Übersicht für heute.</p>
      </div>

      {/* Statistiken */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Aktive Kurse"
          value={stats.active_courses}
          subtitle={`${courses.filter(c => c.progress > 0 && c.progress < 100).length} in Bearbeitung`}
          icon={BookOpen}
          color="primary"
        />
        <StatCard
          title="Abgeschlossen"
          value={`${stats.avg_progress}%`}
          subtitle="Ø Fortschritt"
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Diese Woche"
          value={stats.sessions_this_week}
          subtitle="Sessions geplant"
          icon={Calendar}
          color="orange"
        />
        <StatCard
          title="Zertifikate"
          value={stats.certificates}
          subtitle={stats.certificates > 0 ? "Erhalten" : "Noch keine"}
          icon={Award}
          color="purple"
        />
      </div>

      {/* Hauptbereich */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Linke Spalte: Sessions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Kommende Sessions</h2>
            <Link href="/dashboard/kalender" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              Alle anzeigen
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          {sessions.length > 0 ? (
            <div className="space-y-3">
              {sessions.map((session) => (
                <SessionCard 
                  key={session.id} 
                  session={session} 
                  onConfirm={handleConfirmAttendance}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Keine kommenden Sessions.</p>
            </div>
          )}
        </div>

        {/* Rechte Spalte: PVL Status */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Prüfungsvorleistung</h2>
          {pvl ? (
            <PVLStatusWidget pvl={pvl} />
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <p className="text-gray-500">Keine PVL-Daten verfügbar.</p>
            </div>
          )}
        </div>
      </div>

      {/* Meine Kurse */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Meine Kurse</h2>
          <Link href="/dashboard/meine-kurse" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
            Alle Kurse
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        
        {courses.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <CourseProgressCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Du bist noch in keinem Kurs eingeschrieben.</p>
            <Link href="/kurse" className="mt-4 inline-block text-primary-600 hover:text-primary-700 font-medium">
              Kurse entdecken →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

