// ===========================================
// WARIZMY EDUCATION - AGB
// ===========================================

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Allgemeine Geschäftsbedingungen | WARIZMY Education',
  description: 'Allgemeine Geschäftsbedingungen (AGB) von WARIZMY Education',
};

export default function AGBPage() {
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
          <h1 className="text-3xl font-bold text-gray-900">Allgemeine Geschäftsbedingungen (AGB)</h1>
        </div>
      </div>

      {/* Content */}
      <div className="container-custom py-12">
        <div className="max-w-3xl bg-white rounded-xl border border-gray-200 p-8 md:p-12">
          
          {/* § 1 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-4">§ 1 Geltungsbereich</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              (1) Diese Allgemeinen Geschäftsbedingungen (nachfolgend "AGB") gelten für alle 
              Verträge über Sprachunterricht und Bildungsdienstleistungen, die zwischen 
              Warizmy Education, Khaled Ayub, Röckstraße 10, 45894 Gelsenkirchen (nachfolgend 
              "Anbieter") und dem Kunden (nachfolgend "Kunde") geschlossen werden.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              (2) Verbraucher im Sinne dieser AGB ist jede natürliche Person, die ein 
              Rechtsgeschäft zu Zwecken abschließt, die überwiegend weder ihrer gewerblichen 
              noch ihrer selbständigen beruflichen Tätigkeit zugerechnet werden können.
            </p>
            <p className="text-gray-700 leading-relaxed">
              (3) Abweichende Bedingungen des Kunden werden nicht anerkannt, es sei denn, 
              der Anbieter stimmt ihrer Geltung ausdrücklich schriftlich zu.
            </p>
          </section>

          {/* § 2 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-4">§ 2 Vertragsgegenstand</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              (1) Der Anbieter bietet Sprachunterricht und Bildungsdienstleistungen an. 
              Der genaue Umfang und Inhalt der Leistungen ergibt sich aus der jeweiligen 
              Leistungsbeschreibung auf der Website des Anbieters sowie aus individuellen 
              Vereinbarungen.
            </p>
            <p className="text-gray-700 leading-relaxed">
              (2) Der Unterricht findet online oder an einem vereinbarten Ort statt. 
              Die genauen Modalitäten werden vor Vertragsschluss festgelegt.
            </p>
          </section>

          {/* § 3 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-4">§ 3 Vertragsschluss</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              (1) Die Darstellung der Dienstleistungen auf der Website stellt kein rechtlich 
              bindendes Angebot, sondern eine Aufforderung zur Abgabe einer Bestellung dar.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              (2) Der Kunde kann sein Angebot über das auf der Website bereitgestellte 
              Buchungsformular oder per E-Mail abgeben. Mit der Buchung gibt der Kunde 
              ein verbindliches Angebot zum Abschluss eines Vertrages ab.
            </p>
            <p className="text-gray-700 leading-relaxed">
              (3) Der Anbieter bestätigt den Eingang der Buchung unverzüglich per E-Mail. 
              Der Vertrag kommt erst zustande, wenn der Anbieter die Buchung durch eine 
              gesonderte Bestätigung annimmt.
            </p>
          </section>

          {/* § 4 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-4">§ 4 Preise und Zahlungsbedingungen</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              (1) Es gelten die zum Zeitpunkt der Buchung auf der Website angegebenen Preise. 
              Alle Preise verstehen sich als Endpreise. Aufgrund der Kleinunternehmerregelung 
              gemäß § 19 UStG wird keine Umsatzsteuer erhoben und ausgewiesen.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              (2) Die Zahlung erfolgt wahlweise per PayPal, Stripe (Kreditkarte) oder Banküberweisung.
            </p>
            <p className="text-gray-700 leading-relaxed">
              (3) Die Zahlung ist im Voraus fällig, sofern nicht anders vereinbart.
            </p>
          </section>

          {/* § 5 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-4">§ 5 Terminvereinbarung und Stornierung</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              (1) Die Unterrichtstermine werden individuell zwischen Anbieter und Kunde vereinbart.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              (2) Die Absage eines Termins durch den Kunden ist bis 24 Stunden vor dem 
              vereinbarten Termin kostenfrei möglich. Bei späterer Absage oder Nichterscheinen 
              wird die volle Unterrichtsgebühr fällig.
            </p>
            <p className="text-gray-700 leading-relaxed">
              (3) Der Anbieter behält sich vor, Termine aus wichtigem Grund (z. B. Krankheit) 
              abzusagen. In diesem Fall wird ein Ersatztermin angeboten oder die bereits 
              gezahlte Gebühr erstattet.
            </p>
          </section>

          {/* § 6 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-4">§ 6 Widerrufsrecht für Verbraucher</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              (1) Verbraucher haben bei Fernabsatzverträgen ein Widerrufsrecht von 14 Tagen 
              ohne Angabe von Gründen.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              (2) Die Widerrufsfrist beträgt 14 Tage ab dem Tag des Vertragsabschlusses. 
              Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (Warizmy Education, Khaled Ayub, 
              Röckstraße 10, 45894 Gelsenkirchen, E-Mail: info@warizmy.com, Telefon: +49 151 68472469) 
              mittels einer eindeutigen Erklärung (z. B. per E-Mail oder Brief) über Ihren 
              Entschluss, diesen Vertrag zu widerrufen, informieren.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              (3) Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über 
              die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              (4) <strong>Folgen des Widerrufs:</strong> Wenn Sie diesen Vertrag widerrufen, 
              haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, unverzüglich 
              und spätestens binnen 14 Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung 
              über Ihren Widerruf bei uns eingegangen ist.
            </p>
            <p className="text-gray-700 leading-relaxed">
              (5) Das Widerrufsrecht erlischt vorzeitig, wenn der Anbieter die Dienstleistung 
              vollständig erbracht hat und mit der Ausführung der Dienstleistung erst begonnen 
              hat, nachdem der Kunde seine ausdrückliche Zustimmung gegeben hat und gleichzeitig 
              seine Kenntnis davon bestätigt hat, dass er sein Widerrufsrecht bei vollständiger 
              Vertragserfüllung verliert.
            </p>
          </section>

          {/* § 7 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-4">§ 7 Haftung</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              (1) Der Anbieter haftet unbeschränkt für Vorsatz und grobe Fahrlässigkeit sowie 
              für Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              (2) Bei leichter Fahrlässigkeit haftet der Anbieter nur bei Verletzung 
              wesentlicher Vertragspflichten und der Höhe nach begrenzt auf den typischerweise 
              vorhersehbaren Schaden.
            </p>
            <p className="text-gray-700 leading-relaxed">
              (3) Eine weitergehende Haftung des Anbieters ist ausgeschlossen.
            </p>
          </section>

          {/* § 8 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-4">§ 8 Urheberrecht</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              (1) Alle im Rahmen des Unterrichts zur Verfügung gestellten Materialien sind 
              urheberrechtlich geschützt. Der Kunde erhält ein einfaches, nicht übertragbares 
              Nutzungsrecht für den persönlichen Gebrauch.
            </p>
            <p className="text-gray-700 leading-relaxed">
              (2) Eine Weitergabe, Vervielfältigung oder Veröffentlichung der Materialien 
              ohne ausdrückliche Zustimmung des Anbieters ist untersagt.
            </p>
          </section>

          {/* § 9 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-4">§ 9 Schlussbestimmungen</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              (1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              (2) Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt 
              die Wirksamkeit der übrigen Bestimmungen unberührt.
            </p>
            <p className="text-gray-700 leading-relaxed">
              (3) Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung 
              (OS) bereit, die Sie unter{' '}
              <a 
                href="https://ec.europa.eu/consumers/odr/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-600 hover:underline"
              >
                https://ec.europa.eu/consumers/odr/
              </a>{' '}
              finden.
            </p>
          </section>

          {/* Stand */}
          <div className="pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Stand: Januar 2026
            </p>
          </div>

        </div>
      </div>
    </main>
  );
}

