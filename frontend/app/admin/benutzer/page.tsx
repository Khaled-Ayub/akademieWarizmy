// ===========================================
// WARIZMY EDUCATION - Admin Benutzerverwaltung
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
  Mail,
  Shield,
  UserCheck,
  UserX,
  Filter,
  Download
} from 'lucide-react';

// =========================================
// Mock Data
// =========================================
const users = [
  { id: '1', firstName: 'Ahmad', lastName: 'Hassan', email: 'ahmad@example.com', role: 'student', status: 'active', verified: true, createdAt: '2026-01-01' },
  { id: '2', firstName: 'Fatima', lastName: 'Ali', email: 'fatima@example.com', role: 'student', status: 'active', verified: true, createdAt: '2026-01-02' },
  { id: '3', firstName: 'Omar', lastName: 'Khan', email: 'omar@example.com', role: 'student', status: 'active', verified: false, createdAt: '2026-01-03' },
  { id: '4', firstName: 'Sara', lastName: 'Ahmed', email: 'sara@example.com', role: 'student', status: 'inactive', verified: true, createdAt: '2026-01-04' },
  { id: '5', firstName: 'Ustadh', lastName: 'Ahmad', email: 'ustadh@warizmy.com', role: 'teacher', status: 'active', verified: true, createdAt: '2025-06-01' },
  { id: '6', firstName: 'Ustadha', lastName: 'Fatima', email: 'ustadha@warizmy.com', role: 'teacher', status: 'active', verified: true, createdAt: '2025-06-01' },
  { id: '7', firstName: 'Admin', lastName: 'User', email: 'admin@warizmy.com', role: 'admin', status: 'active', verified: true, createdAt: '2025-01-01' },
];

const roleLabels: Record<string, string> = {
  student: 'Student',
  teacher: 'Lehrer',
  admin: 'Admin',
};

const roleColors: Record<string, string> = {
  student: 'bg-blue-100 text-blue-700',
  teacher: 'bg-purple-100 text-purple-700',
  admin: 'bg-red-100 text-red-700',
};

// =========================================
// Benutzer-Zeile
// =========================================
function UserRow({ user, onAction }: { user: typeof users[0]; onAction: (action: string, userId: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">
              {user.firstName[0]}{user.lastName[0]}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="py-4 px-4">
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${roleColors[user.role]}`}>
          {roleLabels[user.role]}
        </span>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          {user.status === 'active' ? (
            <span className="flex items-center gap-1 text-green-600 text-sm">
              <UserCheck className="w-4 h-4" />
              Aktiv
            </span>
          ) : (
            <span className="flex items-center gap-1 text-gray-400 text-sm">
              <UserX className="w-4 h-4" />
              Inaktiv
            </span>
          )}
        </div>
      </td>
      <td className="py-4 px-4">
        {user.verified ? (
          <span className="text-green-600 text-sm">✓ Verifiziert</span>
        ) : (
          <span className="text-orange-600 text-sm">Ausstehend</span>
        )}
      </td>
      <td className="py-4 px-4 text-sm text-gray-500">
        {new Date(user.createdAt).toLocaleDateString('de-DE')}
      </td>
      <td className="py-4 px-4">
        <div className="relative">
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>
          
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                <button
                  onClick={() => { onAction('edit', user.id); setMenuOpen(false); }}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
                >
                  <Edit className="w-4 h-4" />
                  Bearbeiten
                </button>
                <button
                  onClick={() => { onAction('email', user.id); setMenuOpen(false); }}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
                >
                  <Mail className="w-4 h-4" />
                  E-Mail senden
                </button>
                <button
                  onClick={() => { onAction('role', user.id); setMenuOpen(false); }}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
                >
                  <Shield className="w-4 h-4" />
                  Rolle ändern
                </button>
                <hr className="my-1" />
                <button
                  onClick={() => { onAction('delete', user.id); setMenuOpen(false); }}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                >
                  <Trash2 className="w-4 h-4" />
                  Löschen
                </button>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

// =========================================
// Hauptseite
// =========================================
export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(search.toLowerCase()) ||
      user.lastName.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleUserAction = (action: string, userId: string) => {
    console.log(`Action: ${action}, User: ${userId}`);
    // TODO: Implement actions
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Benutzer</h1>
          <p className="text-gray-500 mt-1">{users.length} Benutzer insgesamt</p>
        </div>
        <Link
          href="/admin/benutzer/neu"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Neuer Benutzer
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Benutzer suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Alle Rollen</option>
            <option value="student">Studenten</option>
            <option value="teacher">Lehrer</option>
            <option value="admin">Admins</option>
          </select>
          
          <button className="px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Benutzer</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Rolle</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">E-Mail</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Registriert</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <UserRow key={user.id} user={user} onAction={handleUserAction} />
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            Keine Benutzer gefunden
          </div>
        )}
      </div>
    </div>
  );
}

