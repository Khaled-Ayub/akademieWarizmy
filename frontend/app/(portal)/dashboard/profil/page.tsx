// ===========================================
// WARIZMY EDUCATION - Schüler Profilseite
// ===========================================
// Profilverwaltung für eingeloggte Schüler

'use client';

import { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Save,
  Loader2,
  CheckCircle,
  Bell,
  MessageSquare,
  Shield,
  Award,
  BookOpen
} from 'lucide-react';

import { useAuthStore, User as UserType } from '@/stores/authStore';
import { usersApi, getErrorMessage } from '@/lib/api';

// =========================================
// Typen
// =========================================
interface ProfileData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  address_street: string;
  address_city: string;
  address_zip: string;
  address_country: string;
  newsletter_opt_in: boolean;
  whatsapp_opt_in: boolean;
  whatsapp_channel_opt_in: boolean;
}

// =========================================
// Profilkarte Komponente
// =========================================
function ProfileCard({ 
  title, 
  icon: Icon, 
  children 
}: { 
  title: string; 
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary-600" />
        </div>
        <h2 className="font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

// =========================================
// Input Komponente
// =========================================
function FormInput({ 
  label, 
  type = 'text',
  value, 
  onChange, 
  placeholder,
  disabled = false,
  icon: Icon
}: { 
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  icon?: React.ElementType;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500 ${Icon ? 'pl-10' : ''}`}
        />
      </div>
    </div>
  );
}

// =========================================
// Toggle Komponente
// =========================================
function Toggle({ 
  label, 
  description,
  checked, 
  onChange 
}: { 
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-4 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
      <div className="relative flex-shrink-0 mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
      </div>
      <div>
        <div className="text-sm font-medium text-gray-900">{label}</div>
        {description && (
          <div className="text-sm text-gray-500 mt-0.5">{description}</div>
        )}
      </div>
    </label>
  );
}

// =========================================
// Statistik Badge
// =========================================
function StatBadge({ 
  icon: Icon, 
  label, 
  value 
}: { 
  icon: React.ElementType;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
      <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
        <Icon className="w-5 h-5 text-primary-500" />
      </div>
      <div>
        <div className="text-lg font-bold text-gray-900">{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  );
}

// =========================================
// Hauptseite
// =========================================
export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [profile, setProfile] = useState<ProfileData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    address_street: '',
    address_city: '',
    address_zip: '',
    address_country: 'Deutschland',
    newsletter_opt_in: false,
    whatsapp_opt_in: false,
    whatsapp_channel_opt_in: false,
  });

  // Profildaten laden
  useEffect(() => {
    if (user) {
      setProfile({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        date_of_birth: user.date_of_birth || '',
        address_street: (user as any).address_street || '',
        address_city: (user as any).address_city || '',
        address_zip: (user as any).address_zip || '',
        address_country: (user as any).address_country || 'Deutschland',
        newsletter_opt_in: user.newsletter_opt_in || false,
        whatsapp_opt_in: user.whatsapp_opt_in || false,
        whatsapp_channel_opt_in: user.whatsapp_channel_opt_in || false,
      });
    }
  }, [user]);

  // Profil speichern
  const handleSave = async () => {
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      const updated = await usersApi.updateProfile({
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone || undefined,
        date_of_birth: profile.date_of_birth || undefined,
        address_street: profile.address_street || undefined,
        address_city: profile.address_city || undefined,
        address_zip: profile.address_zip || undefined,
        address_country: profile.address_country || undefined,
        newsletter_opt_in: profile.newsletter_opt_in,
        whatsapp_opt_in: profile.whatsapp_opt_in,
        whatsapp_channel_opt_in: profile.whatsapp_channel_opt_in,
      });

      // Store aktualisieren
      if (user) {
        setUser({
          ...user,
          first_name: updated.first_name || profile.first_name,
          last_name: updated.last_name || profile.last_name,
          phone: updated.phone || profile.phone,
          date_of_birth: updated.date_of_birth || profile.date_of_birth,
          newsletter_opt_in: updated.newsletter_opt_in ?? profile.newsletter_opt_in,
          whatsapp_opt_in: updated.whatsapp_opt_in ?? profile.whatsapp_opt_in,
          whatsapp_channel_opt_in: updated.whatsapp_channel_opt_in ?? profile.whatsapp_channel_opt_in,
        });
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof ProfileData, value: string | boolean) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mein Profil</h1>
          <p className="text-gray-500 mt-1">Verwalte deine persönlichen Daten</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : success ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {saving ? 'Speichern...' : success ? 'Gespeichert!' : 'Speichern'}
        </button>
      </div>

      {/* Fehler/Erfolg */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Profil-Header mit Avatar */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">
            {user.first_name?.[0]}{user.last_name?.[0]}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{user.first_name} {user.last_name}</h2>
            <p className="text-white/80">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                Schüler
              </span>
              {user.email_verified && (
                <span className="px-3 py-1 bg-green-500/30 rounded-full text-sm font-medium flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Verifiziert
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Statistiken */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <StatBadge icon={BookOpen} label="Aktive Kurse" value="3" />
          <StatBadge icon={Award} label="Zertifikate" value="1" />
          <StatBadge icon={Calendar} label="Mitglied seit" value={new Date(user.created_at).toLocaleDateString('de-DE', { month: 'short', year: 'numeric' })} />
        </div>
      </div>

      {/* Persönliche Daten */}
      <ProfileCard title="Persönliche Daten" icon={User}>
        <div className="grid sm:grid-cols-2 gap-4">
          <FormInput
            label="Vorname"
            value={profile.first_name}
            onChange={(v) => updateField('first_name', v)}
            icon={User}
          />
          <FormInput
            label="Nachname"
            value={profile.last_name}
            onChange={(v) => updateField('last_name', v)}
            icon={User}
          />
          <FormInput
            label="E-Mail"
            type="email"
            value={profile.email}
            onChange={() => {}}
            disabled
            icon={Mail}
          />
          <FormInput
            label="Telefon"
            type="tel"
            value={profile.phone}
            onChange={(v) => updateField('phone', v)}
            placeholder="+49 151 12345678"
            icon={Phone}
          />
          <div className="sm:col-span-2">
            <FormInput
              label="Geburtsdatum"
              type="date"
              value={profile.date_of_birth}
              onChange={(v) => updateField('date_of_birth', v)}
              icon={Calendar}
            />
          </div>
        </div>
      </ProfileCard>

      {/* Adresse */}
      <ProfileCard title="Adresse" icon={MapPin}>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <FormInput
              label="Straße & Hausnummer"
              value={profile.address_street}
              onChange={(v) => updateField('address_street', v)}
              placeholder="Musterstraße 123"
            />
          </div>
          <FormInput
            label="PLZ"
            value={profile.address_zip}
            onChange={(v) => updateField('address_zip', v)}
            placeholder="12345"
          />
          <FormInput
            label="Stadt"
            value={profile.address_city}
            onChange={(v) => updateField('address_city', v)}
            placeholder="Berlin"
          />
          <div className="sm:col-span-2">
            <FormInput
              label="Land"
              value={profile.address_country}
              onChange={(v) => updateField('address_country', v)}
              placeholder="Deutschland"
            />
          </div>
        </div>
      </ProfileCard>

      {/* Benachrichtigungen */}
      <ProfileCard title="Benachrichtigungen" icon={Bell}>
        <div className="space-y-3">
          <Toggle
            label="Newsletter erhalten"
            description="Tipps, neue Kurse und wichtige Updates per E-Mail."
            checked={profile.newsletter_opt_in}
            onChange={(v) => updateField('newsletter_opt_in', v)}
          />
          <Toggle
            label="WhatsApp Channel beitreten"
            description="Ankündigungen und Erinnerungen im WhatsApp Channel."
            checked={profile.whatsapp_channel_opt_in}
            onChange={(v) => updateField('whatsapp_channel_opt_in', v)}
          />
          <Toggle
            label="WhatsApp Benachrichtigungen"
            description="Direkte Nachrichten zu Kursen und Terminen."
            checked={profile.whatsapp_opt_in}
            onChange={(v) => updateField('whatsapp_opt_in', v)}
          />
        </div>
      </ProfileCard>

      {/* Sicherheit */}
      <ProfileCard title="Sicherheit" icon={Shield}>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <div className="font-medium text-gray-900">Passwort ändern</div>
              <div className="text-sm text-gray-500">Aus Sicherheitsgründen regelmäßig ändern</div>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors">
              Ändern
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <div className="font-medium text-gray-900">E-Mail verifiziert</div>
              <div className="text-sm text-gray-500">{user.email}</div>
            </div>
            {user.email_verified ? (
              <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                Verifiziert
              </span>
            ) : (
              <button className="px-4 py-2 text-sm font-medium text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors">
                Verifizieren
              </button>
            )}
          </div>
        </div>
      </ProfileCard>

      {/* Speichern Button (unten) */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : success ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {saving ? 'Speichern...' : success ? 'Gespeichert!' : 'Änderungen speichern'}
        </button>
      </div>
    </div>
  );
}
