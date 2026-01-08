// ===========================================
// WARIZMY EDUCATION - Kontakt Seite
// ===========================================
// Kontaktformular und Kontaktinformationen

import Link from 'next/link';
import { 
  BookOpen, 
  Mail, 
  Phone, 
  MapPin, 
  Clock,
  Send,
  MessageSquare
} from 'lucide-react';

// Client Component für Formular
import ContactForm from './ContactForm';
import Navbar from '@/components/Navbar';

// ===========================================
// METADATA
// ===========================================

export const metadata = {
  title: 'Kontakt | WARIZMY Education',
  description: 'Kontaktieren Sie uns – wir beantworten gerne Ihre Fragen zu unseren Kursen und Angeboten.',
};

// ===========================================
// HEADER
// ===========================================

// ===========================================
// KONTAKTINFO KARTE
// ===========================================

function ContactInfoCard({ 
  icon: Icon, 
  title, 
  children 
}: { 
  icon: React.ElementType; 
  title: string; 
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
        <Icon className="w-6 h-6 text-primary-600" />
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <div className="text-gray-600">{children}</div>
      </div>
    </div>
  );
}

// ===========================================
// HAUPTSEITE
// ===========================================

export default function KontaktPage() {
  return (
    <>
      <Navbar />
      
      <main className="pt-16 min-h-screen bg-gray-50">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-500 text-white py-20">
          <div className="container-custom">
            <div className="max-w-3xl mx-auto text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Kontaktieren Sie uns
              </h1>
              <p className="text-xl text-white/90">
                Haben Sie Fragen zu unseren Kursen oder benötigen Sie Beratung? 
                Wir sind für Sie da!
              </p>
            </div>
          </div>
        </section>
        
        {/* Kontakt Content */}
        <section className="py-16">
          <div className="container-custom">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Linke Spalte - Kontaktinfo */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  So erreichen Sie uns
                </h2>
                
                <div className="space-y-6 mb-10">
                  <ContactInfoCard icon={Mail} title="E-Mail">
                    <a 
                      href="mailto:info@warizmy.com" 
                      className="text-primary-600 hover:text-primary-700"
                    >
                      info@warizmy.com
                    </a>
                  </ContactInfoCard>
                  
                  <ContactInfoCard icon={Phone} title="Telefon">
                    <a 
                      href="tel:+4915168472469" 
                      className="text-primary-600 hover:text-primary-700"
                    >
                      +49 151 68472469
                    </a>
                  </ContactInfoCard>
                  
                  <ContactInfoCard icon={MapPin} title="Adresse">
                    <p>Warizmy Education</p>
                    <p>Röckstraße 10</p>
                    <p>45894 Gelsenkirchen</p>
                  </ContactInfoCard>
                  
                  <ContactInfoCard icon={Clock} title="Erreichbarkeit">
                    <p>Montag – Freitag: 9:00 – 18:00 Uhr</p>
                    <p>Samstag: 10:00 – 14:00 Uhr</p>
                  </ContactInfoCard>
                </div>
                
                {/* Social Media oder zusätzliche Info */}
                <div className="p-6 bg-primary-50 rounded-xl border border-primary-100">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Schnelle Antworten
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    Für häufige Fragen schauen Sie in unsere FAQ – dort finden 
                    Sie vielleicht schon die Antwort.
                  </p>
                  <Link 
                    href="/faq"
                    className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                  >
                    Zu den FAQ →
                  </Link>
                </div>
              </div>
              
              {/* Rechte Spalte - Formular */}
              <div>
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Schreiben Sie uns
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Füllen Sie das Formular aus und wir melden uns schnellstmöglich bei Ihnen.
                  </p>
                  
                  <ContactForm />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

