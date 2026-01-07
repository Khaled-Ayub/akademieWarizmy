// ===========================================
// WARIZMY EDUCATION - Klasse bearbeiten
// ===========================================
// Bearbeitungsseite für bestehende Klassen

'use client';

import { useState, useEffect, use } from 'react';
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
  BookOpen,
  AlertTriangle
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
  day_of_week: number;
  start_time: string;
  end_time: string;
  session_type: 'online' | 'onsite' | 'hybrid';
  location?: string;
  zoom_join_url?: string;
  isNew?: boolean;
  isDeleted?: boolean;
}

interface ClassData {
  id: string;
  name: string;
  description: string;
  course_id: string;
  start_date: string;
  end_date: string;
  max_students: number | null;
  is_active: boolean;
  schedules: ScheduleEntry[];
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

  // Nur nicht-gelöschte Schedules anzeigen
  const visibleSchedules = schedules.filter(s => !s.isDeleted);

  const addSchedule = () => {
    const newSchedule: ScheduleEntry = {
      id: `new-${Date.now()}`,
      day_of_week: 0,
      start_time: '18:00',
      end_time: '19:30',
      session_type: 'online',
      isNew: true,
    };
    onChange([...schedules, newSchedule]);
    setEditingId(newSchedule.id);
  };

  const updateSchedule = (id: string, updates: Partial<ScheduleEntry>) => {
    onChange(schedules.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const removeSchedule = (id: string) => {
    const schedule = schedules.find(s => s.id === id);
    if (schedule?.isNew) {
      // Neue Schedule können einfach entfernt werden
      onChange(schedules.filter(s => s.id !== id));
    } else {
      // Bestehende Schedule als gelöscht markieren
      onChange(schedules.map(s => s.id === id ? { ...s, isDeleted: true } : s));
    }
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

      {visibleSchedules.length === 0 ? (
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
          {visibleSchedules.map((schedule) => (
            <div 
              key={schedule.id}
              className={`border rounded-xl p-4 transition-all ${
                editingId === schedule.id 
                  ? 'border-primary-300 bg-primary-50/30' 
                  : schedule.isNew 
                    ? 'border-green-300 bg-green-50/30'
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
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      schedule.isNew ? 'bg-green-100' : 'bg-primary-100'
                    }`}>
                      <span className={`font-bold text-sm ${
                        schedule.isNew ? 'text-green-700' : 'text-primary-700'
                      }`}>
                        {WEEKDAYS.find(d => d.value === schedule.day_of_week)?.short}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 flex items-center gap-2">
                        {WEEKDAYS.find(d => d.value === schedule.day_of_week)?.label}
                        {schedule.isNew && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Neu</span>
                        )}
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
    </div>
  );
}

// =========================================
// Hauptseite
// =========================================
export default function KlasseBearbeitenPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);

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

  // Schedules (mit Original-State für Vergleich)
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [originalScheduleIds, setOriginalScheduleIds] = useState<string[]>([]);

  // Daten laden
  useEffect(() => {
    async function loadData() {
      try {
        // Kurse und Klasse parallel laden
        const [coursesRes, classRes] = await Promise.all([
          fetch('/api/admin/courses'),
          fetch(`/api/admin/classes/${id}`)
        ]);

        // Kurse verarbeiten
        const coursesData = await coursesRes.json();
        const items =
          Array.isArray(coursesData?.items) ? coursesData.items :
          Array.isArray(coursesData?.data) ? coursesData.data :
          Array.isArray(coursesData) ? coursesData :
          [];
        setCourses(items);

        // Klasse verarbeiten
        if (!classRes.ok) {
          throw new Error('Klasse nicht gefunden');
        }
        const classData: ClassData = await classRes.json();
        
        setFormData({
          name: classData.name || '',
          description: classData.description || '',
          course_id: classData.course_id || '',
          start_date: classData.start_date || '',
          end_date: classData.end_date || '',
          max_students: classData.max_students?.toString() || '',
          is_active: classData.is_active ?? true,
        });

        // Schedules verarbeiten
        const loadedSchedules = (classData.schedules || []).map(s => ({
          ...s,
          start_time: s.start_time?.slice(0, 5) || '18:00',
          end_time: s.end_time?.slice(0, 5) || '19:30',
        }));
        setSchedules(loadedSchedules);
        setOriginalScheduleIds(loadedSchedules.map(s => s.id));

      } catch (err: any) {
        console.error('Error loading data:', err);
        toast.error(err.message || 'Fehler beim Laden der Klasse');
        router.push('/admin/klassen');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

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

    setSaving(true);

    try {
      // 1. Klasse aktualisieren
      const payload = {
        name: formData.name,
        description: formData.description || null,
        course_id: formData.course_id,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        max_students: formData.max_students ? parseInt(formData.max_students) : null,
        is_active: formData.is_active,
      };
      
      const classRes = await fetch(`/api/admin/classes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!classRes.ok) {
        const errorData = await classRes.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.error || 'Fehler beim Aktualisieren');
      }

      // 2. Schedules verarbeiten
      // Gelöschte Schedules entfernen
      const deletedSchedules = schedules.filter(s => s.isDeleted && !s.isNew);
      for (const schedule of deletedSchedules) {
        await fetch(`/api/admin/classes/schedules/${schedule.id}`, {
          method: 'DELETE',
        });
      }

      // Neue Schedules erstellen
      const newSchedules = schedules.filter(s => s.isNew && !s.isDeleted);
      for (const schedule of newSchedules) {
        await fetch('/api/admin/classes/schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            class_id: id,
            day_of_week: schedule.day_of_week,
            start_time: schedule.start_time,
            end_time: schedule.end_time,
            session_type: schedule.session_type,
            location: schedule.location,
            zoom_join_url: schedule.zoom_join_url,
          }),
        });
      }

      // Bestehende Schedules aktualisieren
      const updatedSchedules = schedules.filter(s => !s.isNew && !s.isDeleted);
      for (const schedule of updatedSchedules) {
        await fetch(`/api/admin/classes/schedules/${schedule.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            day_of_week: schedule.day_of_week,
            start_time: schedule.start_time,
            end_time: schedule.end_time,
            session_type: schedule.session_type,
            location: schedule.location,
            zoom_join_url: schedule.zoom_join_url,
          }),
        });
      }

      toast.success('✅ Klasse erfolgreich gespeichert!');
      router.push('/admin/klassen');
    } catch (err: any) {
      console.error('Error:', err);
      toast.error(err.message || 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  // Löschen
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/classes/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Fehler beim Löschen');
      }

      toast.success('Klasse wurde gelöscht');
      router.push('/admin/klassen');
    } catch (err: any) {
      console.error('Error:', err);
      toast.error(err.message || 'Fehler beim Löschen');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-gray-900">Klasse bearbeiten</h1>
            <p className="text-gray-500">{formData.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg font-medium"
          >
            <Trash2 className="w-5 h-5" />
            Löschen
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 font-medium"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Speichern
          </button>
        </div>
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
              >
                <option value="">Kurs auswählen...</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
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
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Klasse löschen?</h3>
                <p className="text-sm text-gray-500">Diese Aktion kann nicht rückgängig gemacht werden.</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Bist du sicher, dass du <strong>{formData.name}</strong> löschen möchtest? 
              Alle zugehörigen Daten werden ebenfalls gelöscht.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
              >
                Abbrechen
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
              >
                {deleting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Ja, löschen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

