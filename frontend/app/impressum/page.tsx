// ===========================================
// WARIZMY EDUCATION - Impressum
// ===========================================

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Impressum | WARIZMY Education',
  description: 'Impressum und rechtliche Angaben von WARIZMY Education',
};

export default function ImpressumPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container-custom py-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zur Startseite
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Impressum</h1>
        </div>
      </div>

      {/* Content */}
      <div className="container-custom py-12">
        <div className="max-w-3xl bg-white rounded-xl border border-gray-200 p-8 md:p-12">
          
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Angaben gemäß § 5 TMG</h2>
            <address className="not-italic text-gray-700 leading-relaxed">
              <strong>Warizmy Education</strong><br />
              Khaled Ayub<br />
              Röckstraße 10<br />
              45894 Gelsenkirchen
            </address>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Kontakt</h2>
            <p className="text-gray-700 leading-relaxed">
              Telefon: <a href="tel:+4915168472469" className="text-primary-600 hover:underline">+49 151 68472469</a><br />
              E-Mail: <a href="mailto:info@warizmy.com" className="text-primary-600 hover:underline">info@warizmy.com</a>
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
            <address className="not-italic text-gray-700 leading-relaxed">
              Khaled Ayub<br />
              Röckstraße 10<br />
              45894 Gelsenkirchen
            </address>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-4">EU-Streitschlichtung</h2>
            <p className="text-gray-700 leading-relaxed">
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
              <a 
                href="https://ec.europa.eu/consumers/odr/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-600 hover:underline"
              >
                https://ec.europa.eu/consumers/odr/
              </a>
              <br />
              Unsere E-Mail-Adresse finden Sie oben im Impressum.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Verbraucherstreitbeilegung/Universalschlichtungsstelle</h2>
            <p className="text-gray-700 leading-relaxed">
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer 
              Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}

