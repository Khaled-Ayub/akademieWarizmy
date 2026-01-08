// ===========================================
// WARIZMY EDUCATION - Neue Ankündigung
// ===========================================
// Erstellen einer neuen Ankündigung

'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function NewAnnouncementPage() {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const router = useRouter();
  const { success, error } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          is_active: formData.is_active
        })
      });

      if (res.ok) {
        success('Ankündigung erfolgreich erstellt');
        router.push('/admin/ankuendigungen');
      } else {
        const data = await res.json();
        error(data.detail || 'Fehler beim Erstellen');
      }
    } catch (err) {
      error('Netzwerkfehler');
    } finally {
      setLoading(false);
    }
  }

  // KI-Vorschlag generieren
  async function generateWithAI() {
    if (!formData.title.trim()) {
      error('Bitte geben Sie zuerst einen Titel ein');
      return;
    }

    setAiLoading(true);
    try {
      const res = await fetch('/api/admin/announcements/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: formData.title,
          language: 'de'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({
          ...prev,
          content: data.suggestion
        }));
        success('KI-Vorschlag generiert!');
      } else {
        error('KI nicht verfügbar, verwende Vorlage');
        // Fallback-Vorlage
        setFormData(prev => ({
          ...prev,
          content: `⚠️ ${prev.title}

[Beschreibung hier ergänzen...]

Weitere Informationen folgen.`
        }));
      }
    } catch (err) {
      error('KI-Fehler, verwende Vorlage');
      setFormData(prev => ({
        ...prev,
        content: `⚠️ ${prev.title}

[Beschreibung hier ergänzen...]

Weitere Informationen folgen.`
      }));
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/admin/ankuendigungen"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Neue Ankündigung</h1>
          <p className="text-gray-500 mt-1">Erstellen Sie eine neue Plattform-Ankündigung</p>
        </div>
      </div>

      {/* Formular */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Titel */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Titel *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="z.B. Wartungsarbeiten am Wochenende"
              required
            />
          </div>

          {/* Inhalt */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                Inhalt *
              </label>
              <button
                type="button"
                onClick={generateWithAI}
                disabled={aiLoading || !formData.title.trim()}
                className="flex items-center gap-2 text-sm bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-all"
              >
                {aiLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {aiLoading ? 'Generiere...' : 'KI-Vorschlag'}
              </button>
            </div>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Beschreiben Sie die Ankündigung... Oder klicken Sie auf 'KI-Vorschlag' nach Eingabe des Titels"
              required
            />
            <p className="mt-1 text-xs text-gray-500">Tipp: Geben Sie zuerst einen Titel ein, dann generiert die KI einen passenden Textvorschlag.</p>
          </div>

          {/* Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
              Sofort aktivieren (öffentlich sichtbar)
            </label>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Speichern...' : 'Speichern'}
            </button>
            
            <Link
              href="/admin/ankuendigungen"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Abbrechen
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}