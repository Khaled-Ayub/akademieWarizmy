// ===========================================
// WARIZMY EDUCATION - Admin Standortverwaltung
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
  MapPin,
  Video,
  Phone,
  Mail,
  Globe,
  Building2,
  Loader2
} from 'lucide-react';
import { useToast } from '@/components/Toast';

// =========================================
// Types
// =========================================
interface Location {
  id: string;
  name: string;
  slug: string;
  description?: string;
  street?: string;
  zip_code?: string;
  city?: string;
  country?: string;
  logo_url?: string;
  image_url?: string;
  phone?: string;
  email?: string;
  website?: string;
  is_active: boolean;
  is_online: boolean;
  full_address?: string;
}

// =========================================
// Standort-Karte
// =========================================
function LocationCard({ 
  location, 
  onEdit,
  onDelete 
}: { 
  location: Location; 
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all overflow-hidden">
      {/* Header mit Logo/Bild */}
      <div className="h-32 bg-gradient-to-br from-primary-500 to-primary-700 relative">
        {location.image_url ? (
          <img 
            src={location.image_url} 
            alt={location.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            {location.is_online ? (
              <Video className="w-12 h-12 text-white/50" />
            ) : (
              <Building2 className="w-12 h-12 text-white/50" />
            )}
          </div>
        )}
        
        {/* Logo */}
        {location.logo_url && (
          <div className="absolute -bottom-6 left-4 w-12 h-12 bg-white rounded-lg shadow-lg p-1">
            <img 
              src={location.logo_url} 
              alt={`${location.name} Logo`}
              className="w-full h-full object-contain"
            />
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            location.is_online 
              ? 'bg-blue-500 text-white' 
              : location.is_active 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-500 text-white'
          }`}>
            {location.is_online ? '🌐 Online' : location.is_active ? '✓ Aktiv' : 'Inaktiv'}
          </span>
        </div>
        
        {/* Menu */}
        <div className="absolute top-3 right-3">
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm"
          >
            <MoreVertical className="w-4 h-4 text-white" />
          </button>
          
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                <button
                  onClick={() => { onEdit(); setMenuOpen(false); }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
                >
                  <Edit className="w-4 h-4" />
                  Bearbeiten
                </button>
                <button
                  onClick={() => { onDelete(); setMenuOpen(false); }}
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

      {/* Content */}
      <div className={`p-4 ${location.logo_url ? 'pt-8' : ''}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{location.name}</h3>
        
        {location.full_address && !location.is_online && (
          <p className="text-sm text-gray-500 flex items-start gap-1.5 mb-3">
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            {location.full_address}
          </p>
        )}
        
        {location.is_online && (
          <p className="text-sm text-blue-600 mb-3">
            Online-Unterricht via Zoom
          </p>
        )}

        {/* Contact Info */}
        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          {location.phone && (
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" />
              {location.phone}
            </span>
          )}
          {location.email && (
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" />
              {location.email}
            </span>
          )}
          {location.website && (
            <a 
              href={location.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary-600 hover:text-primary-700"
            >
              <Globe className="w-3.5 h-3.5" />
              Website
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// =========================================
// Hauptseite
// =========================================
export default function AdminLocationsPage() {
  const toast = useToast();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  // Standorte laden
  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const res = await fetch('/api/admin/locations');
      const data = await res.json();
      setLocations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading locations:', err);
      toast.error('Fehler beim Laden der Standorte');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Standort wirklich löschen?')) return;
    
    try {
      const res = await fetch(`/api/admin/locations/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Fehler beim Löschen');
      
      setLocations(prev => prev.filter(l => l.id !== id));
      toast.success('Standort gelöscht');
    } catch (err) {
      toast.error('Fehler beim Löschen');
    }
  };

  const filteredLocations = locations.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.city?.toLowerCase().includes(search.toLowerCase())
  );

  const onlineLocations = filteredLocations.filter(l => l.is_online);
  const physicalLocations = filteredLocations.filter(l => !l.is_online);

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
          <h1 className="text-2xl font-bold text-gray-900">Standorte</h1>
          <p className="text-gray-500 mt-1">
            {locations.length} Standort{locations.length !== 1 ? 'e' : ''} verfügbar
          </p>
        </div>
        <Link
          href="/admin/standorte/neu"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Neuer Standort
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Standorte suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Online Standorte */}
      {onlineLocations.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-500" />
            Online
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {onlineLocations.map((location) => (
              <LocationCard 
                key={location.id} 
                location={location}
                onEdit={() => window.location.href = `/admin/standorte/${location.id}`}
                onDelete={() => handleDelete(location.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Physische Standorte */}
      {physicalLocations.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-500" />
            Vor Ort
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {physicalLocations.map((location) => (
              <LocationCard 
                key={location.id} 
                location={location}
                onEdit={() => window.location.href = `/admin/standorte/${location.id}`}
                onDelete={() => handleDelete(location.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredLocations.length === 0 && !loading && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {search ? 'Keine Standorte gefunden' : 'Noch keine Standorte'}
          </h3>
          <p className="text-gray-500 mb-6">
            {search ? 'Versuchen Sie einen anderen Suchbegriff' : 'Erstellen Sie Ihren ersten Standort'}
          </p>
          {!search && (
            <Link
              href="/admin/standorte/neu"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
            >
              <Plus className="w-5 h-5" />
              Standort erstellen
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

