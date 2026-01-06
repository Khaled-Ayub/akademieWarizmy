// ===========================================
// WARIZMY EDUCATION - Admin Zahlungsübersicht
// ===========================================

'use client';

import { useState } from 'react';
import { 
  Search, 
  Filter,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Eye,
  Euro,
  TrendingUp,
  CreditCard,
  Building
} from 'lucide-react';

// =========================================
// Mock Data
// =========================================
const payments = [
  { 
    id: '1', 
    user: 'Ahmad Hassan', 
    email: 'ahmad@example.com',
    amount: 199, 
    course: 'Arabisch für Anfänger', 
    method: 'stripe',
    status: 'completed', 
    date: '2026-01-05T14:30:00',
    invoiceNumber: 'INV-2026-0001'
  },
  { 
    id: '2', 
    user: 'Fatima Ali', 
    email: 'fatima@example.com',
    amount: 299, 
    course: 'Quran Rezitation', 
    method: 'paypal',
    status: 'completed', 
    date: '2026-01-04T10:15:00',
    invoiceNumber: 'INV-2026-0002'
  },
  { 
    id: '3', 
    user: 'Omar Khan', 
    email: 'omar@example.com',
    amount: 149, 
    course: 'Sira Kompakt', 
    method: 'bank_transfer',
    status: 'pending', 
    date: '2026-01-04T09:00:00',
    invoiceNumber: 'INV-2026-0003'
  },
  { 
    id: '4', 
    user: 'Sara Ahmed', 
    email: 'sara@example.com',
    amount: 199, 
    course: 'Arabisch für Anfänger', 
    method: 'stripe',
    status: 'failed', 
    date: '2026-01-03T16:45:00',
    invoiceNumber: null
  },
  { 
    id: '5', 
    user: 'Yusuf Ibrahim', 
    email: 'yusuf@example.com',
    amount: 99, 
    course: 'Tajweed Basics', 
    method: 'stripe',
    status: 'refunded', 
    date: '2026-01-02T11:20:00',
    invoiceNumber: 'INV-2026-0004'
  },
];

const stats = {
  totalRevenue: 15420,
  thisMonth: 2845,
  pending: 149,
  refunded: 99,
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  completed: { label: 'Bezahlt', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  pending: { label: 'Ausstehend', color: 'bg-orange-100 text-orange-700', icon: Clock },
  failed: { label: 'Fehlgeschlagen', color: 'bg-red-100 text-red-700', icon: XCircle },
  refunded: { label: 'Erstattet', color: 'bg-gray-100 text-gray-700', icon: RefreshCw },
};

const methodConfig: Record<string, { label: string; icon: any }> = {
  stripe: { label: 'Kreditkarte', icon: CreditCard },
  paypal: { label: 'PayPal', icon: CreditCard },
  bank_transfer: { label: 'Überweisung', icon: Building },
};

// =========================================
// Statistik-Karte
// =========================================
function StatCard({ 
  title, 
  value, 
  icon: Icon,
  color,
}: { 
  title: string; 
  value: string; 
  icon: any;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

// =========================================
// Zahlungs-Zeile
// =========================================
function PaymentRow({ payment, onAction }: { payment: typeof payments[0]; onAction: (action: string, id: string) => void }) {
  const status = statusConfig[payment.status];
  const method = methodConfig[payment.method];
  const StatusIcon = status.icon;

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="py-4 px-4">
        <div>
          <p className="font-medium text-gray-900">{payment.user}</p>
          <p className="text-sm text-gray-500">{payment.email}</p>
        </div>
      </td>
      <td className="py-4 px-4">
        <p className="text-gray-900">{payment.course}</p>
      </td>
      <td className="py-4 px-4">
        <p className="font-semibold text-gray-900">€{payment.amount}</p>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <method.icon className="w-4 h-4" />
          {method.label}
        </div>
      </td>
      <td className="py-4 px-4">
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${status.color}`}>
          <StatusIcon className="w-3 h-3" />
          {status.label}
        </span>
      </td>
      <td className="py-4 px-4 text-sm text-gray-500">
        {new Date(payment.date).toLocaleDateString('de-DE', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          {payment.status === 'pending' && payment.method === 'bank_transfer' && (
            <button 
              onClick={() => onAction('confirm', payment.id)}
              className="px-3 py-1.5 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600"
            >
              Bestätigen
            </button>
          )}
          {payment.invoiceNumber && (
            <button 
              onClick={() => onAction('invoice', payment.id)}
              className="p-1.5 hover:bg-gray-100 rounded-lg"
              title="Rechnung anzeigen"
            >
              <Eye className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// =========================================
// Hauptseite
// =========================================
export default function AdminPaymentsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.user.toLowerCase().includes(search.toLowerCase()) ||
      payment.course.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAction = (action: string, id: string) => {
    console.log(`Action: ${action}, Payment: ${id}`);
    // TODO: Implement actions
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Zahlungen</h1>
        <p className="text-gray-500 mt-1">Übersicht aller Zahlungen und Rechnungen</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Gesamteinnahmen"
          value={`€${stats.totalRevenue.toLocaleString('de-DE')}`}
          icon={Euro}
          color="bg-green-100 text-green-600"
        />
        <StatCard
          title="Dieser Monat"
          value={`€${stats.thisMonth.toLocaleString('de-DE')}`}
          icon={TrendingUp}
          color="bg-primary-100 text-primary-600"
        />
        <StatCard
          title="Ausstehend"
          value={`€${stats.pending}`}
          icon={Clock}
          color="bg-orange-100 text-orange-600"
        />
        <StatCard
          title="Erstattet"
          value={`€${stats.refunded}`}
          icon={RefreshCw}
          color="bg-gray-100 text-gray-600"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Zahlungen suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Alle Status</option>
            <option value="completed">Bezahlt</option>
            <option value="pending">Ausstehend</option>
            <option value="failed">Fehlgeschlagen</option>
            <option value="refunded">Erstattet</option>
          </select>
          
          <button className="px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Kunde</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Kurs</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Betrag</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Methode</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Datum</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm w-24"></th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <PaymentRow key={payment.id} payment={payment} onAction={handleAction} />
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredPayments.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            Keine Zahlungen gefunden
          </div>
        )}
      </div>
    </div>
  );
}

