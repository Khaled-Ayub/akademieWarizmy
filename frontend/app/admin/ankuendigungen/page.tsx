// ===========================================
// WARIZMY EDUCATION - Admin Ankündigungen
// ===========================================
// Verwaltung aller Ankündigungen

'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Calendar,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/components/Toast';

interface Announcement {
  id: number;
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const { success, error } = useToast();

  // Daten laden
  useEffect(() => {
    fetchAnnouncements();
  }, []);

  async function fetchAnnouncements() {
    try {
      const res = await fetch('/api/admin/announcements');
      const data = await res.json();
      if (data.success) {
        setAnnouncements(data.data);
      }
    } catch (err) {
      error('Fehler beim Laden der Ankündigungen');
    } finally {
      setLoading(false);
    }
  }

  // Status umschalten
  async function toggleStatus(id: number, currentStatus: boolean) {
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus })
      });
      
      if (res.ok) {
        success(`Ankündigung ${!currentStatus ? 'aktiviert' : 'deaktiviert'}`);
        fetchAnnouncements();
      }
    } catch (err) {
      error('Fehler beim Ändern des Status');
    }
  }

  // Löschen
  async function deleteAnnouncement(id: number) {
    if (!confirm('Ankündigung wirklich löschen?')) return;
    
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        success('Ankündigung gelöscht');
        fetchAnnouncements();
      }
    } catch (err) {
      error('Fehler beim Löschen');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ankündigungen</h1>
          <p className="text-gray-500 mt-1">Verwalten Sie alle Plattform-Ankündigungen</p>
        </div>
        <Link 
          href="/admin/ankuendigungen/neu"
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Neu erstellen
        </Link>
      </div>

      {/* Liste */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {announcements.length === 0 ? (
          <div className="p-12 text-center">
            <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Ankündigungen</h3>
            <p className="text-gray-500 mb-6">Erstellen Sie Ihre erste Ankündigung</p>
            <Link 
              href="/admin/ankuendigungen/neu"
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
            >
              <Plus className="w-4 h-4" />
              Erste Ankündigung erstellen
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                      {announcement.is_active ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Aktiv
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Inaktiv
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-3 line-clamp-2">{announcement.content}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(announcement.created_at).toLocaleDateString('de-DE')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(announcement.updated_at).toLocaleTimeString('de-DE', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => toggleStatus(announcement.id, announcement.is_active)}
                      className={`p-2 rounded-lg transition-colors ${
                        announcement.is_active 
                          ? 'text-orange-600 hover:bg-orange-50' 
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                      title={announcement.is_active ? 'Deaktivieren' : 'Aktivieren'}
                    >
                      {announcement.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    
                    <Link
                      href={`/admin/ankuendigungen/${announcement.id}/bearbeiten`}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Bearbeiten"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    
                    <button
                      onClick={() => deleteAnnouncement(announcement.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}