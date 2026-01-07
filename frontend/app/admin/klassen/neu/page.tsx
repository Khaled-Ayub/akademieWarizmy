// ===========================================
// WARIZMY EDUCATION - Neue Klasse erstellen
// ===========================================
// Mit Stundenplan (wiederkehrende Termine)

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ChevronLeft, 
  Save, 
  Loader2, 
  Plus, 
  Trash2, 
  Calendar,
  Clock,
  Video,
  MapPin,
  Users,
  BookOpen
} from 'lucide-react';
import { useToast } from '@/components/Toast';

// =========================================
// Types
// =========================================
interface Course {
  id: string;
  title: string;
  slug: string;
}

interface ScheduleEntry {
  id: string;
  day_of_week: number; // 0=Montag, 6=Sonntag
  start_time: string;  // HH:MM
  end_time: string;    // HH:MM
  session_type: 'online' | 'onsite' | 'hybrid';
  location?: string;
  zoom_join_url?: string;
}

// Wochentage
const WEEKDAYS = [
  { value: 0, label: 'Montag', short: 'Mo' },
  { value: 1, label: 'Dienstag', short: 'Di' },
  { value: 2, label: 'Mittwoch', short: 'Mi' },
  { value: 3, label: 'Donnerstag', short: 'Do' },
  { value: 4, label: 'Freitag', short: 'Fr' },
  { value: 5, label: 'Samstag', short: 'Sa' },
  { value: 6, label: 'Sonntag', short: 'So' },
];

const SESSION_TYPES = [
  { value: 'online', label: 'Online (Zoom)', icon: Video },
  { value: 'onsite', label: 'Vor Ort', icon: MapPin },
  { value: 'hybrid', label: 'Hybrid', icon: Users },
];

// =========================================
// Schedule Editor Komponente
// =========================================
function ScheduleEditor({ 
  schedules, 
  onChange 
}: { 
  schedules: ScheduleEntry[]; 
  onChange: (schedules: ScheduleEntry[]) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const addSchedule = () => {
    const newSchedule: ScheduleEntry = {
      id: `temp-${Date.now()}`,
      day_of_week: 0,
      start_time: '18:00',
      end_time: '19:30',
      session_type: 'online',
    };
    onChange([...schedules, newSchedule]);
    setEditingId(newSchedule.id);
  };

  const updateSchedule = (id: string, updates: Partial<ScheduleEntry>) => {
    onChange(schedules.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const removeSchedule = (id: string) => {
    onChange(schedules.filter(s => s.id !== id));
    if (editingId === id) setEditingId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">📅 Wiederkehrende Termine</h3>
          <p className="text-sm text-gray-500">Wann findet der Unterricht regelmäßig statt?</p>
        </div>
        <button
          type="button"
          onClick={addSchedule}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 font-medium"
        >
          <Plus className="w-4 h-4" />
          Termin hinzufügen
        </button>
      </div>

      {schedules.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
          <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-2">Noch keine Termine festgelegt</p>
          <button
            type="button"
            onClick={addSchedule}
            className="text-primary-600 hover:text-primary-700 font-medium text-sm"
          >
            Ersten Termin hinzufügen
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {schedules.map((schedule) => (
            <div 
              key={schedule.id}
              className={`border rounded-xl p-4 transition-all ${
                editingId === schedule.id 
                  ? 'border-primary-300 bg-primary-50/30' 
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {editingId === schedule.id ? (
                // Edit Mode
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Wochentag */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Wochentag</label>
                      <select
                        value={schedule.day_of_week}
                        onChange={(e) => updateSchedule(schedule.id, { day_of_week: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                      >
                        {WEEKDAYS.map(day => (
                          <option key={day.value} value={day.value}>{day.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Startzeit */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Von</label>
                      <input
                        type="time"
                        value={schedule.start_time}
                        onChange={(e) => updateSchedule(schedule.id, { start_time: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    {/* Endzeit */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Bis</label>
                      <input
                        type="time"
                        value={schedule.end_time}
                        onChange={(e) => updateSchedule(schedule.id, { end_time: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    {/* Unterrichtsart */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Art</label>
                      <select
                        value={schedule.session_type}
                        onChange={(e) => updateSchedule(schedule.id, { session_type: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                      >
                        {SESSION_TYPES.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Zusätzliche Felder je nach Typ */}
                  {(schedule.session_type === 'onsite' || schedule.session_type === 'hybrid') && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Ort</label>
                      <input
                        type="text"
                        value={schedule.location || ''}
                        onChange={(e) => updateSchedule(schedule.id, { location: e.target.value })}
                        placeholder="z.B. Moschee, Raum 101"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  )}

                  {(schedule.session_type === 'online' || schedule.session_type === 'hybrid') && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Zoom-Link (optional)</label>
                      <input
                        type="url"
                        value={schedule.zoom_join_url || ''}
                        onChange={(e) => updateSchedule(schedule.id, { zoom_join_url: e.target.value })}
                        placeholder="https://zoom.us/j/..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => removeSchedule(schedule.id)}
                      className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      Löschen
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                    >
                      Fertig
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setEditingId(schedule.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-700 font-bold text-sm">
                        {WEEKDAYS.find(d => d.value === schedule.day_of_week)?.short}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {WEEKDAYS.find(d => d.value === schedule.day_of_week)?.label}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        {schedule.start_time} - {schedule.end_time}
                        <span className="text-gray-300">•</span>
                        {SESSION_TYPES.find(t => t.value === schedule.session_type)?.label}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeSchedule(schedule.id); }}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Vorschau */}
      {schedules.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">📋 Zusammenfassung:</p>
          <p className="text-sm text-gray-600">
            {schedules.map((s, i) => (
              <span key={s.id}>
                {i > 0 && ' • '}
                <span className="font-medium">{WEEKDAYS.find(d => d.value === s.day_of_week)?.short}</span>
                {' '}{s.start_time}-{s.end_time}
              </span>
            ))}
          </p>
        </div>
      )}
    </div>
  );
}

// =========================================
// Hauptseite
// =========================================
export default function NeueKlassePage() {
  const router = useRouter();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    course_id: '',
    start_date: '',
    end_date: '',
    max_students: '',
    is_active: true,
  });

  // Schedules
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);

  // Kurse laden
  useEffect(() => {
    async function loadCourses() {
      try {
        const res = await fetch('/api/admin/courses');
        const data = await res.json();
        setCourses(data.items || data.data || data || []);
      } catch (err) {
        console.error('Error loading courses:', err);
      } finally {
        setLoadingCourses(false);
      }
    }
    loadCourses();
  }, []);

  // Auto-Generate Name wenn Kurs ausgewählt wird
  useEffect(() => {
    if (formData.course_id && formData.start_date && !formData.name) {
      const course = courses.find(c => c.id === formData.course_id);
      if (course) {
        const startDate = new Date(formData.start_date);
        const season = getSeasonName(startDate);
        const year = startDate.getFullYear();
        setFormData(prev => ({
          ...prev,
          name: `${course.title} - ${season} ${year}`
        }));
      }
    }
  }, [formData.course_id, formData.start_date, courses]);

  const getSeasonName = (date: Date): string => {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return 'Frühling';
    if (month >= 5 && month <= 7) return 'Sommer';
    if (month >= 8 && month <= 10) return 'Herbst';
    return 'Winter';
  };

  // Speichern
  const handleSave = async () => {
    if (!formData.course_id) {
      toast.error('Bitte wähle einen Kurs aus');
      return;
    }
    if (!formData.name.trim()) {
      toast.error('Bitte gib einen Namen ein');
      return;
    }
    if (!formData.start_date) {
      toast.error('Bitte wähle ein Startdatum');
      return;
    }
    if (schedules.length === 0) {
      toast.warning('Tipp: Du hast noch keine Termine hinzugefügt');
    }

    setSaving(true);

    try {
      // 1. Klasse erstellen
      const classRes = await fetch('/api/admin/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          max_students: formData.max_students ? parseInt(formData.max_students) : null,
        }),
      });

      if (!classRes.ok) {
        throw new Error('Fehler beim Erstellen der Klasse');
      }

      const classData = await classRes.json();
      const classId = classData.id || classData.data?.id;

      // 2. Schedules hinzufügen
      if (schedules.length > 0 && classId) {
        for (const schedule of schedules) {
          await fetch('/api/admin/classes/schedules', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              class_id: classId,
              day_of_week: schedule.day_of_week,
              start_time: schedule.start_time,
              end_time: schedule.end_time,
              session_type: schedule.session_type,
              location: schedule.location,
              zoom_join_url: schedule.zoom_join_url,
            }),
          });
        }
      }

      toast.success('✅ Klasse erfolgreich erstellt!');
      router.push('/admin/klassen');
    } catch (err: any) {
      console.error('Error:', err);
      toast.error(err.message || 'Fehler beim Erstellen');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/admin/klassen" 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Neue Klasse erstellen</h1>
            <p className="text-gray-500">Lege Termine und Wiederholungen fest</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 font-medium"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Klasse erstellen
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Linke Spalte - Hauptdaten */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basis-Informationen */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary-500" />
              Klassen-Informationen
            </h2>

            {/* Kurs auswählen */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kurs *</label>
              <select
                value={formData.course_id}
                onChange={(e) => setFormData(prev => ({ ...prev, course_id: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                disabled={loadingCourses}
              >
                <option value="">Kurs auswählen...</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Der Kursinhalt (Lektionen, Videos) wird von diesem Kurs übernommen</p>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Klassenname *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="z.B. Arabisch Anfänger - Herbst 2026"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Beschreibung */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                placeholder="Optionale Beschreibung für diese Klasse..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>
          </div>

          {/* Stundenplan */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <ScheduleEditor schedules={schedules} onChange={setSchedules} />
          </div>
        </div>

        {/* Rechte Spalte - Zeitraum & Einstellungen */}
        <div className="space-y-6">
          {/* Zeitraum */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-500" />
              Zeitraum
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Startdatum *</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enddatum (optional)</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                min={formData.start_date}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">Leer lassen für fortlaufende Kurse</p>
            </div>
          </div>

          {/* Einstellungen */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-500" />
              Einstellungen
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max. Teilnehmer</label>
              <input
                type="number"
                min="1"
                value={formData.max_students}
                onChange={(e) => setFormData(prev => ({ ...prev, max_students: e.target.value }))}
                placeholder="Unbegrenzt"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="w-4 h-4 rounded"
              />
              <label htmlFor="is_active" className="text-sm text-gray-700 cursor-pointer">
                <span className="font-medium">Klasse aktiv</span>
                <span className="block text-xs text-gray-500">Studenten können sich einschreiben</span>
              </label>
            </div>
          </div>

          {/* Vorschau-Box */}
          {formData.name && schedules.length > 0 && (
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl border border-primary-200 p-6">
              <h3 className="font-semibold text-primary-800 mb-3">📋 Vorschau</h3>
              <p className="font-medium text-gray-900 mb-2">{formData.name}</p>
              <div className="text-sm text-gray-600 space-y-1">
                {formData.start_date && (
                  <p>📅 Ab {new Date(formData.start_date).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                )}
                <p>⏰ {schedules.map((s, i) => (
                  <span key={s.id}>
                    {i > 0 && ', '}
                    {WEEKDAYS.find(d => d.value === s.day_of_week)?.label} {s.start_time}
                  </span>
                ))}</p>
                {formData.max_students && <p>👥 Max. {formData.max_students} Teilnehmer</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

