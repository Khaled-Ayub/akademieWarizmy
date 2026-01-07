// ===========================================
// WARIZMY EDUCATION - Neuer Standort
// ===========================================

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ChevronLeft, 
  Save, 
  Loader2, 
  MapPin, 
  Video,
  Building2,
  Phone,
  Mail,
  Globe,
  Image,
  Upload
} from 'lucide-react';
import { useToast } from '@/components/Toast';

// Slug generieren
const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[äÄ]/g, 'ae')
    .replace(/[öÖ]/g, 'oe')
    .replace(/[üÜ]/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

export default function NeuerStandortPage() {
  const router = useRouter();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [slugManuallyChanged, setSlugManuallyChanged] = useState(false);
  const [uploading, setUploading] = useState<'logo' | 'image' | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    is_online: false,
    // Adresse
    street: '',
    zip_code: '',
    city: '',
    country: 'Deutschland',
    // Koordinaten
    latitude: '',
    longitude: '',
    // Medien
    logo_url: '',
    image_url: '',
    // Kontakt
    phone: '',
    email: '',
    website: '',
    // Infos
    parking_info: '',
    public_transport: '',
    accessibility: '',
    // Status
    is_active: true,
    order: 0,
  });

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: slugManuallyChanged ? prev.slug : generateSlug(name)
    }));
  };

  const handleSlugChange = (slug: string) => {
    setSlugManuallyChanged(true);
    setFormData(prev => ({ ...prev, slug }));
  };

  const handleImageUpload = async (file: File, type: 'logo' | 'image') => {
    setUploading(type);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) throw new Error('Upload fehlgeschlagen');
      
      const data = await res.json();
      const url = data.url || data.file_url;
      
      setFormData(prev => ({
        ...prev,
        [type === 'logo' ? 'logo_url' : 'image_url']: url
      }));
      
      toast.success(`${type === 'logo' ? 'Logo' : 'Bild'} hochgeladen!`);
    } catch (err) {
      toast.error('Upload fehlgeschlagen');
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Bitte gib einen Namen ein');
      return;
    }
    if (!formData.slug.trim()) {
      toast.error('Bitte gib einen Slug ein');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      };

      const res = await fetch('/api/admin/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || 'Fehler beim Erstellen');
      }

      toast.success('✅ Standort erfolgreich erstellt!');
      router.push('/admin/standorte');
    } catch (err: any) {
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
            href="/admin/standorte" 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Neuer Standort</h1>
            <p className="text-gray-500">Erstelle einen neuen Unterrichtsort</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 font-medium"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Standort erstellen
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Linke Spalte - Hauptdaten */}
        <div className="lg:col-span-2 space-y-6">
          {/* Typ-Auswahl */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Art des Standorts</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, is_online: false }))}
                className={`p-4 rounded-xl border-2 transition-all ${
                  !formData.is_online 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Building2 className={`w-8 h-8 mx-auto mb-2 ${!formData.is_online ? 'text-primary-600' : 'text-gray-400'}`} />
                <p className={`font-medium ${!formData.is_online ? 'text-primary-700' : 'text-gray-600'}`}>Vor Ort</p>
                <p className="text-xs text-gray-500 mt-1">Physischer Standort</p>
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, is_online: true }))}
                className={`p-4 rounded-xl border-2 transition-all ${
                  formData.is_online 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Video className={`w-8 h-8 mx-auto mb-2 ${formData.is_online ? 'text-blue-600' : 'text-gray-400'}`} />
                <p className={`font-medium ${formData.is_online ? 'text-blue-700' : 'text-gray-600'}`}>Online</p>
                <p className="text-xs text-gray-500 mt-1">Virtueller Unterricht</p>
              </button>
            </div>
          </div>

          {/* Basis-Informationen */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Basis-Informationen</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="z.B. Islamisches Zentrum Berlin"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL-Slug *</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="islamisches-zentrum-berlin"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                {slugManuallyChanged ? '✏️ Manuell angepasst' : '🔄 Automatisch vom Namen'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                placeholder="Beschreibe den Standort..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>
          </div>

          {/* Adresse (nur bei physischem Standort) */}
          {!formData.is_online && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary-500" />
                Adresse
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Straße & Hausnummer</label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                  placeholder="Musterstraße 123"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PLZ</label>
                  <input
                    type="text"
                    value={formData.zip_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, zip_code: e.target.value }))}
                    placeholder="12345"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stadt</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Berlin"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Land</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          )}

          {/* Kontakt */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Kontakt</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Telefon
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+49 30 12345678"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail className="w-4 h-4 inline mr-1" />
                  E-Mail
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="kontakt@standort.de"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Globe className="w-4 h-4 inline mr-1" />
                Website
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://www.standort.de"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Zusatzinfos (nur bei physischem Standort) */}
          {!formData.is_online && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Zusätzliche Informationen</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">🅿️ Parkplätze</label>
                <textarea
                  value={formData.parking_info}
                  onChange={(e) => setFormData(prev => ({ ...prev, parking_info: e.target.value }))}
                  rows={2}
                  placeholder="Kostenlose Parkplätze vor dem Gebäude..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">🚇 ÖPNV</label>
                <textarea
                  value={formData.public_transport}
                  onChange={(e) => setFormData(prev => ({ ...prev, public_transport: e.target.value }))}
                  rows={2}
                  placeholder="U-Bahn Linie 6, Haltestelle Musterstraße..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">♿ Barrierefreiheit</label>
                <textarea
                  value={formData.accessibility}
                  onChange={(e) => setFormData(prev => ({ ...prev, accessibility: e.target.value }))}
                  rows={2}
                  placeholder="Aufzug vorhanden, barrierefreier Zugang..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Rechte Spalte - Medien & Status */}
        <div className="space-y-6">
          {/* Logo */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Logo</h2>
            
            {formData.logo_url ? (
              <div className="relative">
                <img 
                  src={formData.logo_url} 
                  alt="Logo" 
                  className="w-full h-32 object-contain bg-gray-50 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, logo_url: '' }))}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full text-xs"
                >
                  ✕
                </button>
              </div>
            ) : (
              <label className="block">
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-primary-300 transition-colors">
                  {uploading === 'logo' ? (
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-500" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Logo hochladen</p>
                      <p className="text-xs text-gray-400">PNG, JPG, max. 2MB</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'logo')}
                />
              </label>
            )}
          </div>

          {/* Bild */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Standort-Bild</h2>
            
            {formData.image_url ? (
              <div className="relative">
                <img 
                  src={formData.image_url} 
                  alt="Standort" 
                  className="w-full h-40 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full text-xs"
                >
                  ✕
                </button>
              </div>
            ) : (
              <label className="block">
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-primary-300 transition-colors">
                  {uploading === 'image' ? (
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-500" />
                  ) : (
                    <>
                      <Image className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Bild hochladen</p>
                      <p className="text-xs text-gray-400">PNG, JPG, max. 5MB</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'image')}
                />
              </label>
            )}
          </div>

          {/* Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Status</h2>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="w-4 h-4 rounded"
              />
              <label htmlFor="is_active" className="text-sm text-gray-700 cursor-pointer">
                <span className="font-medium">Standort aktiv</span>
                <span className="block text-xs text-gray-500">Wird bei Kursauswahl angezeigt</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

