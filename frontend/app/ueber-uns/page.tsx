// ===========================================
// WARIZMY EDUCATION - Über uns
// ===========================================

import Link from 'next/link';
import { ArrowLeft, BookOpen, Users, Target, Lightbulb, GraduationCap } from 'lucide-react';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'Über uns | WARIZMY Education',
  description: 'Erfahren Sie mehr über WARIZMY Education und unsere Mission, Arabisch und islamische Bildung zu vermitteln.',
};

export default function UeberUnsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-500 text-white overflow-hidden">
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="container-custom py-20 relative z-10">
          <Link 
            href="/" 
            className="inline-flex items-center text-white/80 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zur Startseite
          </Link>
          
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Über WARIZMY Education
            </h1>
            <p className="text-xl text-white/90 leading-relaxed">
              Ihre Brücke zu Arabisch und islamischer Bildung – 
              inspiriert vom Erbe großer Gelehrter.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container-custom py-16">
        
        {/* Über uns Section */}
        <section className="mb-20">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 md:p-12 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-primary-600" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Unsere Akademie
                </h2>
              </div>
              
              <p className="text-lg text-gray-700 leading-relaxed">
                Die <strong>Warizmy Education Academy</strong> bietet Kurse in arabischer Sprache 
                und islamischer Bildung an, die darauf abzielen, ein tiefes Verständnis der Sprache 
                und der kulturellen sowie religiösen Traditionen zu vermitteln. Diese 
                Unterrichtseinheiten sind speziell darauf ausgelegt, Schülern sowohl sprachliche 
                Fähigkeiten als auch Wissen über den Islam zu vermitteln.
              </p>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="mb-20">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-7 h-7 text-primary-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Arabisch lernen</h3>
              <p className="text-gray-600 text-sm">
                Strukturierte Kurse für alle Niveaus – vom Anfänger bis zum Fortgeschrittenen.
              </p>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-secondary-100 flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="w-7 h-7 text-secondary-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Islamische Bildung</h3>
              <p className="text-gray-600 text-sm">
                Tiefes Verständnis der religiösen und kulturellen Traditionen.
              </p>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Erfahrene Lehrer</h3>
              <p className="text-gray-600 text-sm">
                Qualifizierte Dozenten mit jahrelanger Erfahrung im Unterricht.
              </p>
            </div>
          </div>
        </section>

        {/* Unser Name Section */}
        <section className="mb-20">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl p-8 md:p-12 border border-primary-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Unser Name
                </h2>
              </div>
              
              <p className="text-lg text-gray-700 leading-relaxed">
                Unsere Institution betrachtet mit Stolz das Erbe von <strong>Al-Chwarizmy</strong> als 
                Inspiration. Sein Vermächtnis illustriert auf eindrucksvolle Weise, wie 
                Naturwissenschaften, Sprachen und weitere Disziplinen harmonisch mit den traditionellen 
                islamischen Wissenschaften verschmelzen können.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mt-4">
                Durch die Studie von Al-Chwarizmys Werk möchten wir diese Symbiose verdeutlichen und 
                betonen, wie die Kombination verschiedener Wissensbereiche eine umfassendere und tiefere 
                Verständnisweise ermöglicht. Diese Überzeugung treibt uns an, <strong>Brücken zwischen 
                den verschiedenen Wissensformen</strong> zu bauen und eine integrative Bildung zu fördern, 
                die das Beste aus beiden Welten vereint.
              </p>
            </div>
          </div>
        </section>

        {/* Al-Chwarizmy Section */}
        <section className="mb-16">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="grid md:grid-cols-2 gap-0">
                {/* Bild */}
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-8 flex items-center justify-center">
                  <div className="relative">
                    <img 
                      src="/images/al-chwarizmy.png" 
                      alt="Al-Chwarizmy - Illustration"
                      className="max-w-full h-auto max-h-[400px] object-contain drop-shadow-lg"
                    />
                  </div>
                </div>
                
                {/* Text */}
                <div className="p-8 md:p-10 flex flex-col justify-center">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                    Wer ist Al-Chwarizmy?
                  </h2>
                  
                  <div className="space-y-4 text-gray-700 leading-relaxed">
                    <p>
                      <strong>Al-Chwarizmy</strong>, ein herausragender Gelehrter des 9. Jahrhunderts, 
                      zeigte eine bemerkenswerte Vielseitigkeit in seinem intellektuellen Streben.
                    </p>
                    <p>
                      Ursprünglich in traditionellen Wissenschaften wie <strong>Hadith</strong> und 
                      <strong> Fiqh</strong> geschult, erkannte er jedoch bald die transformative 
                      Kraft der Mathematik.
                    </p>
                    <p>
                      Mit seiner Hingabe und seinem scharfen Verstand widmete er sich der Mathematik 
                      und schuf wegweisende Werke, die das Fundament für die Entwicklung von 
                      <strong> Algebra</strong> und <strong>Algorithmus</strong> legten.
                    </p>
                    <p>
                      Al-Chwarizmys multidisziplinärer Ansatz spiegelt sich in seiner unvergleichlichen 
                      Bedeutung als Pionier sowohl in religiösen als auch in wissenschaftlichen 
                      Studien wider.
                    </p>
                  </div>
                  
                  {/* Fun Fact */}
                  <div className="mt-6 p-4 bg-primary-50 rounded-lg border border-primary-100">
                    <p className="text-sm text-primary-800">
                      <strong>Wussten Sie?</strong> Das Wort "Algorithmus" leitet sich von 
                      seinem Namen ab – ein Zeugnis seines bleibenden Einflusses auf die 
                      moderne Wissenschaft.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Beginnen Sie Ihre Lernreise
            </h2>
            <p className="text-gray-600 mb-8">
              Entdecken Sie unsere Kurse und werden Sie Teil unserer Bildungsgemeinschaft.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/kurse" 
                className="btn-primary px-8 py-3"
              >
                Kurse entdecken
              </Link>
              <Link 
                href="/kontakt" 
                className="px-8 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Kontakt aufnehmen
              </Link>
            </div>
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 mt-16">
        <div className="container-custom text-center">
          <p className="text-sm">
            © {new Date().getFullYear()} WARIZMY Education. Alle Rechte vorbehalten.
          </p>
          <div className="flex justify-center gap-6 mt-4 text-sm">
            <Link href="/impressum" className="hover:text-white">Impressum</Link>
            <Link href="/datenschutz" className="hover:text-white">Datenschutz</Link>
            <Link href="/agb" className="hover:text-white">AGB</Link>
          </div>
        </div>
      </footer>
    </main>
    </>
  );
}

