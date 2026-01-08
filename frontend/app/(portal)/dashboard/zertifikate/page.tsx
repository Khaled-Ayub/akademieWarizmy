// ===========================================
// WARIZMY EDUCATION - Zertifikate
// ===========================================
// Übersicht über erhaltene Zertifikate

'use client';

import { useState, useEffect } from 'react';
import { 
  Award,
  Download,
  Eye,
  Calendar,
  BookOpen,
  Share2,
  Loader2,
  CheckCircle
} from 'lucide-react';

// =========================================
// Typen
// =========================================
interface Certificate {
  id: string;
  course_name: string;
  course_slug: string;
  issued_date: string;
  expiry_date?: string;
  certificate_number: string;
  download_url: string;
  score?: number;
  grade?: string;
}

// =========================================
// Zertifikat-Karte
// =========================================
function CertificateCard({ certificate }: { certificate: Certificate }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header mit Gradient */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
            <Award className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold mb-1">{certificate.course_name}</h3>
          <p className="text-white/80 text-sm">Abschlusszertifikat</p>
        </div>
      </div>
      
      {/* Details */}
      <div className="p-6">
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Zertifikat-Nr.</span>
            <span className="font-mono text-gray-900">{certificate.certificate_number}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Ausgestellt am</span>
            <span className="text-gray-900">
              {new Date(certificate.issued_date).toLocaleDateString('de-DE', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}
            </span>
          </div>
          {certificate.score && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Ergebnis</span>
              <span className="text-green-600 font-medium">{certificate.score}%</span>
            </div>
          )}
          {certificate.grade && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Note</span>
              <span className="text-gray-900 font-medium">{certificate.grade}</span>
            </div>
          )}
          {certificate.expiry_date && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Gültig bis</span>
              <span className="text-gray-900">
                {new Date(certificate.expiry_date).toLocaleDateString('de-DE')}
              </span>
            </div>
          )}
        </div>
        
        {/* Validierungs-Badge */}
        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg mb-6">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-sm text-green-700 font-medium">Verifiziert und gültig</span>
        </div>
        
        {/* Aktionen */}
        <div className="flex gap-2">
          <a 
            href={certificate.download_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Herunterladen
          </a>
          <button className="px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Eye className="w-4 h-4 text-gray-600" />
          </button>
          <button className="px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Share2 className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
}

// =========================================
// Leerer Zustand
// =========================================
function EmptyState() {
  return (
    <div className="text-center py-16 bg-gray-50 rounded-2xl">
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
        <Award className="w-10 h-10 text-gray-400" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        Noch keine Zertifikate
      </h2>
      <p className="text-gray-500 max-w-md mx-auto mb-6">
        Schließe einen Kurs erfolgreich ab, um dein erstes Zertifikat zu erhalten.
        Zertifikate bestätigen deine Teilnahme und deinen Lernerfolg.
      </p>
      <a href="/kurse" className="btn-primary inline-flex items-center gap-2">
        <BookOpen className="w-5 h-5" />
        Kurse ansehen
      </a>
    </div>
  );
}

// =========================================
// Hauptseite
// =========================================
export default function ZertifikatePage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setCertificates([
        {
          id: '1',
          course_name: 'Arabisch A1 Einführung',
          course_slug: 'arabisch-a1-einfuehrung',
          issued_date: '2025-06-20',
          certificate_number: 'WARZ-2025-00142',
          download_url: '/certificates/WARZ-2025-00142.pdf',
          score: 85,
          grade: 'Gut (2)',
        },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meine Zertifikate</h1>
          <p className="text-gray-500 mt-1">
            {certificates.length} Zertifikat{certificates.length !== 1 ? 'e' : ''} erhalten
          </p>
        </div>
      </div>

      {/* Info-Banner */}
      {certificates.length > 0 && (
        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-4 border border-primary-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
              <Award className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Deine Zertifikate sind verifizierbar</h3>
              <p className="text-sm text-gray-600 mt-1">
                Jedes Zertifikat enthält eine eindeutige Nummer, mit der Arbeitgeber oder Institutionen 
                die Echtheit überprüfen können.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Zertifikate Grid */}
      {certificates.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map(cert => (
            <CertificateCard key={cert.id} certificate={cert} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}

      {/* Nächste Schritte */}
      {certificates.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Weitere Zertifikate erwerben</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Schließe weitere Kurse ab</h3>
                  <p className="text-sm text-gray-500">
                    Jeder abgeschlossene Kurs bringt dir ein neues Zertifikat
                  </p>
                </div>
              </div>
              <a href="/dashboard/meine-kurse" className="btn-outline">
                Meine Kurse
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
