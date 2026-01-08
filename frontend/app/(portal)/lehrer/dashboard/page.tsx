// ===========================================
// WARIZMY EDUCATION - Lehrer Dashboard
// ===========================================
// Hauptübersicht für eingeloggte Lehrer

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ClipboardCheck,
  ChevronRight,
  Video,
  MapPin,
  FileText,
  UserCheck,
  UserX,
  Loader2
} from 'lucide-react';
import { dashboardApi } from '@/lib/api';

// =========================================
// Typen
// =========================================
interface TeacherStats {
  classes: number;
  students: number;
  sessions_today: number;
  sessions_week: number;
  pending_exams: number;
}

interface TodaySession {
  id: string;
  title: string;
  class: string;
  time: string;
  duration: number;
  type: string;
  students: number;
  confirmed: number;
  location: string;
  status: string;
}

interface MyClass {
  id: string;
  name: string;
  course: string;
  students: number;
  next_session: string | null;
  progress: number;
}

interface PendingExam {
  id: string;
  student: string;
  course: string;
  date: string;
  time: string;
  status: string;
}

interface AttendanceAlert {
  session_id: string;
  title: string;
  date: string;
  present: number;
  absent: number;
  excused: number;
  needs_review: boolean;
}

interface TeacherDashboardData {
  stats: TeacherStats;
  todays_sessions: TodaySession[];
  my_classes: MyClass[];
  pending_exams: PendingExam[];
  attendance_alerts: AttendanceAlert[];
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
// Heutige Session Karte
// =========================================
function TodaySessionCard({ session }: { session: TodaySession }) {
  const typeIcons = {
    online: Video,
    onsite: MapPin,
    hybrid: Users,
  };
  const TypeIcon = typeIcons[session.type as keyof typeof typeIcons] || Video;

  const statusColors = {
    upcoming: 'bg-blue-100 text-blue-700',
    live: 'bg-green-100 text-green-700 animate-pulse',
    completed: 'bg-gray-100 text-gray-600',
  };

  const statusLabels = {
    upcoming: 'Geplant',
    live: 'LIVE',
    completed: 'Beendet',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[session.status as keyof typeof statusColors] || statusColors.upcoming}`}>
            {statusLabels[session.status as keyof typeof statusLabels] || session.status}
          </span>
          <span className="text-sm text-gray-500">{session.time} Uhr • {session.duration} Min.</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <TypeIcon className="w-3.5 h-3.5" />
        </div>
      </div>
      
      <h3 className="font-semibold text-gray-900 mb-1">{session.title}</h3>
      <p className="text-sm text-gray-500 mb-3">{session.class}</p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1 text-gray-600">
            <Users className="w-4 h-4" />
            {session.students} Studenten
          </span>
          <span className="flex items-center gap-1 text-green-600">
            <UserCheck className="w-4 h-4" />
            {session.confirmed} bestätigt
          </span>
        </div>
        
        <div className="flex gap-2">
          {session.status === 'upcoming' && (
            <Link
              href={`/lehrer/dashboard/session/${session.id}`}
              className="px-3 py-1.5 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors"
            >
              Starten
            </Link>
          )}
          <Link
            href={`/lehrer/dashboard/anwesenheit/${session.id}`}
            className="px-3 py-1.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Anwesenheit
          </Link>
        </div>
      </div>
    </div>
  );
}

// =========================================
// Klassen-Karte
// =========================================
function ClassCard({ classItem }: { classItem: MyClass }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:border-primary-300 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-900">{classItem.name}</h3>
        <span className="flex items-center gap-1 text-sm text-gray-500">
          <Users className="w-4 h-4" />
          {classItem.students}
        </span>
      </div>
      
      <p className="text-sm text-gray-500 mb-3">{classItem.course}</p>
      
      {/* Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-500">Kursfortschritt</span>
          <span className="font-medium text-gray-700">{classItem.progress}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary-500 rounded-full"
            style={{ width: `${classItem.progress}%` }}
          />
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {classItem.next_session ? (
            <>Nächste Session: {new Date(classItem.next_session).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</>
          ) : (
            <>Keine geplante Session</>
          )}
        </span>
        <Link 
          href={`/lehrer/dashboard/meine-klassen/${classItem.id}`}
          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
        >
          Details →
        </Link>
      </div>
    </div>
  );
}

// =========================================
// Anwesenheits-Alert
// =========================================
function AttendanceAlert({ record }: { record: AttendanceAlert }) {
  return (
    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium text-orange-800">Anwesenheit überprüfen</h4>
          <p className="text-sm text-orange-700 mt-1">
            {record.title} vom {new Date(record.date).toLocaleDateString('de-DE')}
          </p>
          <div className="flex items-center gap-4 mt-2 text-sm">
            <span className="text-green-600">{record.present} anwesend</span>
            <span className="text-red-600">{record.absent} abwesend</span>
            <span className="text-gray-600">{record.excused} entschuldigt</span>
          </div>
          <Link 
            href={`/lehrer/dashboard/anwesenheit/${record.session_id}`}
            className="inline-block mt-3 text-sm font-medium text-orange-700 hover:text-orange-800"
          >
            Jetzt überprüfen →
          </Link>
        </div>
      </div>
    </div>
  );
}

// =========================================
// Hauptseite
// =========================================
export default function TeacherDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<TeacherDashboardData | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardApi.getTeacherDashboard();
      setDashboardData(data);
    } catch (err: any) {
      console.error('Dashboard laden fehlgeschlagen:', err);
      setError('Dashboard konnte nicht geladen werden');
    } finally {
      setLoading(false);
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

  const stats = dashboardData?.stats || { classes: 0, students: 0, sessions_today: 0, sessions_week: 0, pending_exams: 0 };
  const todaysSessions = dashboardData?.todays_sessions || [];
  const myClasses = dashboardData?.my_classes || [];
  const pendingExams = dashboardData?.pending_exams || [];
  const attendanceAlerts = dashboardData?.attendance_alerts || [];

  return (
    <div className="space-y-6">
      {/* Begrüßung */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Lehrer-Dashboard</h1>
        <p className="text-gray-500 mt-1">Verwalten Sie Ihre Klassen und Unterrichtsstunden.</p>
      </div>

      {/* Statistiken */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Meine Klassen"
          value={stats.classes}
          subtitle={`${stats.students} Studenten gesamt`}
          icon={Users}
          color="primary"
        />
        <StatCard
          title="Heute"
          value={stats.sessions_today}
          subtitle="Sessions geplant"
          icon={Calendar}
          color="green"
        />
        <StatCard
          title="Diese Woche"
          value={stats.sessions_week}
          subtitle="Unterrichtsstunden"
          icon={Clock}
          color="orange"
        />
        <StatCard
          title="Prüfungen"
          value={stats.pending_exams}
          subtitle="Ausstehend"
          icon={FileText}
          color="purple"
        />
      </div>

      {/* Alerts */}
      {attendanceAlerts.filter(r => r.needs_review).map((record) => (
        <AttendanceAlert key={record.session_id} record={record} />
      ))}

      {/* Heutige Sessions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Heutige Sessions</h2>
          <Link href="/lehrer/dashboard/kalender" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
            Stundenplan
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        
        {todaysSessions.length > 0 ? (
          <div className="space-y-3">
            {todaysSessions.map((session) => (
              <TodaySessionCard key={session.id} session={session} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Heute keine Sessions geplant.</p>
          </div>
        )}
      </div>

      {/* Zwei-Spalten Layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Meine Klassen */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Meine Klassen</h2>
            <Link href="/lehrer/dashboard/meine-klassen" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              Alle Klassen
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          {myClasses.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {myClasses.map((classItem) => (
                <ClassCard key={classItem.id} classItem={classItem} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Keine Klassen zugewiesen.</p>
            </div>
          )}
        </div>

        {/* Anstehende Prüfungen */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Prüfungen</h2>
            <Link href="/lehrer/dashboard/pruefungen" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              Alle
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {pendingExams.length > 0 ? (
              pendingExams.map((exam) => (
                <div key={exam.id} className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900">{exam.student}</span>
                    <span className="text-xs text-gray-500">{exam.time}</span>
                  </div>
                  <p className="text-sm text-gray-500">{exam.course}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(exam.date).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-gray-500">
                Keine anstehenden Prüfungen
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

