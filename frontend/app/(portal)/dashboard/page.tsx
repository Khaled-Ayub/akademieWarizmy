// ===========================================
// WARIZMY EDUCATION - Studenten Dashboard
// ===========================================
// Hauptübersicht für eingeloggte Studenten

'use client';

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
  Users
} from 'lucide-react';

// =========================================
// Mock Data (später durch API ersetzen)
// =========================================
const upcomingSessions = [
  {
    id: 1,
    title: 'Arabisch A1 - Lektion 5',
    course: 'Arabisch für Anfänger',
    date: '2026-01-06',
    time: '18:00',
    duration: 90,
    type: 'hybrid',
    teacher: 'Ustadh Ahmad',
    confirmed: null, // null = noch nicht bestätigt
  },
  {
    id: 2,
    title: 'Tajweed Grundlagen',
    course: 'Quran Rezitation',
    date: '2026-01-07',
    time: '19:30',
    duration: 60,
    type: 'online',
    teacher: 'Ustadha Fatima',
    confirmed: true,
  },
  {
    id: 3,
    title: 'Sira des Propheten ﷺ',
    course: 'Islamische Geschichte',
    date: '2026-01-08',
    time: '17:00',
    duration: 90,
    type: 'onsite',
    teacher: 'Sheikh Abdullah',
    confirmed: false,
  },
];

const myCourses = [
  {
    id: 1,
    title: 'Arabisch für Anfänger',
    progress: 65,
    nextLesson: 'Lektion 6: Verben',
    totalLessons: 20,
    completedLessons: 13,
  },
  {
    id: 2,
    title: 'Quran Rezitation',
    progress: 40,
    nextLesson: 'Tajweed Regel 4',
    totalLessons: 15,
    completedLessons: 6,
  },
  {
    id: 3,
    title: 'Islamische Geschichte',
    progress: 25,
    nextLesson: 'Die Hidschra',
    totalLessons: 12,
    completedLessons: 3,
  },
];

const pvlStatus = {
  courseName: 'Arabisch für Anfänger',
  attendanceRequired: 80,
  currentAttendance: 85,
  videosRequired: 80,
  currentVideos: 70,
  canTakeExam: false,
};

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
  session: typeof upcomingSessions[0];
  onConfirm: (id: number, attending: boolean) => void;
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
  const TypeIcon = typeIcons[session.type as keyof typeof typeIcons];

  const isToday = session.date === new Date().toISOString().split('T')[0];
  const isTomorrow = session.date === new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const dateLabel = isToday ? 'Heute' : isTomorrow ? 'Morgen' : new Date(session.date).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });

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
          <span>{typeLabels[session.type as keyof typeof typeLabels]}</span>
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
function CourseProgressCard({ course }: { course: typeof myCourses[0] }) {
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
          {course.completedLessons}/{course.totalLessons} Lektionen
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
function PVLStatusWidget({ pvl }: { pvl: typeof pvlStatus }) {
  const attendanceMet = pvl.currentAttendance >= pvl.attendanceRequired;
  const videosMet = pvl.currentVideos >= pvl.videosRequired;
  const canTakeExam = attendanceMet && videosMet;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">PVL-Status</h3>
        <span className="text-xs text-gray-500">{pvl.courseName}</span>
      </div>
      
      {/* Anwesenheit */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-600">Anwesenheit</span>
          <span className={attendanceMet ? 'text-green-600 font-medium' : 'text-orange-600 font-medium'}>
            {pvl.currentAttendance}% / {pvl.attendanceRequired}%
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${attendanceMet ? 'bg-green-500' : 'bg-orange-500'}`}
            style={{ width: `${Math.min(pvl.currentAttendance, 100)}%` }}
          />
        </div>
      </div>
      
      {/* Video-Fortschritt */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-600">Video-Lektionen</span>
          <span className={videosMet ? 'text-green-600 font-medium' : 'text-orange-600 font-medium'}>
            {pvl.currentVideos}% / {pvl.videosRequired}%
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${videosMet ? 'bg-green-500' : 'bg-orange-500'}`}
            style={{ width: `${Math.min(pvl.currentVideos, 100)}%` }}
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
                  {!attendanceMet && `Noch ${pvl.attendanceRequired - pvl.currentAttendance}% Anwesenheit nötig. `}
                  {!videosMet && `Noch ${pvl.videosRequired - pvl.currentVideos}% Videos nötig.`}
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
  const handleConfirmAttendance = (sessionId: number, attending: boolean) => {
    console.log(`Session ${sessionId}: ${attending ? 'Zugesagt' : 'Abgesagt'}`);
    // TODO: API call
  };

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
          value={3}
          subtitle="2 in Bearbeitung"
          icon={BookOpen}
          color="primary"
        />
        <StatCard
          title="Abgeschlossen"
          value="65%"
          subtitle="Ø Fortschritt"
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Diese Woche"
          value={4}
          subtitle="Sessions geplant"
          icon={Calendar}
          color="orange"
        />
        <StatCard
          title="Zertifikate"
          value={1}
          subtitle="Arabisch A1"
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
          
          <div className="space-y-3">
            {upcomingSessions.map((session) => (
              <SessionCard 
                key={session.id} 
                session={session} 
                onConfirm={handleConfirmAttendance}
              />
            ))}
          </div>
        </div>

        {/* Rechte Spalte: PVL Status */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Prüfungsvorleistung</h2>
          <PVLStatusWidget pvl={pvlStatus} />
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
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {myCourses.map((course) => (
            <CourseProgressCard key={course.id} course={course} />
          ))}
        </div>
      </div>
    </div>
  );
}

