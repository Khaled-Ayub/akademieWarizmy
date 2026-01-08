// ===========================================
// WARIZMY EDUCATION - Prüfungen
// ===========================================
// Übersicht über Prüfungen und PVL-Status

'use client';

import { useState, useEffect } from 'react';
import { 
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Award,
  Loader2,
  BookOpen
} from 'lucide-react';

// =========================================
// Typen
// =========================================
interface PVLStatus {
  course_id: string;
  course_name: string;
  attendance_required: number;
  attendance_current: number;
  video_required: number;
  video_current: number;
  can_take_exam: boolean;
}

interface ExamSlot {
  id: string;
  course_name: string;
  date: string;
  time: string;
  duration: number;
  location: string;
  available_seats: number;
  is_booked: boolean;
}

interface ExamResult {
  id: string;
  course_name: string;
  date: string;
  score: number;
  max_score: number;
  passed: boolean;
  certificate_available: boolean;
}

// =========================================
// PVL Status Karte
// =========================================
function PVLCard({ pvl }: { pvl: PVLStatus }) {
  const attendanceMet = pvl.attendance_current >= pvl.attendance_required;
  const videoMet = pvl.video_current >= pvl.video_required;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{pvl.course_name}</h3>
        {pvl.can_take_exam ? (
          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
            <CheckCircle className="w-3.5 h-3.5" />
            PVL erfüllt
          </span>
        ) : (
          <span className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
            <AlertTriangle className="w-3.5 h-3.5" />
            PVL offen
          </span>
        )}
      </div>

      {/* Anwesenheit */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-600">Anwesenheit</span>
          <span className={attendanceMet ? 'text-green-600 font-medium' : 'text-orange-600 font-medium'}>
            {pvl.attendance_current}% / {pvl.attendance_required}%
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${attendanceMet ? 'bg-green-500' : 'bg-orange-500'}`}
            style={{ width: `${Math.min(pvl.attendance_current, 100)}%` }}
          />
        </div>
      </div>

      {/* Videos */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-600">Video-Lektionen</span>
          <span className={videoMet ? 'text-green-600 font-medium' : 'text-orange-600 font-medium'}>
            {pvl.video_current}% / {pvl.video_required}%
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${videoMet ? 'bg-green-500' : 'bg-orange-500'}`}
            style={{ width: `${Math.min(pvl.video_current, 100)}%` }}
          />
        </div>
      </div>

      {/* Status */}
      {pvl.can_take_exam ? (
        <div className="p-3 bg-green-50 rounded-lg text-sm text-green-700">
          <CheckCircle className="w-4 h-4 inline mr-2" />
          Du kannst dich jetzt für die Prüfung anmelden!
        </div>
      ) : (
        <div className="p-3 bg-orange-50 rounded-lg text-sm text-orange-700">
          <AlertTriangle className="w-4 h-4 inline mr-2" />
          {!attendanceMet && `Noch ${pvl.attendance_required - pvl.attendance_current}% Anwesenheit nötig. `}
          {!videoMet && `Noch ${pvl.video_required - pvl.video_current}% Videos nötig.`}
        </div>
      )}
    </div>
  );
}

// =========================================
// Prüfungstermin Karte
// =========================================
function ExamSlotCard({ slot, onBook }: { slot: ExamSlot; onBook: (id: string) => void }) {
  return (
    <div className={`bg-white rounded-xl border p-5 ${slot.is_booked ? 'border-green-300 bg-green-50/50' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{slot.course_name}</h3>
          <p className="text-sm text-gray-500">Abschlussprüfung</p>
        </div>
        {slot.is_booked && (
          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
            <CheckCircle className="w-3.5 h-3.5" />
            Gebucht
          </span>
        )}
      </div>

      <div className="space-y-2 text-sm text-gray-600 mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {new Date(slot.date).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          {slot.time} Uhr • {slot.duration} Minuten
        </div>
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          {slot.location}
        </div>
      </div>

      {slot.is_booked ? (
        <button className="w-full py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
          Stornieren
        </button>
      ) : (
        <button 
          onClick={() => onBook(slot.id)}
          disabled={slot.available_seats === 0}
          className="w-full py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {slot.available_seats > 0 ? `Buchen (${slot.available_seats} Plätze frei)` : 'Ausgebucht'}
        </button>
      )}
    </div>
  );
}

// =========================================
// Ergebnis Karte
// =========================================
function ResultCard({ result }: { result: ExamResult }) {
  const percentage = Math.round((result.score / result.max_score) * 100);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{result.course_name}</h3>
          <p className="text-sm text-gray-500">
            {new Date(result.date).toLocaleDateString('de-DE')}
          </p>
        </div>
        {result.passed ? (
          <span className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 text-sm font-medium rounded-full">
            <CheckCircle className="w-4 h-4" />
            Bestanden
          </span>
        ) : (
          <span className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 text-sm font-medium rounded-full">
            <XCircle className="w-4 h-4" />
            Nicht bestanden
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="text-3xl font-bold text-gray-900">{percentage}%</div>
          <div className="text-sm text-gray-500">{result.score}/{result.max_score} Punkte</div>
        </div>
        {result.certificate_available && (
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors text-sm font-medium">
            <Award className="w-4 h-4" />
            Zertifikat
          </button>
        )}
      </div>
    </div>
  );
}

// =========================================
// Hauptseite
// =========================================
export default function PruefungenPage() {
  const [pvlStatuses, setPvlStatuses] = useState<PVLStatus[]>([]);
  const [examSlots, setExamSlots] = useState<ExamSlot[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setPvlStatuses([
        {
          course_id: '1',
          course_name: 'Arabisch für Anfänger',
          attendance_required: 80,
          attendance_current: 85,
          video_required: 80,
          video_current: 70,
          can_take_exam: false,
        },
        {
          course_id: '2',
          course_name: 'Quran Rezitation',
          attendance_required: 80,
          attendance_current: 90,
          video_required: 80,
          video_current: 85,
          can_take_exam: true,
        },
      ]);

      setExamSlots([
        {
          id: '1',
          course_name: 'Quran Rezitation',
          date: '2026-02-15',
          time: '10:00',
          duration: 90,
          location: 'Online (Zoom)',
          available_seats: 5,
          is_booked: false,
        },
        {
          id: '2',
          course_name: 'Quran Rezitation',
          date: '2026-02-22',
          time: '14:00',
          duration: 90,
          location: 'Röckstraße 10, Gelsenkirchen',
          available_seats: 3,
          is_booked: false,
        },
      ]);

      setResults([
        {
          id: '1',
          course_name: 'Arabisch A1 Einführung',
          date: '2025-06-15',
          score: 85,
          max_score: 100,
          passed: true,
          certificate_available: true,
        },
      ]);

      setLoading(false);
    }, 500);
  }, []);

  const handleBookExam = (slotId: string) => {
    setExamSlots(prev => prev.map(s => 
      s.id === slotId ? { ...s, is_booked: true } : s
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Prüfungen</h1>
        <p className="text-gray-500 mt-1">PVL-Status, Termine und Ergebnisse</p>
      </div>

      {/* PVL Status */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary-500" />
          Prüfungsvorleistungen (PVL)
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {pvlStatuses.map(pvl => (
            <PVLCard key={pvl.course_id} pvl={pvl} />
          ))}
        </div>
      </div>

      {/* Verfügbare Termine */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary-500" />
          Verfügbare Prüfungstermine
        </h2>
        {examSlots.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {examSlots.map(slot => (
              <ExamSlotCard key={slot.id} slot={slot} onBook={handleBookExam} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Derzeit keine Prüfungstermine verfügbar</p>
          </div>
        )}
      </div>

      {/* Bisherige Ergebnisse */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-primary-500" />
          Meine Ergebnisse
        </h2>
        {results.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map(result => (
              <ResultCard key={result.id} result={result} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Noch keine Prüfungsergebnisse</p>
          </div>
        )}
      </div>
    </div>
  );
}
