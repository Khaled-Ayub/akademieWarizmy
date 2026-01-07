// ===========================================
// WARIZMY EDUCATION - Neuen Benutzer erstellen
// ===========================================

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Save, Loader2, Eye, EyeOff, UserPlus } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function NeuBenutzerPage() {
  const router = useRouter();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'student',
  });

  const handleSave = async () => {
    // Validierung
    if (!formData.email.trim()) {
      toast.error('Bitte E-Mail eingeben');
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      toast.error('Passwort muss mindestens 6 Zeichen haben');
      return;
    }
    if (!formData.first_name.trim()) {
      toast.error('Bitte Vorname eingeben');
      return;
    }
    if (!formData.last_name.trim()) {
      toast.error('Bitte Nachname eingeben');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || errorData.error || 'Fehler beim Erstellen');
      }

      toast.success('✅ Benutzer erfolgreich erstellt!');
      router.push('/admin/benutzer');
    } catch (err: any) {
      console.error('Error:', err);
      toast.error(err.message || 'Fehler beim Erstellen');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/admin/benutzer" 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Neuer Benutzer</h1>
            <p className="text-gray-500">Benutzer manuell anlegen</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 font-medium"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Erstellen
        </button>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Icon Header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-white font-semibold">Benutzer-Daten</h2>
        </div>

        <div className="p-6 space-y-5">
          {/* Name */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vorname *</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                placeholder="Max"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nachname *</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                placeholder="Mustermann"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* E-Mail */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="max@beispiel.de"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Passwort */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Passwort *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Mindestens 6 Zeichen"
                className="w-full px-4 py-2.5 pr-12 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Der Benutzer kann sein Passwort später selbst ändern
            </p>
          </div>

          {/* Rolle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rolle *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="student">👨‍🎓 Student</option>
              <option value="teacher">👨‍🏫 Lehrer</option>
              <option value="admin">🔐 Admin</option>
            </select>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Hinweis:</strong> Der Benutzer wird automatisch als verifiziert markiert 
              und kann sich sofort einloggen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

