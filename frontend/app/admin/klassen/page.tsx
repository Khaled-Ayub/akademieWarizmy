// ===========================================
// WARIZMY EDUCATION - Admin Klassenverwaltung
// ===========================================

'use client';

import { useState } from 'react';
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
  ChevronRight
} from 'lucide-react';

// =========================================
// Mock Data
// =========================================
const classes = [
  { 
    id: '1', 
    name: 'Arabisch Anfänger - Herbst 2026',
    course: 'Arabisch für Anfänger',
    teacher: 'Ustadh Ahmad',
    students: 15,
    maxStudents: 20,
    startDate: '2026-09-01',
    endDate: '2027-01-31',
    schedule: 'Mo & Mi, 18:00-19:30',
    status: 'active',
    progress: 65,
  },
  { 
    id: '2', 
    name: 'Quran Rezitation - Abend',
    course: 'Quran Rezitation',
    teacher: 'Ustadha Fatima',
    students: 8,
    maxStudents: 12,
    startDate: '2026-10-01',
    endDate: '2027-03-31',
    schedule: 'Di & Do, 20:00-21:00',
    status: 'active',
    progress: 45,
  },
  { 
    id: '3', 
    name: 'Sira Intensiv - Winter',
    course: 'Islamische Geschichte',
    teacher: 'Sheikh Abdullah',
    students: 22,
    maxStudents: 25,
    startDate: '2026-11-01',
    endDate: '2027-02-28',
    schedule: 'Sa, 10:00-12:00',
    status: 'active',
    progress: 30,
  },
  { 
    id: '4', 
    name: 'Arabisch A2 - Sommer 2026',
    course: 'Arabisch für Fortgeschrittene',
    teacher: 'Ustadh Ahmad',
    students: 12,
    maxStudents: 15,
    startDate: '2026-03-01',
    endDate: '2026-07-31',
    schedule: 'Mo & Mi, 18:00-19:30',
    status: 'completed',
    progress: 100,
  },
];

// =========================================
// Klassen-Karte
// =========================================
function ClassCard({ classItem, onAction }: { classItem: typeof classes[0]; onAction: (action: string, id: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isFull = classItem.students >= classItem.maxStudents;

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              classItem.status === 'active' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {classItem.status === 'active' ? 'Aktiv' : 'Abgeschlossen'}
            </span>
            {isFull && classItem.status === 'active' && (
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
                    onClick={() => { onAction('delete', classItem.id); setMenuOpen(false); }}
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
        <p className="text-sm text-gray-500 mb-4">{classItem.course}</p>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div className="flex items-center gap-2 text-gray-600">
            <Users className="w-4 h-4 text-gray-400" />
            <span>{classItem.students}/{classItem.maxStudents} Studenten</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <BookOpen className="w-4 h-4 text-gray-400" />
            <span>{classItem.teacher}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>{new Date(classItem.startDate).toLocaleDateString('de-DE', { month: 'short', year: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="truncate">{classItem.schedule}</span>
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-500">Fortschritt</span>
            <span className="font-medium text-gray-700">{classItem.progress}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${classItem.progress === 100 ? 'bg-green-500' : 'bg-primary-500'}`}
              style={{ width: `${classItem.progress}%` }}
            />
          </div>
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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredClasses = classes.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.course.toLowerCase().includes(search.toLowerCase()) ||
      c.teacher.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAction = (action: string, id: string) => {
    console.log(`Action: ${action}, Class: ${id}`);
    // TODO: Implement actions
  };

  const activeClasses = classes.filter(c => c.status === 'active').length;
  const totalStudents = classes.filter(c => c.status === 'active').reduce((sum, c) => sum + c.students, 0);

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
          <option value="completed">Abgeschlossen</option>
        </select>
      </div>

      {/* Classes Grid */}
      {filteredClasses.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClasses.map((classItem) => (
            <ClassCard key={classItem.id} classItem={classItem} onAction={handleAction} />
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

