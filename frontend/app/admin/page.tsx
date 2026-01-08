// ===========================================
// WARIZMY EDUCATION - Admin Dashboard
// ===========================================
// Übersicht mit Statistiken und wichtigen Aktionen

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  GraduationCap, 
  Users, 
  BookOpen,
  TrendingUp,
  Plus,
  CreditCard,
  Calendar,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Euro,
  Bell,
  Loader2
} from 'lucide-react';
import { dashboardApi } from '@/lib/api';

// =========================================
// Typen
// =========================================
interface AdminStats {
  students: number;
  courses: number;
  lessons: number;
  revenue: number;
  revenue_change: string;
  new_students_change: string;
}

interface Registration {
  id: string;
  name: string;
  email: string;
  date: string;
  status: string;
}

interface Payment {
  id: string;
  user: string;
  amount: number;
  course: string;
  status: string;
  date: string;
}

interface TodaySession {
  id: string;
  title: string;
  time: string;
  teacher: string;
  students: number;
}

interface PendingActions {
  verifications: number;
  payments: number;
}

interface AdminDashboardData {
  stats: AdminStats;
  registrations: Registration[];
  payments: Payment[];
  sessions: TodaySession[];
  pending_actions: PendingActions;
}

// =========================================
// Statistik-Karte
// =========================================
function StatCard({ 
  title, 
  value, 
  change,
  changeType = 'positive',
  icon: Icon,
  href,
  color = 'primary',
}: { 
  title: string; 
  value: string | number; 
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: any;
  href?: string;
  color?: 'primary' | 'green' | 'orange' | 'purple';
}) {
  const colorClasses = {
    primary: 'bg-primary-100 text-primary-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  const changeColors = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-500',
  };

  const ChangeIcon = changeType === 'positive' ? ArrowUpRight : changeType === 'negative' ? ArrowDownRight : null;

  const content = (
    <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm mt-2 flex items-center gap-1 ${changeColors[changeType]}`}>
              {ChangeIcon && <ChangeIcon className="w-4 h-4" />}
              {change}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

// =========================================
// Schnellaktionen
// =========================================
function QuickActions() {
  const actions = [
    { href: '/admin/kurse/neu', label: 'Neuer Kurs', icon: Plus, color: 'bg-primary-50 text-primary-700 hover:bg-primary-100' },
    { href: '/admin/benutzer/neu', label: 'Neuer Benutzer', icon: UserPlus, color: 'bg-green-50 text-green-700 hover:bg-green-100' },
    { href: '/admin/klassen/neu', label: 'Neue Klasse', icon: Users, color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
    { href: '/admin/ankuendigungen', label: 'Ankündigungen', icon: Bell, color: 'bg-orange-50 text-orange-700 hover:bg-orange-100' },
  ];

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Schnellaktionen</h2>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`flex items-center gap-2 p-3 rounded-lg transition-colors ${action.color}`}
          >
            <action.icon className="w-5 h-5" />
            <span className="font-medium text-sm">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// =========================================
// Neue Registrierungen
// =========================================
function RecentRegistrations({ registrations }: { registrations: Registration[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Neue Registrierungen</h2>
        <Link href="/admin/benutzer" className="text-sm text-primary-600 hover:text-primary-700">
          Alle →
        </Link>
      </div>
      <div className="divide-y divide-gray-100">
        {registrations.length > 0 ? (
          registrations.map((user) => (
            <div key={user.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {user.status === 'verified' ? (
                  <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    Verifiziert
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                    <Clock className="w-3 h-3" />
                    Ausstehend
                  </span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-gray-500">
            Keine neuen Registrierungen
          </div>
        )}
      </div>
    </div>
  );
}

// =========================================
// Letzte Zahlungen
// =========================================
function RecentPayments({ payments }: { payments: Payment[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Letzte Zahlungen</h2>
        <Link href="/admin/zahlungen" className="text-sm text-primary-600 hover:text-primary-700">
          Alle →
        </Link>
      </div>
      <div className="divide-y divide-gray-100">
        {payments.length > 0 ? (
          payments.map((payment) => (
            <div key={payment.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{payment.user}</p>
                <p className="text-sm text-gray-500">{payment.course}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">€{payment.amount}</p>
                {payment.status === 'completed' ? (
                  <span className="text-xs text-green-600">Bezahlt</span>
                ) : (
                  <span className="text-xs text-orange-600">Ausstehend</span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-gray-500">
            Keine Zahlungen
          </div>
        )}
      </div>
    </div>
  );
}

// =========================================
// Heutige Sessions
// =========================================
function TodaysSessions({ sessions }: { sessions: TodaySession[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Heute</h2>
        <Link href="/admin/kalender" className="text-sm text-primary-600 hover:text-primary-700">
          Kalender →
        </Link>
      </div>
      {sessions.length > 0 ? (
        <div className="divide-y divide-gray-100">
          {sessions.map((session) => (
            <div key={session.id} className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-900">{session.title}</span>
                <span className="text-sm font-medium text-primary-600">{session.time}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{session.teacher}</span>
                <span>{session.students} Studenten</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 text-center text-gray-500">
          Keine Sessions heute
        </div>
      )}
    </div>
  );
}

// =========================================
// Hauptseite
// =========================================
export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardApi.getAdminDashboard();
      setDashboardData(data);
    } catch (err: any) {
      console.error('Dashboard laden fehlgeschlagen:', err);
      setError('Dashboard konnte nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={loadDashboard}
          className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        >
          Erneut versuchen
        </button>
      </div>
    );
  }

  const stats = dashboardData?.stats || { students: 0, courses: 0, lessons: 0, revenue: 0, revenue_change: '0%', new_students_change: '+0' };
  const registrations = dashboardData?.registrations || [];
  const payments = dashboardData?.payments || [];
  const sessions = dashboardData?.sessions || [];
  const pendingActions = dashboardData?.pending_actions || { verifications: 0, payments: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Übersicht über Ihre Lernplattform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Studenten"
          value={stats.students}
          change={`${stats.new_students_change} diese Woche`}
          changeType="positive"
          icon={Users}
          href="/admin/benutzer"
          color="primary"
        />
        <StatCard
          title="Kurse"
          value={stats.courses}
          icon={GraduationCap}
          href="/admin/kurse"
          color="purple"
        />
        <StatCard
          title="Lektionen"
          value={stats.lessons}
          icon={BookOpen}
          href="/admin/content"
          color="orange"
        />
        <StatCard
          title="Einnahmen (Monat)"
          value={`€${stats.revenue.toLocaleString('de-DE')}`}
          change={stats.revenue_change}
          changeType="positive"
          icon={Euro}
          href="/admin/zahlungen"
          color="green"
        />
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Linke Spalte */}
        <div className="lg:col-span-2 space-y-6">
          {/* Alerts */}
          {(pendingActions.verifications > 0 || pendingActions.payments > 0) && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-orange-800">{pendingActions.verifications + pendingActions.payments} ausstehende Aktionen</h4>
                  <ul className="text-sm text-orange-700 mt-1 space-y-1">
                    {pendingActions.verifications > 0 && (
                      <li>• {pendingActions.verifications} Registrierungen müssen verifiziert werden</li>
                    )}
                    {pendingActions.payments > 0 && (
                      <li>• {pendingActions.payments} Zahlungen müssen bestätigt werden</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Registrierungen & Zahlungen */}
          <div className="grid md:grid-cols-2 gap-6">
            <RecentRegistrations registrations={registrations} />
            <RecentPayments payments={payments} />
          </div>
        </div>

        {/* Rechte Spalte */}
        <div className="space-y-6">
          <QuickActions />
          <TodaysSessions sessions={sessions} />
        </div>
      </div>
    </div>
  );
}
