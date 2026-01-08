// ===========================================
// WARIZMY EDUCATION - Lehrer Anwesenheitserfassung
// ===========================================
// Anwesenheitsliste für eine Session bearbeiten

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Calendar,
  Save,
  Loader2,
  UserCheck,
  UserX,
  AlertCircle,
  Video,
  MapPin
} from 'lucide-react';
import { sessionsApi } from '@/lib/api';

// =========================================
// Typen
// =========================================
interface StudentConfirmation {
  confirmed: boolean;
  will_attend: boolean | null;
  absence_reason: string | null;
  confirmed_at: string | null;
}

interface StudentAttendance {
  recorded: boolean;
  status: 'present' | 'absent_excused' | 'absent_unexcused' | null;
  notes: string | null;
  checked_in_at: string | null;
}

interface Student {
  user_id: string;
  name: string;
  email: string;
  confirmation: StudentConfirmation;
  attendance: StudentAttendance;
}

interface SessionInfo {
  id: string;
  title: string;
  scheduled_at: string;
  session_type: string;
  class_name: string | null;
  is_past: boolean;
}

interface Summary {
  total: number;
  confirmed_yes: number;
  confirmed_no: number;
  not_confirmed: number;
  present: number;
  absent_excused: number;
  absent_unexcused: number;
  not_recorded: number;
}

interface AttendanceData {
  session: SessionInfo;
  students: Student[];
  summary: Summary;
}

// =========================================
// Status Badge
// =========================================
function ConfirmationBadge({ confirmation }: { confirmation: StudentConfirmation }) {
  if (!confirmation.confirmed) {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
        <Clock className="w-3 h-3" />
        Nicht bestätigt
      </span>
    );
  }
  
  if (confirmation.will_attend) {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
        <CheckCircle2 className="w-3 h-3" />
        Zugesagt
      </span>
    );
  }
  
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-red-100 text-red-700" title={confirmation.absence_reason || ''}>
      <XCircle className="w-3 h-3" />
      Abgesagt
    </span>
  );
}

// =========================================
// Studenten-Zeile
// =========================================
function StudentRow({ 
  student, 
  onChange 
}: { 
  student: Student;
  onChange: (userId: string, status: string, notes?: string) => void;
}) {
  const [notes, setNotes] = useState(student.attendance.notes || '');
  const [status, setStatus] = useState<string>(student.attendance.status || '');

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    onChange(student.user_id, newStatus, notes);
  };

  const handleNotesBlur = () => {
    if (status) {
      onChange(student.user_id, status, notes);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between gap-4">
        {/* Student Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-sm font-medium text-primary-600">
                {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{student.name}</h4>
              <p className="text-xs text-gray-500">{student.email}</p>
            </div>
          </div>
          
          {/* Vorab-Bestätigung */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-gray-500">Vorab:</span>
            <ConfirmationBadge confirmation={student.confirmation} />
            {student.confirmation.absence_reason && (
              <span className="text-xs text-gray-400 italic truncate max-w-[200px]" title={student.confirmation.absence_reason}>
                "{student.confirmation.absence_reason}"
              </span>
            )}
          </div>
        </div>

        {/* Anwesenheits-Auswahl */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => handleStatusChange('present')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 transition-all ${
                status === 'present' 
                  ? 'border-green-500 bg-green-50 text-green-700' 
                  : 'border-gray-200 hover:border-green-300 text-gray-600'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span className="text-sm font-medium">Anwesend</span>
            </button>
            <button
              onClick={() => handleStatusChange('absent_excused')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 transition-all ${
                status === 'absent_excused' 
                  ? 'border-yellow-500 bg-yellow-50 text-yellow-700' 
                  : 'border-gray-200 hover:border-yellow-300 text-gray-600'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Entschuldigt</span>
            </button>
            <button
              onClick={() => handleStatusChange('absent_unexcused')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 transition-all ${
                status === 'absent_unexcused' 
                  ? 'border-red-500 bg-red-50 text-red-700' 
                  : 'border-gray-200 hover:border-red-300 text-gray-600'
              }`}
            >
              <UserX className="w-4 h-4" />
              <span className="text-sm font-medium">Abwesend</span>
            </button>
          </div>
          
          {/* Notizen */}
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleNotesBlur}
            placeholder="Notizen (optional)"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
}

// =========================================
// Zusammenfassung
// =========================================
function SummaryCard({ summary }: { summary: Summary }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="font-semibold text-gray-900 mb-4">Zusammenfassung</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">Vorab-Bestätigungen</p>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-green-600">Zugesagt</span>
              <span className="font-medium">{summary.confirmed_yes}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-red-600">Abgesagt</span>
              <span className="font-medium">{summary.confirmed_no}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Offen</span>
              <span className="font-medium">{summary.not_confirmed}</span>
            </div>
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Tatsächliche Anwesenheit</p>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-green-600">Anwesend</span>
              <span className="font-medium">{summary.present}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-yellow-600">Entschuldigt</span>
              <span className="font-medium">{summary.absent_excused}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-red-600">Abwesend</span>
              <span className="font-medium">{summary.absent_unexcused}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Nicht erfasst</span>
              <span className="font-medium">{summary.not_recorded}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between">
          <span className="font-medium text-gray-700">Gesamt</span>
          <span className="font-bold text-gray-900">{summary.total} Studenten</span>
        </div>
      </div>
    </div>
  );
}

// =========================================
// Hauptseite
// =========================================
export default function AttendancePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AttendanceData | null>(null);
  const [changes, setChanges] = useState<Map<string, { status: string; notes?: string }>>(new Map());
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadAttendance();
  }, [sessionId]);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await sessionsApi.getSessionAttendance(sessionId);
      setData(response);
    } catch (err: any) {
      console.error('Anwesenheit laden fehlgeschlagen:', err);
      setError(err.response?.data?.detail || 'Anwesenheit konnte nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (userId: string, status: string, notes?: string) => {
    setChanges(prev => {
      const newChanges = new Map(prev);
      newChanges.set(userId, { status, notes });
      return newChanges;
    });
  };

  const handleSave = async () => {
    if (changes.size === 0) return;

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const attendances = Array.from(changes.entries()).map(([userId, { status, notes }]) => ({
        user_id: userId,
        status: status as 'present' | 'absent_excused' | 'absent_unexcused',
        notes,
      }));

      const result = await sessionsApi.updateSessionAttendance(sessionId, attendances);
      setSuccessMessage(result.message);
      setChanges(new Map());
      
      // Daten neu laden
      await loadAttendance();
    } catch (err: any) {
      console.error('Speichern fehlgeschlagen:', err);
      setError(err.response?.data?.detail || 'Speichern fehlgeschlagen');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkAllPresent = () => {
    if (!data) return;
    
    data.students.forEach(student => {
      handleChange(student.user_id, 'present');
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={loadAttendance}
          className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        >
          Erneut versuchen
        </button>
      </div>
    );
  }

  if (!data) return null;

  const typeIcons = {
    online: Video,
    onsite: MapPin,
    hybrid: Users,
  };
  const TypeIcon = typeIcons[data.session.session_type as keyof typeof typeIcons] || Video;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link 
            href="/lehrer/dashboard"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zum Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Anwesenheit erfassen</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(data.session.scheduled_at).toLocaleDateString('de-DE', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })} Uhr
            </span>
            <span className="flex items-center gap-1">
              <TypeIcon className="w-4 h-4" />
              {data.session.session_type}
            </span>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleMarkAllPresent}
            className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Alle anwesend
          </button>
          <button
            onClick={handleSave}
            disabled={saving || changes.size === 0}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Speichern {changes.size > 0 && `(${changes.size})`}
          </button>
        </div>
      </div>

      {/* Session Info */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-semibold text-gray-900">{data.session.title}</h2>
        <p className="text-gray-500">{data.session.class_name}</p>
        {data.session.is_past && (
          <span className="inline-block mt-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
            Session beendet
          </span>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 text-sm">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-600 text-sm">
          {successMessage}
        </div>
      )}

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Studenten-Liste */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="font-semibold text-gray-900">
            Studenten ({data.students.length})
          </h3>
          
          {data.students.length > 0 ? (
            data.students.map((student) => (
              <StudentRow 
                key={student.user_id} 
                student={student}
                onChange={handleChange}
              />
            ))
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Keine Studenten in dieser Klasse.</p>
            </div>
          )}
        </div>

        {/* Zusammenfassung */}
        <div>
          <SummaryCard summary={data.summary} />
        </div>
      </div>
    </div>
  );
}
