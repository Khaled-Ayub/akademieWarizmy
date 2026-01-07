// ===========================================
// WARIZMY EDUCATION - Admin Klassenverwaltung
// ===========================================

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Users,
  Calendar,
  BookOpen,
  Clock,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { useToast } from '@/components/Toast';

// =========================================
// Types
// =========================================
interface ClassSchedule {
  id: string;
  day_of_week: number;
  day_name: string;
  start_time: string;
  end_time: string;
  session_type: string;
}

interface ClassItem {
  id: string;
  name: string;
  description?: string;
  course_id: string;
  start_date: string;
  end_date?: string;
  max_students?: number;
  current_students: number;
  is_active: boolean;
  schedules?: ClassSchedule[];
}

// =========================================
// Klassen-Karte
// =========================================
function ClassCard({ 
  classItem, 
  onDelete 
}: { 
  classItem: ClassItem; 
  onDelete: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isFull = classItem.max_students ? classItem.current_students >= classItem.max_students : false;

  const schedules: ClassSchedule[] = Array.isArray(classItem.schedules) ? classItem.schedules : [];

  // Schedule als String formatieren
  const scheduleString = schedules
    .map((s) => {
      const dayShort = (s.day_name || '').substring(0, 2);
      const time = s.start_time || '';
      return `${dayShort} ${time}`.trim();
    })
    .filter(Boolean)
    .join(', ');

  const startDateLabel = (() => {
    try {
      if (!classItem.start_date) return '';
      const d = new Date(classItem.start_date);
      if (Number.isNaN(d.getTime())) return '';
      return d.toLocaleDateString('de-DE', { month: 'short', year: 'numeric' });
    } catch {
      return '';
    }
  })();

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              classItem.is_active 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {classItem.is_active ? 'Aktiv' : 'Inaktiv'}
            </span>
            {isFull && classItem.is_active && (
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                Voll
              </span>
            )}
          </div>
          
          {/* Menu */}
          <div className="relative">
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 hover:bg-gray-100 rounded-lg"
            >
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>
            
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  <Link
                    href={`/admin/klassen/${classItem.id}`}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Edit className="w-4 h-4" />
                    Bearbeiten
                  </Link>
                  <Link
                    href={`/admin/klassen/${classItem.id}/studenten`}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Users className="w-4 h-4" />
                    Studenten
                  </Link>
                  <button
                    onClick={() => { onDelete(classItem.id); setMenuOpen(false); }}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                  >
                    <Trash2 className="w-4 h-4" />
                    Löschen
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{classItem.name}</h3>
        {classItem.description && (
          <p className="text-sm text-gray-500 mb-4 line-clamp-2">{classItem.description}</p>
        )}

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div className="flex items-center gap-2 text-gray-600">
            <Users className="w-4 h-4 text-gray-400" />
            <span>
              {classItem.current_students}
              {classItem.max_students ? `/${classItem.max_students}` : ''} Studenten
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>{startDateLabel || '—'}</span>
          </div>
          {scheduleString && (
            <div className="flex items-center gap-2 text-gray-600 col-span-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="truncate">{scheduleString}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
        <Link
          href={`/admin/klassen/${classItem.id}`}
          className="flex items-center justify-between text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          <span>Details anzeigen</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

// =========================================
// Hauptseite
// =========================================
export default function AdminClassesPage() {
  const toast = useToast();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Klassen laden
  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const res = await fetch('/api/admin/classes');
      const data = await res.json();
      setClasses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading classes:', err);
      toast.error('Fehler beim Laden der Klassen');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Klasse wirklich löschen?')) return;
    
    try {
      const res = await fetch(`/api/admin/classes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Fehler beim Löschen');
      
      setClasses(prev => prev.filter(c => c.id !== id));
      toast.success('Klasse gelöscht');
    } catch (err) {
      toast.error('Fehler beim Löschen');
    }
  };

  const filteredClasses = classes.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && c.is_active) ||
      (statusFilter === 'inactive' && !c.is_active);
    return matchesSearch && matchesStatus;
  });

  const activeClasses = classes.filter(c => c.is_active).length;
  const totalStudents = classes.reduce((sum, c) => sum + c.current_students, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Klassen</h1>
          <p className="text-gray-500 mt-1">
            {activeClasses} aktive Klassen • {totalStudents} Studenten
          </p>
        </div>
        <Link
          href="/admin/klassen/neu"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Neue Klasse
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Klassen suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">Alle Status</option>
          <option value="active">Aktiv</option>
          <option value="inactive">Inaktiv</option>
        </select>
      </div>

      {/* Classes Grid */}
      {filteredClasses.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClasses.map((classItem) => (
            <ClassCard 
              key={classItem.id} 
              classItem={classItem} 
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Klassen gefunden</h3>
          <p className="text-gray-500 mb-6">
            {search ? 'Versuchen Sie einen anderen Suchbegriff' : 'Erstellen Sie Ihre erste Klasse'}
          </p>
          {!search && (
            <Link
              href="/admin/klassen/neu"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
            >
              <Plus className="w-5 h-5" />
              Klasse erstellen
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
