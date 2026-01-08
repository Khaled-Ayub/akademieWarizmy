'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Bell, Shield, Key, Globe, Moon, Sun, Users, CreditCard, Trash2, CheckCircle } from 'lucide-react';

interface SettingsData {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy: {
    profile_public: boolean;
    show_email: boolean;
    show_phone: boolean;
  };
  security: {
    two_factor: boolean;
    login_alerts: boolean;
  };
  appearance: {
    theme: 'light' | 'dark';
    language: 'de' | 'en';
  };
  subscription: {
    auto_renew: boolean;
  };
}

interface ExtendedUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  date_of_birth?: string | null;
  newsletter_opt_in?: boolean;
  whatsapp_opt_in?: boolean;
  whatsapp_channel_opt_in?: boolean;
  onboarding_completed?: boolean;
  role: 'student' | 'teacher' | 'admin';
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  // Einstellungsfelder
  email_notifications?: boolean;
  push_notifications?: boolean;
  sms_notifications?: boolean;
  profile_public?: boolean;
  show_email?: boolean;
  show_phone?: boolean;
  two_factor_enabled?: boolean;
  login_alerts?: boolean;
  theme?: 'light' | 'dark';
  language?: 'de' | 'en';
  auto_renew_subscription?: boolean;
}

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [settings, setSettings] = useState<SettingsData>({
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
    privacy: {
      profile_public: false,
      show_email: false,
      show_phone: false,
    },
    security: {
      two_factor: false,
      login_alerts: true,
    },
    appearance: {
      theme: 'light',
      language: 'de',
    },
    subscription: {
      auto_renew: true,
    }
  });

  const updateSetting = (category: keyof SettingsData, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      // Hier würde normalerweise ein API-Aufruf stattfinden
      // await usersApi.updateSettings(settings);
      
      // Mock-Datenaktualisierung
      if (user) {
        setUser({
          ...user,
          ...settings
        });
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Einstellungen konnten nicht gespeichert werden. Bitte versuchen Sie es später erneut.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-600">Laden...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Einstellungen</h1>
          <p className="text-gray-500 mt-1">Verwalte deine Kontoeinstellungen</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : success ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <CheckCircle className="w-5 h-5" />
          )}
          {saving ? 'Speichern...' : success ? 'Gespeichert!' : 'Speichern'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
          Einstellungen erfolgreich gespeichert!
        </div>
      )}

      {/* Benachrichtigungen */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-primary-500" />
            <h2 className="text-lg font-semibold text-gray-900">Benachrichtigungen</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
            <div>
              <div className="font-medium text-gray-900">E-Mail Benachrichtigungen</div>
              <div className="text-sm text-gray-500 mt-1">Wichtige Updates und Ankündigungen per E-Mail erhalten</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.email}
                onChange={(e) => updateSetting('notifications', 'email', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
            <div>
              <div className="font-medium text-gray-900">Push-Benachrichtigungen</div>
              <div className="text-sm text-gray-500 mt-1">Benachrichtigungen direkt in der App erhalten</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.push}
                onChange={(e) => updateSetting('notifications', 'push', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
            <div>
              <div className="font-medium text-gray-900">SMS-Benachrichtigungen</div>
              <div className="text-sm text-gray-500 mt-1">Wichtige Mitteilungen per SMS erhalten</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.sms}
                onChange={(e) => updateSetting('notifications', 'sms', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Datenschutz */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary-500" />
            <h2 className="text-lg font-semibold text-gray-900">Datenschutz</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
            <div>
              <div className="font-medium text-gray-900">Profil öffentlich sichtbar</div>
              <div className="text-sm text-gray-500 mt-1">Mache dein Profil für andere Nutzer sichtbar</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.privacy.profile_public}
                onChange={(e) => updateSetting('privacy', 'profile_public', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
            <div>
              <div className="font-medium text-gray-900">E-Mail anzeigen</div>
              <div className="text-sm text-gray-500 mt-1">Zeige deine E-Mail-Adresse in deinem Profil an</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.privacy.show_email}
                onChange={(e) => updateSetting('privacy', 'show_email', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Sicherheit */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary-500" />
            <h2 className="text-lg font-semibold text-gray-900">Sicherheit</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
            <div>
              <div className="font-medium text-gray-900">Zwei-Faktor-Authentifizierung</div>
              <div className="text-sm text-gray-500 mt-1">Erhöhe die Sicherheit deines Kontos</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.security.two_factor}
                onChange={(e) => updateSetting('security', 'two_factor', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
            <div>
              <div className="font-medium text-gray-900">Anmelde-Benachrichtigungen</div>
              <div className="text-sm text-gray-500 mt-1">Erhalte Benachrichtigungen bei Anmeldungen</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.security.login_alerts}
                onChange={(e) => updateSetting('security', 'login_alerts', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Erscheinungsbild */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Globe className="w-6 h-6 text-primary-500" />
            <h2 className="text-lg font-semibold text-gray-900">Erscheinungsbild</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="p-4 border border-gray-200 rounded-xl">
            <div className="font-medium text-gray-900 mb-3">Design</div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => updateSetting('appearance', 'theme', 'light')}
                className={`p-3 border rounded-lg flex items-center gap-2 ${
                  settings.appearance.theme === 'light' 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>Hell</span>
              </button>
              <button
                onClick={() => updateSetting('appearance', 'theme', 'dark')}
                className={`p-3 border rounded-lg flex items-center gap-2 ${
                  settings.appearance.theme === 'dark' 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>Dunkel</span>
              </button>
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-xl">
            <div className="font-medium text-gray-900 mb-3">Sprache</div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => updateSetting('appearance', 'language', 'de')}
                className={`p-3 border rounded-lg ${
                  settings.appearance.language === 'de' 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                Deutsch
              </button>
              <button
                onClick={() => updateSetting('appearance', 'language', 'en')}
                className={`p-3 border rounded-lg ${
                  settings.appearance.language === 'en' 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                English
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Konto */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-red-500" />
            <h2 className="text-lg font-semibold text-gray-900">Konto</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
            <div>
              <div className="font-medium text-gray-900">Automatische Verlängerung</div>
              <div className="text-sm text-gray-500 mt-1">Dein Abonnement wird automatisch verlängert</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.subscription.auto_renew}
                onChange={(e) => updateSetting('subscription', 'auto_renew', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>

          <div className="p-4 border border-gray-200 rounded-xl">
            <div className="font-medium text-gray-900 mb-2">Konto löschen</div>
            <p className="text-sm text-gray-500 mb-4">
              Dein Konto und alle damit verbundenen Daten dauerhaft löschen. Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <button className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
              <Trash2 className="w-4 h-4" />
              <span>Konto löschen</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}