// ===========================================
// WARIZMY EDUCATION - Admin Benutzerverwaltung
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
  Mail,
  Shield,
  UserCheck,
  UserX,
  Download,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/components/Toast';

// =========================================
// Types
// =========================================
interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
}

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
function UserRow({ user, onAction }: { user: User; onAction: (action: string, userId: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {user.first_name?.[0]?.toUpperCase()}{user.last_name?.[0]?.toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{user.first_name} {user.last_name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="py-4 px-4">
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${roleColors[user.role] || 'bg-gray-100 text-gray-700'}`}>
          {roleLabels[user.role] || user.role}
        </span>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          {user.is_active ? (
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
        {user.email_verified ? (
          <span className="text-green-600 text-sm">✓ Verifiziert</span>
        ) : (
          <span className="text-orange-600 text-sm">Ausstehend</span>
        )}
      </td>
      <td className="py-4 px-4 text-sm text-gray-500">
        {new Date(user.created_at).toLocaleDateString('de-DE')}
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
                <Link
                  href={`/admin/benutzer/${user.id}`}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
                >
                  <Edit className="w-4 h-4" />
                  Bearbeiten
                </Link>
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
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Benutzer laden
  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (search) params.append('search', search);
      
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading users:', err);
      toast.error('Fehler beim Laden der Benutzer');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  // Suche mit Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleUserAction = async (action: string, userId: string) => {
    if (action === 'delete') {
      if (!confirm('Benutzer wirklich löschen?')) return;
      // TODO: Delete API call
      toast.info('Löschen wird noch implementiert');
    } else if (action === 'role') {
      // TODO: Role change modal
      toast.info('Rollenänderung wird noch implementiert');
    } else if (action === 'email') {
      const user = users.find(u => u.id === userId);
      if (user) {
        window.location.href = `mailto:${user.email}`;
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Benutzer</h1>
          <p className="text-gray-500 mt-1">
            {loading ? 'Laden...' : `${users.length} Benutzer gefunden`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadUsers}
            className="p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50"
            title="Aktualisieren"
          >
            <RefreshCw className={`w-5 h-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/admin/benutzer/neu"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Neuer Benutzer
          </Link>
        </div>
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
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : (
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
                {users.map((user) => (
                  <UserRow key={user.id} user={user} onAction={handleUserAction} />
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {!loading && users.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            Keine Benutzer gefunden
          </div>
        )}
      </div>
    </div>
  );
}
