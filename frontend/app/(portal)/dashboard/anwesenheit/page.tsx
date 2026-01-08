// ===========================================
// WARIZMY EDUCATION - Anwesenheit
// ===========================================
// Übersicht über Anwesenheitshistorie

'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Loader2,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { dashboardApi } from '@/lib/api';

// =========================================
// Typen
// =========================================
interface AttendanceRecord {
  id: string;
  session_title: string;
  course_name: string;
  date: string;
  time: string;
  status: 'present' | 'absent' | 'excused' | 'pending';
}

interface CourseAttendance {
  course_id: string;
  course_name: string;
  total_sessions: number;
  attended: number;
  absent: number;
  excused: number;
  attendance_rate: number;
  required_rate: number;
}

// =========================================
// Status Badge
// =========================================
function StatusBadge({ status }: { status: AttendanceRecord['status'] }) {
  const styles = {
    present: 'bg-green-100 text-green-700',
    absent: 'bg-red-100 text-red-700',
    excused: 'bg-yellow-100 text-yellow-700',
    pending: 'bg-gray-100 text-gray-700',
  };
  const labels = {
    present: 'Anwesend',
    absent: 'Abwesend',
    excused: 'Entschuldigt',
    pending: 'Ausstehend',
  };
  const icons = {
    present: CheckCircle,
    absent: XCircle,
    excused: Clock,
    pending: Clock,
  };
  const Icon = icons[status];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      <Icon className="w-3 h-3" />
      {labels[status]}
    </span>
  );
}

// =========================================
// Kurs-Fortschritt Karte
// =========================================
function CourseAttendanceCard({ course }: { course: CourseAttendance }) {
  const isOk = course.attendance_rate >= course.required_rate;
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">{course.course_name}</h3>
          <p className="text-sm text-gray-500">{course.total_sessions} Sessions</p>
        </div>
        <span className={`text-2xl font-bold ${isOk ? 'text-green-600' : 'text-orange-600'}`}>
          {course.attendance_rate}%
        </span>
      </div>
      
      {/* Progress Bar */}
      <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div 
          className={`h-full rounded-full ${isOk ? 'bg-green-500' : 'bg-orange-500'}`}
          style={{ width: `${Math.min(course.attendance_rate, 100)}%` }}
        />
        {/* Ziel-Markierung */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-gray-400"
          style={{ left: `${course.required_rate}%` }}
        />
      </div>
      
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle className="w-4 h-4" />
            {course.attended}
          </span>
          <span className="flex items-center gap-1 text-red-600">
            <XCircle className="w-4 h-4" />
            {course.absent}
          </span>
          <span className="flex items-center gap-1 text-yellow-600">
            <Clock className="w-4 h-4" />
            {course.excused}
          </span>
        </div>
        <span className="text-gray-500">
          Ziel: {course.required_rate}%
        </span>
      </div>
      
      {!isOk && (
        <div className="mt-3 p-3 bg-orange-50 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-orange-700">
            Du musst noch {Math.ceil((course.required_rate - course.attendance_rate) / 100 * course.total_sessions)} Sessions besuchen, um die Mindestanwesenheit zu erreichen.
          </p>
        </div>
      )}
    </div>
  );
}

// =========================================
// Hauptseite
// =========================================
export default function AnwesenheitPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [courses, setCourses] = useState<CourseAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAttendance();
  }, []);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardApi.getAttendance();
      setCourses(data.courses || []);
      setRecords(data.records || []);
    } catch (err) {
      console.error('Anwesenheit laden fehlgeschlagen:', err);
      setError('Anwesenheitsdaten konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  const totalAttendance = courses.length > 0 
    ? Math.round(courses.reduce((acc, c) => acc + c.attendance_rate, 0) / courses.length)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={loadAttendance}
          className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
        >
          Erneut versuchen
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Anwesenheit</h1>
        <p className="text-gray-500 mt-1">Deine Anwesenheitshistorie und Statistiken</p>
      </div>

      {/* Gesamt-Statistik */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm">Gesamtanwesenheit</p>
            <p className="text-4xl font-bold mt-1">{totalAttendance}%</p>
            <p className="text-white/80 text-sm mt-1">Durchschnitt über alle Kurse</p>
          </div>
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
            <TrendingUp className="w-10 h-10 text-white" />
          </div>
        </div>
      </div>

      {/* Kurs-Übersicht */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Nach Kurs</h2>
        {courses.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map(course => (
              <CourseAttendanceCard key={course.course_id} course={course} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Noch keine Anwesenheitsdaten vorhanden.</p>
          </div>
        )}
      </div>

      {/* Letzte Einträge */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Letzte Sessions</h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {records.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {records.map(record => (
                <div key={record.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{record.session_title}</p>
                      <p className="text-sm text-gray-500">{record.course_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">
                      {new Date(record.date).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })} • {record.time}
                    </span>
                    <StatusBadge status={record.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500">Keine Sessions gefunden.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
