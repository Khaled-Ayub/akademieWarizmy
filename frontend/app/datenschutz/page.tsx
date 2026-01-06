// ===========================================
// WARIZMY EDUCATION - Datenschutzerklärung
// ===========================================

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Datenschutzerklärung | WARIZMY Education',
  description: 'Datenschutzerklärung von WARIZMY Education',
};

export default function DatenschutzPage() {
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
          <h1 className="text-3xl font-bold text-gray-900">Datenschutzerklärung</h1>
        </div>
      </div>

      {/* Content */}
      <div className="container-custom py-12">
        <div className="max-w-3xl bg-white rounded-xl border border-gray-200 p-8 md:p-12 prose prose-gray max-w-none">
          
          {/* 1. Datenschutz auf einen Blick */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">1. Datenschutz auf einen Blick</h2>
            
            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Allgemeine Hinweise</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren 
              personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene 
              Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Datenerfassung auf dieser Website</h3>
            
            <h4 className="font-semibold text-gray-800 mt-4 mb-2">Wer ist verantwortlich für die Datenerfassung auf dieser Website?</h4>
            <p className="text-gray-700 leading-relaxed mb-4">
              Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. 
              Dessen Kontaktdaten können Sie dem Impressum dieser Website entnehmen.
            </p>

            <h4 className="font-semibold text-gray-800 mt-4 mb-2">Wie erfassen wir Ihre Daten?</h4>
            <p className="text-gray-700 leading-relaxed">
              Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei 
              kann es sich z. B. um Daten handeln, die Sie in ein Kontaktformular eingeben, bei 
              der Newsletter-Anmeldung angeben oder bei der Registrierung für ein Benutzerkonto 
              übermitteln. Andere Daten werden automatisch oder nach Ihrer Einwilligung beim 
              Besuch der Website durch unsere IT-Systeme erfasst. Das sind vor allem technische 
              Daten (z. B. Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs).
            </p>
          </section>

          {/* 2. Hosting */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">2. Hosting</h2>
            <p className="text-gray-700 leading-relaxed">
              Wir hosten die Inhalte unserer Website bei einem externen Anbieter. Die 
              personenbezogenen Daten, die auf dieser Website erfasst werden, werden auf den 
              Servern des Hosters gespeichert. Hierbei kann es sich v. a. um IP-Adressen, 
              Kontaktanfragen, Meta- und Kommunikationsdaten, Vertragsdaten, Kontaktdaten, 
              Namen, Websitezugriffe und sonstige Daten, die über eine Website generiert 
              werden, handeln.
            </p>
          </section>

          {/* 3. Allgemeine Hinweise und Pflichtinformationen */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">3. Allgemeine Hinweise und Pflichtinformationen</h2>
            
            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Datenschutz</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. 
              Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend den 
              gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Verantwortliche Stelle</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:
            </p>
            <address className="not-italic text-gray-700 leading-relaxed mb-4 pl-4 border-l-4 border-primary-200">
              Warizmy Education<br />
              Khaled Ayub<br />
              Röckstraße 10<br />
              45894 Gelsenkirchen<br /><br />
              Telefon: +49 151 68472469<br />
              E-Mail: info@warizmy.com
            </address>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Widerruf Ihrer Einwilligung zur Datenverarbeitung</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Viele Datenverarbeitungsvorgänge sind nur mit Ihrer ausdrücklichen Einwilligung 
              möglich. Sie können eine bereits erteilte Einwilligung jederzeit widerrufen. 
              Die Rechtmäßigkeit der bis zum Widerruf erfolgten Datenverarbeitung bleibt vom 
              Widerruf unberührt.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Beschwerderecht bei der zuständigen Aufsichtsbehörde</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Im Falle von Verstößen gegen die DSGVO steht den Betroffenen ein Beschwerderecht 
              bei einer Aufsichtsbehörde zu. Das Beschwerderecht besteht unbeschadet 
              anderweitiger verwaltungsrechtlicher oder gerichtlicher Rechtsbehelfe.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Recht auf Datenübertragbarkeit</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Sie haben das Recht, Daten, die wir auf Grundlage Ihrer Einwilligung oder in 
              Erfüllung eines Vertrags automatisiert verarbeiten, an sich oder an einen 
              Dritten in einem gängigen, maschinenlesbaren Format aushändigen zu lassen.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Auskunft, Löschung und Berichtigung</h3>
            <p className="text-gray-700 leading-relaxed">
              Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das 
              Recht auf unentgeltliche Auskunft über Ihre gespeicherten personenbezogenen 
              Daten, deren Herkunft und Empfänger und den Zweck der Datenverarbeitung und 
              ggf. ein Recht auf Berichtigung oder Löschung dieser Daten.
            </p>
          </section>

          {/* 4. Datenerfassung auf dieser Website */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">4. Datenerfassung auf dieser Website</h2>
            
            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Kontaktformular</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, werden Ihre Angaben 
              aus dem Anfrageformular inklusive der von Ihnen dort angegebenen Kontaktdaten 
              zwecks Bearbeitung der Anfrage und für den Fall von Anschlussfragen bei uns 
              gespeichert. Diese Daten geben wir nicht ohne Ihre Einwilligung weiter. 
              Die Verarbeitung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Newsletter</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Wenn Sie den auf der Website angebotenen Newsletter beziehen möchten, benötigen 
              wir von Ihnen eine E-Mail-Adresse sowie Informationen, welche uns die Überprüfung 
              gestatten, dass Sie der Inhaber der angegebenen E-Mail-Adresse sind und mit dem 
              Empfang des Newsletters einverstanden sind. Die Datenverarbeitung erfolgt auf 
              Grundlage Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO). Die erteilte 
              Einwilligung zur Speicherung der Daten, der E-Mail-Adresse sowie deren Nutzung 
              zum Versand des Newsletters können Sie jederzeit widerrufen.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Registrierung auf dieser Website</h3>
            <p className="text-gray-700 leading-relaxed">
              Sie können sich auf dieser Website registrieren, um zusätzliche Funktionen auf 
              der Seite zu nutzen. Die dazu eingegebenen Daten verwenden wir nur zum Zwecke 
              der Nutzung des jeweiligen Angebotes oder Dienstes, für den Sie sich registriert 
              haben. Die bei der Registrierung abgefragten Pflichtangaben müssen vollständig 
              angegeben werden. Anderenfalls werden wir die Registrierung ablehnen. 
              Die Verarbeitung der bei der Registrierung eingegebenen Daten erfolgt auf 
              Grundlage Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO).
            </p>
          </section>

          {/* 5. Soziale Medien */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">5. Soziale Medien</h2>
            
            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Instagram</h3>
            <p className="text-gray-700 leading-relaxed">
              Auf dieser Website sind Funktionen des Dienstes Instagram eingebunden. Diese 
              Funktionen werden angeboten durch die Meta Platforms Ireland Limited, 4 Grand 
              Canal Square, Grand Canal Harbour, Dublin 2, Irland. Wenn Sie in Ihrem 
              Instagram-Account eingeloggt sind, können Sie durch Anklicken des 
              Instagram-Buttons die Inhalte dieser Website mit Ihrem Instagram-Profil 
              verlinken. Wir weisen darauf hin, dass wir als Anbieter der Seiten keine 
              Kenntnis vom Inhalt der übermittelten Daten sowie deren Nutzung durch 
              Instagram erhalten.
            </p>
          </section>

          {/* 6. Zahlungsanbieter */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">6. Zahlungsanbieter</h2>
            
            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">PayPal</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Auf dieser Website bieten wir u.a. die Bezahlung via PayPal an. Anbieter dieses 
              Zahlungsdienstes ist die PayPal (Europe) S.à.r.l. et Cie, S.C.A., 22-24 Boulevard 
              Royal, L-2449 Luxembourg. Wenn Sie mit PayPal bezahlen, erfolgt eine Übermittlung 
              der von Ihnen eingegebenen Zahlungsdaten an PayPal. Die Übermittlung Ihrer Daten 
              an PayPal erfolgt auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO (Einwilligung) 
              und Art. 6 Abs. 1 lit. b DSGVO (Verarbeitung zur Erfüllung eines Vertrags).
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Stripe</h3>
            <p className="text-gray-700 leading-relaxed">
              Wir nutzen den Zahlungsdienstleister Stripe. Anbieter ist die Stripe Payments 
              Europe, Ltd., 1 Grand Canal Street Lower, Grand Canal Dock, Dublin, Irland. 
              Bei der Zahlung über Stripe werden die von Ihnen eingegebenen Zahlungsdaten 
              an Stripe übermittelt. Die Übermittlung Ihrer Daten an Stripe erfolgt auf 
              Grundlage von Art. 6 Abs. 1 lit. a DSGVO (Einwilligung) und Art. 6 Abs. 1 
              lit. b DSGVO (Verarbeitung zur Erfüllung eines Vertrags).
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}

