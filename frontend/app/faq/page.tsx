// ===========================================
// WARIZMY EDUCATION - FAQ Seite
// ===========================================
// Häufig gestellte Fragen mit Akkordeon

import Link from 'next/link';
import { BookOpen, HelpCircle, ChevronRight, Mail } from 'lucide-react';

// Client Component für Akkordeon
import FAQAccordion from './FAQAccordion';
import Navbar from '@/components/Navbar';

// ===========================================
// TYPEN (neue flache Struktur von FastAPI)
// ===========================================

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
  order: number;
}

// ===========================================
// DATEN LADEN
// ===========================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

async function getFAQs(): Promise<FAQ[]> {
  try {
    const res = await fetch(
      `${API_URL}/content/faqs`,
      { next: { revalidate: 300 } }
    );
    
    if (!res.ok) return [];
    
    const data = await res.json();
    return data || [];
  } catch (error) {
    console.error('Failed to fetch FAQs:', error);
    return [];
  }
}

// Gruppiere FAQs nach Kategorie
function groupByCategory(faqs: FAQ[]): Map<string, FAQ[]> {
  const grouped = new Map<string, FAQ[]>();
  
  faqs.forEach(faq => {
    const category = faq.category || 'Allgemein';
    if (!grouped.has(category)) {
      grouped.set(category, []);
    }
    grouped.get(category)!.push(faq);
  });
  
  return grouped;
}

// ===========================================
// METADATA
// ===========================================

export const metadata = {
  title: 'FAQ - Häufig gestellte Fragen | WARIZMY Education',
  description: 'Finden Sie Antworten auf häufig gestellte Fragen zu unseren Kursen, Anmeldung, Zahlungen und mehr.',
};

// ===========================================
// HEADER
// ===========================================

// ===========================================
// STANDARD FAQs (Fallback)
// ===========================================

const defaultFAQs: FAQ[] = [
  {
    id: '1',
    question: 'Wie kann ich mich für einen Kurs anmelden?',
    answer: 'Die Anmeldung ist ganz einfach: Wählen Sie Ihren gewünschten Kurs aus, klicken Sie auf "Jetzt einschreiben" und folgen Sie den Anweisungen zur Registrierung und Zahlung.',
    category: 'Anmeldung',
    order: 1
  },
  {
    id: '2',
    question: 'Welche Zahlungsmethoden werden akzeptiert?',
    answer: 'Wir akzeptieren PayPal, Kreditkarte (via Stripe) und Banküberweisung. Die Zahlung ist sicher und verschlüsselt.',
    category: 'Zahlung',
    order: 2
  },
  {
    id: '3',
    question: 'Kann ich eine Probestunde nehmen?',
    answer: 'Ja! Viele unserer Kurse bieten kostenlose Vorschau-Lektionen an. Außerdem können Sie uns jederzeit kontaktieren, um eine Probestunde zu vereinbaren.',
    category: 'Kurse',
    order: 3
  },
  {
    id: '4',
    question: 'Sind die Kurse für Anfänger geeignet?',
    answer: 'Absolut! Wir bieten Kurse für alle Niveaus an – vom absoluten Anfänger bis zum Fortgeschrittenen. Jeder Kurs ist klar mit dem entsprechenden Niveau gekennzeichnet.',
    category: 'Kurse',
    order: 4
  },
  {
    id: '5',
    question: 'Wie lange habe ich Zugriff auf die Kursinhalte?',
    answer: 'Nach dem Kauf haben Sie lebenslangen Zugriff auf alle Kursinhalte, einschließlich aller zukünftigen Updates.',
    category: 'Kurse',
    order: 5
  },
  {
    id: '6',
    question: 'Gibt es ein Zertifikat nach Abschluss?',
    answer: 'Ja, nach erfolgreichem Abschluss eines Kurses erhalten Sie ein offizielles Zertifikat von WARIZMY Education, das Ihre Teilnahme und Ihren Fortschritt bestätigt.',
    category: 'Zertifikate',
    order: 6
  },
  {
    id: '7',
    question: 'Kann ich den Kurs stornieren und mein Geld zurückbekommen?',
    answer: 'Ja, wir bieten eine 14-tägige Geld-zurück-Garantie. Wenn Sie nicht zufrieden sind, erstatten wir Ihnen den vollen Betrag – keine Fragen gestellt.',
    category: 'Zahlung',
    order: 7
  },
  {
    id: '8',
    question: 'Wie kann ich den Lehrer kontaktieren?',
    answer: 'Sie können Fragen direkt im Kursbereich stellen oder uns per E-Mail kontaktieren. Unser Team und die Lehrer antworten in der Regel innerhalb von 24 Stunden.',
    category: 'Support',
    order: 8
  }
];

// ===========================================
// HAUPTSEITE
// ===========================================

export default async function FAQPage() {
  let faqs = await getFAQs();
  
  // Fallback auf Standard-FAQs wenn keine in DB
  if (faqs.length === 0) {
    faqs = defaultFAQs;
  }
  
  const groupedFAQs = groupByCategory(faqs);
  
  return (
    <>
      <Navbar />
      
      <main className="pt-16 min-h-screen bg-gray-50">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-500 text-white py-20">
          <div className="container-custom">
            <div className="max-w-3xl mx-auto text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-6">
                <HelpCircle className="w-8 h-8" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Häufig gestellte Fragen
              </h1>
              <p className="text-xl text-white/90">
                Finden Sie schnell Antworten auf Ihre Fragen zu unseren Kursen, 
                Anmeldung und mehr.
              </p>
            </div>
          </div>
        </section>
        
        {/* FAQ Content */}
        <section className="py-16">
          <div className="container-custom max-w-4xl">
            {Array.from(groupedFAQs.entries()).map(([category, categoryFaqs]) => (
              <div key={category} className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <span className="w-2 h-8 bg-primary-500 rounded-full" />
                  {category}
                </h2>
                <FAQAccordion faqs={categoryFaqs} />
              </div>
            ))}
          </div>
        </section>
        
        {/* Noch Fragen? */}
        <section className="py-16 bg-white">
          <div className="container-custom text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Noch Fragen?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-8">
              Haben Sie eine Frage, die hier nicht beantwortet wurde? 
              Kontaktieren Sie uns – wir helfen Ihnen gerne weiter!
            </p>
            <Link 
              href="/kontakt" 
              className="btn-primary inline-flex items-center gap-2"
            >
              <Mail className="w-5 h-5" />
              Kontakt aufnehmen
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
