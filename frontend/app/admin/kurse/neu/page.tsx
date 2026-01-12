// ===========================================
// WARIZMY EDUCATION - Neuer Kurs erstellen
// ===========================================

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Save, Loader2, Sparkles, ImagePlus, X, MapPin } from 'lucide-react';
import { useToast } from '@/components/Toast';

// Location Interface
interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
}

// KI-Generierung Hook
function useAIGenerate() {
  const [generating, setGenerating] = useState<string | null>(null);

  const generate = async (
    type: 'course_description' | 'course_short_description' | 'lesson_description' | 'lesson_titles',
    context: any
  ): Promise<string | null> => {
    setGenerating(type);
    try {
      const res = await fetch('/api/admin/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, context }),
      });
      if (!res.ok) throw new Error('Fehler');
      const data = await res.json();
      return data.text;
    } catch (err) {
      console.error('AI Error:', err);
      return null;
    } finally {
      setGenerating(null);
    }
  };

  return { generate, generating };
}

export default function NeuKursPage() {
  const router = useRouter();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { generate, generating } = useAIGenerate();

  // Thumbnail State
  const [thumbnail, setThumbnail] = useState<{ url: string } | null>(null);
  
  // Track ob Slug manuell bearbeitet wurde
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Locations State
  const [locations, setLocations] = useState<Location[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    short_description: '',
    preview_video_url: '',
    category: 'arabic',
    level: 'beginner',
    price: 0,
    price_type: 'one_time',
    course_type: 'course',
    duration_weeks: 0,
    is_active: false,
    is_featured: false,
    is_published: false,
    default_location_id: '',
    session_type: 'online',
  });

  // Locations laden
  useEffect(() => {
    async function loadLocations() {
      try {
        const res = await fetch('/api/admin/locations');
        const data = await res.json();
        setLocations(Array.isArray(data) ? data : data.items || data.data || []);
      } catch (err) {
        console.error('Error loading locations:', err);
      } finally {
        setLoadingLocations(false);
      }
    }
    loadLocations();
  }, []);

  // Bild hochladen
  const handleImageUpload = async (file: File) => {
    // Validierung
    if (!file.type.startsWith('image/')) {
      setError('Nur Bilder sind erlaubt (JPG, PNG, WebP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Bild zu groß (max. 5MB)');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload fehlgeschlagen');
      }

      const data = await res.json();
      setThumbnail({ url: data.url });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Drag & Drop Handler
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[äÄ]/g, 'ae')
      .replace(/[öÖ]/g, 'oe')
      .replace(/[üÜ]/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      // Slug automatisch generieren, wenn nicht manuell bearbeitet
      slug: slugManuallyEdited ? prev.slug : generateSlug(title),
    }));
  };
  
  const handleSlugChange = (slug: string) => {
    setSlugManuallyEdited(true);
    setFormData(prev => ({ ...prev, slug }));
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      setError('Bitte geben Sie einen Titel ein');
      toast.error('Bitte geben Sie einen Titel ein');
      return;
    }
    
    if (!formData.slug.trim()) {
      setError('Bitte geben Sie einen URL-Slug ein');
      toast.error('Bitte geben Sie einen URL-Slug ein');
      return;
    }
    
    setSaving(true);
    setError(null);

    try {
      // Daten mit Thumbnail-URL zusammenstellen
      const courseData = {
        ...formData,
        thumbnail_url: thumbnail?.url || null,
        default_location_id: formData.default_location_id || null,
      };

      console.log('Sending course data:', courseData);

      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData),
      });

      console.log('Response status:', res.status);

      if (!res.ok) {
        const errorData = await res.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.error?.message || errorData.detail || 'Fehler beim Speichern');
      }

      const result = await res.json();
      console.log('Success response:', result);
      
      // FastAPI gibt das Objekt direkt zurück oder in data
      const createdCourse = result.data || result;
      
      // Erfolgs-Toast anzeigen
      toast.success(`Kurs "${formData.title}" wurde erfolgreich erstellt!`);
      
      // Kurz warten, damit der Toast sichtbar ist
      setTimeout(() => {
        router.push(`/admin/kurse/${createdCourse.id}`);
      }, 1000);
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.message);
      toast.error(err.message || 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/kurse" className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Neuer Kurs</h1>
            <p className="text-gray-500 text-sm">Grunddaten eingeben</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50">
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Speichern
        </button>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-200">
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Grunddaten</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titel *</label>
            <input type="text" value={formData.title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="z.B. Arabisch Grundkurs" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL-Slug</label>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">/kurse/</span>
              <input 
                type="text" 
                value={formData.slug} 
                onChange={(e) => handleSlugChange(e.target.value)} 
                placeholder="wird-automatisch-generiert"
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" 
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Wird automatisch aus dem Titel generiert. Nur ändern wenn nötig.
            </p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">Kurzbeschreibung</label>
              <button
                type="button"
                onClick={async () => {
                  if (!formData.title) return alert('Bitte zuerst Titel eingeben');
                  const text = await generate('course_short_description', { title: formData.title });
                  if (text) setFormData(prev => ({ ...prev, short_description: text }));
                }}
                disabled={generating === 'course_short_description'}
                className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 disabled:opacity-50"
              >
                {generating === 'course_short_description' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                KI generieren
              </button>
            </div>
            <input type="text" value={formData.short_description} onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))} maxLength={200} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">Beschreibung</label>
              <button
                type="button"
                onClick={async () => {
                  if (!formData.title) return alert('Bitte zuerst Titel eingeben');
                  const text = await generate('course_description', { 
                    title: formData.title,
                    category: formData.category,
                    level: formData.level 
                  });
                  if (text) setFormData(prev => ({ ...prev, description: text }));
                }}
                disabled={generating === 'course_description'}
                className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 disabled:opacity-50"
              >
                {generating === 'course_description' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                KI generieren
              </button>
            </div>
            <textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} rows={5} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vorschau-Video (Vimeo/YouTube Link)</label>
            <input 
              type="url" 
              value={formData.preview_video_url} 
              onChange={(e) => setFormData(prev => ({ ...prev, preview_video_url: e.target.value }))} 
              placeholder="https://vimeo.com/123456789 oder https://youtu.be/VIDEO_ID"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" 
            />
            <p className="mt-1 text-xs text-gray-500">Gib den kompletten Vimeo- oder YouTube-Link ein</p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Kursbild (Thumbnail)</h2>
          <p className="text-sm text-gray-500">Empfohlene Größe: <strong>1280 × 720 Pixel</strong> (16:9 Format)</p>
          
          {thumbnail ? (
            // Bild-Vorschau
            <div className="relative inline-block">
              <img 
                src={thumbnail.url}
                alt="Kursbild Vorschau" 
                className="w-64 h-36 object-cover rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={() => setThumbnail(null)}
                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            // Upload-Bereich
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors cursor-pointer"
            >
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
                className="hidden"
                id="thumbnail-upload"
              />
              <label htmlFor="thumbnail-upload" className="cursor-pointer">
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
                    <span className="text-sm text-gray-500">Wird hochgeladen...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <ImagePlus className="w-10 h-10 text-gray-400" />
                    <span className="text-sm text-gray-600">Bild hierher ziehen oder klicken</span>
                    <span className="text-xs text-gray-400">JPG, PNG, WebP (max. 5MB)</span>
                  </div>
                )}
              </label>
            </div>
          )}
        </div>

        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Klassifizierung</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie</label>
              <select value={formData.category} onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white">
                <option value="arabic">Arabisch</option>
                <option value="islamic">Islamisch</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Schwierigkeit</label>
              <select value={formData.level} onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white">
                <option value="beginner">Anfänger</option>
                <option value="intermediate">Fortgeschritten</option>
                <option value="advanced">Experte</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Typ</label>
              <select value={formData.course_type} onChange={(e) => setFormData(prev => ({ ...prev, course_type: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white">
                <option value="course">Kurs</option>
                <option value="seminar">Seminar</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary-500" />
            Unterrichtsort
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unterrichtsart</label>
              <select 
                value={formData.session_type} 
                onChange={(e) => setFormData(prev => ({ ...prev, session_type: e.target.value }))} 
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white"
              >
                <option value="online">🖥️ Online (Zoom)</option>
                <option value="onsite">📍 Vor Ort</option>
                <option value="hybrid">🔄 Hybrid (Online + Vor Ort)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Standort</label>
              <select 
                value={formData.default_location_id} 
                onChange={(e) => setFormData(prev => ({ ...prev, default_location_id: e.target.value }))} 
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white"
                disabled={loadingLocations || formData.session_type === 'online'}
              >
                <option value="">
                  {formData.session_type === 'online' ? 'Nicht erforderlich (Online)' : 'Standort auswählen...'}
                </option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} - {loc.city}
                  </option>
                ))}
              </select>
              {formData.session_type !== 'online' && locations.length === 0 && !loadingLocations && (
                <p className="mt-1 text-xs text-amber-600">
                  Keine Standorte vorhanden. <Link href="/admin/standorte/neu" className="underline">Standort erstellen →</Link>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Preis</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preis (EUR)</label>
              <input type="number" min="0" value={formData.price} onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preismodell</label>
              <select value={formData.price_type} onChange={(e) => setFormData(prev => ({ ...prev, price_type: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white">
                <option value="one_time">Einmalig</option>
                <option value="subscription">Abo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dauer (Wochen)</label>
              <input type="number" min="0" value={formData.duration_weeks} onChange={(e) => setFormData(prev => ({ ...prev, duration_weeks: parseInt(e.target.value) || 0 }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg" />
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Veröffentlichung</h2>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={formData.is_published} 
                onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))} 
                className="w-5 h-5 rounded border-green-300 text-green-600 focus:ring-green-500" 
              />
              <span className="text-sm font-medium text-green-700">✅ Veröffentlicht</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={formData.is_active} 
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))} 
                className="w-5 h-5 rounded" 
              />
              <span className="text-sm font-medium">Aktiv</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={formData.is_featured} 
                onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))} 
                className="w-5 h-5 rounded border-amber-300 text-amber-600 focus:ring-amber-500" 
              />
              <span className="text-sm font-medium">⭐ Hervorgehoben (Startseite)</span>
            </label>
          </div>
          
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Tipp:</strong> Damit ein Kurs auf der Startseite erscheint, müssen Sie:
              <br/>• <strong>Veröffentlicht</strong> UND <strong>Aktiv</strong> aktivieren
              <br/>• Für die Startseite zusätzlich <strong>Hervorgehoben</strong> aktivieren
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


