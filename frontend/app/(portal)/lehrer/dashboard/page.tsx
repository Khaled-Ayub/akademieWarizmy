// ===========================================
// WARIZMY EDUCATION - Lehrer Dashboard
// ===========================================
// Hauptübersicht für eingeloggte Lehrer

'use client';

import Link from 'next/link';
import { useState } from 'react';
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
  UserX
} from 'lucide-react';

// =========================================
// Mock Data (später durch API ersetzen)
// =========================================
const todaysSessions = [
  {
    id: 1,
    title: 'Arabisch A1 - Lektion 5',
    class: 'Arabisch Anfänger - Herbst 2026',
    time: '18:00',
    duration: 90,
    type: 'hybrid',
    students: 15,
    confirmed: 12,
    location: 'Raum 101 / Zoom',
    status: 'upcoming', // upcoming, live, completed
  },
  {
    id: 2,
    title: 'Tajweed - Übung',
    class: 'Quran Rezitation',
    time: '20:00',
    duration: 60,
    type: 'online',
    students: 8,
    confirmed: 8,
    location: 'Zoom',
    status: 'upcoming',
  },
];

const myClasses = [
  {
    id: 1,
    name: 'Arabisch Anfänger - Herbst 2026',
    course: 'Arabisch für Anfänger',
    students: 15,
    nextSession: '2026-01-06 18:00',
    progress: 65,
  },
  {
    id: 2,
    name: 'Quran Rezitation - Abend',
    course: 'Quran Rezitation',
    students: 8,
    nextSession: '2026-01-07 20:00',
    progress: 45,
  },
  {
    id: 3,
    name: 'Sira Intensiv',
    course: 'Islamische Geschichte',
    students: 22,
    nextSession: '2026-01-08 17:00',
    progress: 30,
  },
];

const pendingExams = [
  {
    id: 1,
    student: 'Ahmad Hassan',
    course: 'Arabisch für Anfänger',
    date: '2026-01-10',
    time: '14:00',
    status: 'scheduled',
  },
  {
    id: 2,
    student: 'Fatima Ali',
    course: 'Arabisch für Anfänger',
    date: '2026-01-10',
    time: '15:00',
    status: 'scheduled',
  },
];

const recentAttendance = [
  {
    sessionId: 1,
    title: 'Arabisch A1 - Lektion 4',
    date: '2026-01-03',
    present: 13,
    absent: 2,
    excused: 1,
    needsReview: true,
  },
];

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
function TodaySessionCard({ session }: { session: typeof todaysSessions[0] }) {
  const typeIcons = {
    online: Video,
    onsite: MapPin,
    hybrid: Users,
  };
  const TypeIcon = typeIcons[session.type as keyof typeof typeIcons];

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
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[session.status as keyof typeof statusColors]}`}>
            {statusLabels[session.status as keyof typeof statusLabels]}
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
function ClassCard({ classItem }: { classItem: typeof myClasses[0] }) {
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
          Nächste Session: {new Date(classItem.nextSession).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
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
function AttendanceAlert({ record }: { record: typeof recentAttendance[0] }) {
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
            href={`/lehrer/dashboard/anwesenheit/${record.sessionId}`}
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
          value={3}
          subtitle="45 Studenten gesamt"
          icon={Users}
          color="primary"
        />
        <StatCard
          title="Heute"
          value={2}
          subtitle="Sessions geplant"
          icon={Calendar}
          color="green"
        />
        <StatCard
          title="Diese Woche"
          value={8}
          subtitle="Unterrichtsstunden"
          icon={Clock}
          color="orange"
        />
        <StatCard
          title="Prüfungen"
          value={2}
          subtitle="Ausstehend"
          icon={FileText}
          color="purple"
        />
      </div>

      {/* Alerts */}
      {recentAttendance.filter(r => r.needsReview).map((record) => (
        <AttendanceAlert key={record.sessionId} record={record} />
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
          
          <div className="grid sm:grid-cols-2 gap-4">
            {myClasses.map((classItem) => (
              <ClassCard key={classItem.id} classItem={classItem} />
            ))}
          </div>
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
            {pendingExams.map((exam) => (
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
            ))}
            
            {pendingExams.length === 0 && (
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

