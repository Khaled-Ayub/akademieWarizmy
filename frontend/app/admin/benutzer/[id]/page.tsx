// ===========================================
// WARIZMY EDUCATION - Admin Benutzer-Details
// ===========================================

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  CheckCircle,
  XCircle,
  Bell,
  MessageSquare,
  Loader2,
  Edit,
  Save,
  X,
  GraduationCap,
  BookOpen,
  TrendingUp,
  Clock,
  CheckSquare,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/components/Toast';

// =========================================
// Types
// =========================================
interface ClassInfo {
  id: string;
  name: string;
  status: string;
  enrollment_type: string;
  started_at: string | null;
}

interface CourseInfo {
  id: string;
  title: string;
  slug: string;
  total_lessons: number;
  completed_lessons: number;
  progress: number;
}

interface AttendanceStats {
  total_sessions: number;
  attended: number;
  excused: number;
  unexcused: number;
  rate: number;
}

interface Stats {
  class_count: number;
  course_count: number;
  total_progress: number;
  attendance: AttendanceStats;
}

interface UserDetail {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  // Adresse
  address_street: string | null;
  address_city: string | null;
  address_zip: string | null;
  address_country: string | null;
  // Onboarding
  date_of_birth: string | null;
  newsletter_opt_in: boolean;
  whatsapp_opt_in: boolean;
  whatsapp_channel_opt_in: boolean;
  onboarding_completed: boolean;
  profile_picture_url: string | null;
  // Rolle & Status
  role: string;
  is_active: boolean;
  email_verified: boolean;
  // Timestamps
  created_at: string | null;
  updated_at: string | null;
  // Lernstatistiken
  classes: ClassInfo[];
  courses: CourseInfo[];
  stats: Stats;
}

const roleLabels: Record<string, string> = {
  student: 'Student',
  teacher: 'Lehrer',
  admin: 'Administrator',
};

const roleColors: Record<string, string> = {
  student: 'bg-blue-100 text-blue-700',
  teacher: 'bg-purple-100 text-purple-700',
  admin: 'bg-red-100 text-red-700',
};

// =========================================
// Info Card Komponente
// =========================================
function InfoCard({ title, children, icon: Icon }: { title: string; children: React.ReactNode; icon: React.ElementType }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary-500" />
        </div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// =========================================
// Info Zeile Komponente
// =========================================
function InfoRow({ label, value, isBoolean }: { label: string; value: string | boolean | null; isBoolean?: boolean }) {
  if (isBoolean) {
    return (
      <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
        <span className="text-gray-500">{label}</span>
        {value ? (
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle className="w-4 h-4" /> Ja
          </span>
        ) : (
          <span className="flex items-center gap-1 text-gray-400">
            <XCircle className="w-4 h-4" /> Nein
          </span>
        )}
      </div>
    );
  }
  
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium">{value || '–'}</span>
    </div>
  );
}

// =========================================
// Hauptseite
// =========================================
export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const userId = params.id as string;
  
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Benutzer laden
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch(`/api/admin/users/${userId}`);
        if (!res.ok) throw new Error('Benutzer nicht gefunden');
        const data = await res.json();
        setUser(data);
      } catch (err) {
        toast.error('Fehler beim Laden des Benutzers');
        router.push('/admin/benutzer');
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) loadUser();
  }, [userId]);

  // Formatierung
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '–';
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '–';
    return new Date(dateStr).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!user) return null;

  // Vollständige Adresse
  const fullAddress = [
    user.address_street,
    [user.address_zip, user.address_city].filter(Boolean).join(' '),
    user.address_country
  ].filter(Boolean).join(', ') || null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/admin/benutzer"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Benutzer-Details</h1>
          <p className="text-gray-500">{user.email}</p>
        </div>
        <Link
          href={`/admin/benutzer/${userId}/bearbeiten`}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <Edit className="w-4 h-4" />
          Bearbeiten
        </Link>
      </div>

      {/* Profil-Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start gap-6">
          {/* Avatar / Profilbild */}
          <div className="flex-shrink-0">
            {user.profile_picture_url ? (
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-100">
                <Image
                  src={user.profile_picture_url}
                  alt={`${user.first_name} ${user.last_name}`}
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center border-4 border-gray-100">
                <span className="text-3xl font-bold text-white">
                  {user.first_name?.[0]?.toUpperCase()}{user.last_name?.[0]?.toUpperCase()}
                </span>
              </div>
            )}
          </div>
          
          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">
                {user.first_name} {user.last_name}
              </h2>
              <span className={`text-xs font-medium px-3 py-1 rounded-full ${roleColors[user.role] || 'bg-gray-100 text-gray-700'}`}>
                {roleLabels[user.role] || user.role}
              </span>
            </div>
            
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                {user.email}
              </span>
              {user.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {user.phone}
                </span>
              )}
            </div>
            
            {/* Status Badges */}
            <div className="flex gap-2 mt-4">
              {user.is_active ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                  <CheckCircle className="w-3 h-3" /> Aktiv
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                  <XCircle className="w-3 h-3" /> Inaktiv
                </span>
              )}
              {user.email_verified ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                  <CheckCircle className="w-3 h-3" /> E-Mail verifiziert
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-medium">
                  <XCircle className="w-3 h-3" /> E-Mail nicht verifiziert
                </span>
              )}
              {user.onboarding_completed ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                  <CheckCircle className="w-3 h-3" /> Onboarding abgeschlossen
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium">
                  <XCircle className="w-3 h-3" /> Onboarding ausstehend
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detail-Karten Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* === LERNSTATISTIKEN === */}
        {user.stats && (
          <>
            {/* Übersicht Stats */}
            <div className="md:col-span-2 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Lernstatistiken
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/10 rounded-lg p-4">
                  <p className="text-white/70 text-sm">Klassen</p>
                  <p className="text-2xl font-bold">{user.stats.class_count}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <p className="text-white/70 text-sm">Kurse</p>
                  <p className="text-2xl font-bold">{user.stats.course_count}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <p className="text-white/70 text-sm">Gesamtfortschritt</p>
                  <p className="text-2xl font-bold">{user.stats.total_progress}%</p>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <p className="text-white/70 text-sm">Anwesenheit</p>
                  <p className="text-2xl font-bold">{user.stats.attendance.rate}%</p>
                </div>
              </div>
            </div>

            {/* Klassen */}
            <InfoCard title="Eingeschriebene Klassen" icon={GraduationCap}>
              {user.classes && user.classes.length > 0 ? (
                <div className="space-y-3">
                  {user.classes.map((cls) => (
                    <div key={cls.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{cls.name}</p>
                        <p className="text-xs text-gray-500">
                          {cls.enrollment_type === 'one_time' ? 'Einmalzahlung' : 'Abo'}
                          {cls.started_at && ` • Seit ${formatDate(cls.started_at)}`}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        cls.status === 'active' ? 'bg-green-100 text-green-700' :
                        cls.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {cls.status === 'active' ? 'Aktiv' : cls.status === 'cancelled' ? 'Storniert' : cls.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Keine Klassen zugewiesen</p>
              )}
            </InfoCard>

            {/* Kurse mit Fortschritt */}
            <InfoCard title="Kurse & Fortschritt" icon={BookOpen}>
              {user.courses && user.courses.length > 0 ? (
                <div className="space-y-3">
                  {user.courses.map((course) => (
                    <div key={course.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-gray-900">{course.title}</p>
                        <span className="text-sm font-medium text-primary-600">{course.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary-500 h-2 rounded-full transition-all"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {course.completed_lessons} von {course.total_lessons} Lektionen abgeschlossen
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Keine Kurse zugewiesen</p>
              )}
            </InfoCard>

            {/* Anwesenheit */}
            <InfoCard title="Anwesenheitsstatistik" icon={Clock}>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-green-600" />
                    <span className="text-gray-700">Anwesend</span>
                  </div>
                  <span className="font-semibold text-green-700">{user.stats.attendance.attended}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <span className="text-gray-700">Entschuldigt</span>
                  </div>
                  <span className="font-semibold text-yellow-700">{user.stats.attendance.excused}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span className="text-gray-700">Unentschuldigt</span>
                  </div>
                  <span className="font-semibold text-red-700">{user.stats.attendance.unexcused}</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Gesamt Sessions</span>
                    <span className="font-medium">{user.stats.attendance.total_sessions}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-500">Anwesenheitsquote</span>
                    <span className={`font-bold ${
                      user.stats.attendance.rate >= 80 ? 'text-green-600' :
                      user.stats.attendance.rate >= 60 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {user.stats.attendance.rate}%
                    </span>
                  </div>
                </div>
              </div>
            </InfoCard>
          </>
        )}

        {/* Persönliche Daten */}
        <InfoCard title="Persönliche Daten" icon={User}>
          <div className="space-y-1">
            <InfoRow label="Vorname" value={user.first_name} />
            <InfoRow label="Nachname" value={user.last_name} />
            <InfoRow label="E-Mail" value={user.email} />
            <InfoRow label="Telefon" value={user.phone} />
            <InfoRow label="Geburtsdatum" value={formatDate(user.date_of_birth)} />
          </div>
        </InfoCard>

        {/* Adresse */}
        <InfoCard title="Adresse" icon={MapPin}>
          <div className="space-y-1">
            <InfoRow label="Straße" value={user.address_street} />
            <InfoRow label="PLZ" value={user.address_zip} />
            <InfoRow label="Stadt" value={user.address_city} />
            <InfoRow label="Land" value={user.address_country} />
          </div>
        </InfoCard>

        {/* Rolle & Berechtigungen */}
        <InfoCard title="Rolle & Berechtigungen" icon={Shield}>
          <div className="space-y-1">
            <InfoRow label="Rolle" value={roleLabels[user.role] || user.role} />
            <InfoRow label="Aktiv" value={user.is_active} isBoolean />
            <InfoRow label="E-Mail verifiziert" value={user.email_verified} isBoolean />
            <InfoRow label="Onboarding abgeschlossen" value={user.onboarding_completed} isBoolean />
          </div>
        </InfoCard>

        {/* Benachrichtigungen */}
        <InfoCard title="Benachrichtigungen" icon={Bell}>
          <div className="space-y-1">
            <InfoRow label="Newsletter" value={user.newsletter_opt_in} isBoolean />
            <InfoRow label="WhatsApp Updates" value={user.whatsapp_opt_in} isBoolean />
            <InfoRow label="WhatsApp Channel" value={user.whatsapp_channel_opt_in} isBoolean />
          </div>
        </InfoCard>

        {/* Zeitstempel */}
        <InfoCard title="Zeitstempel" icon={Calendar}>
          <div className="space-y-1">
            <InfoRow label="Registriert am" value={formatDateTime(user.created_at)} />
            <InfoRow label="Zuletzt aktualisiert" value={formatDateTime(user.updated_at)} />
          </div>
        </InfoCard>
      </div>
    </div>
  );
}
