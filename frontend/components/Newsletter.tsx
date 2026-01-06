// ===========================================
// WARIZMY EDUCATION - Newsletter Komponente
// ===========================================
// Anmeldung zum Newsletter mit E-Mail-Eingabe

'use client';

import { useState } from 'react';
import { Mail, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

// ===========================================
// TYPEN
// ===========================================

type Status = 'idle' | 'loading' | 'success' | 'error';

interface NewsletterProps {
  variant?: 'default' | 'minimal' | 'footer';
  className?: string;
}

// ===========================================
// HAUPTKOMPONENTE
// ===========================================

export default function Newsletter({ 
  variant = 'default',
  className = '' 
}: NewsletterProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setStatus('error');
      setErrorMessage('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
      return;
    }
    
    setStatus('loading');
    setErrorMessage('');
    
    try {
      // Simuliere API-Aufruf (später mit echtem Backend ersetzen)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Hier würde normalerweise der API-Aufruf kommen:
      // const res = await fetch('/api/newsletter', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email })
      // });
      
      setStatus('success');
      setEmail('');
      
      // Nach 5 Sekunden zurücksetzen
      setTimeout(() => setStatus('idle'), 5000);
      
    } catch (error) {
      setStatus('error');
      setErrorMessage('Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.');
    }
  };
  
  // Erfolgs-Ansicht
  if (status === 'success') {
    return (
      <div className={`flex items-center gap-3 text-green-600 ${className}`}>
        <CheckCircle className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm font-medium">
          Vielen Dank! Sie erhalten in Kürze eine Bestätigungs-E-Mail.
        </span>
      </div>
    );
  }
  
  // Minimal Variante (nur Input + Button)
  if (variant === 'minimal') {
    return (
      <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Ihre E-Mail"
          disabled={status === 'loading'}
          className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="btn-primary px-4 py-2 text-sm"
        >
          {status === 'loading' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    );
  }
  
  // Footer Variante (dunkler Hintergrund)
  if (variant === 'footer') {
    return (
      <div className={className}>
        <h4 className="font-bold text-white mb-3">Newsletter</h4>
        <p className="text-gray-400 text-sm mb-4">
          Erhalten Sie Updates zu neuen Kursen und Angeboten.
        </p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ihre@email.de"
            disabled={status === 'loading'}
            className="flex-1 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-70"
          >
            {status === 'loading' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
        {status === 'error' && (
          <p className="text-red-400 text-xs mt-2">{errorMessage}</p>
        )}
      </div>
    );
  }
  
  // Default Variante (vollständig mit Box)
  return (
    <div className={`bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-8 text-white ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
          <Mail className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold">Newsletter abonnieren</h3>
          <p className="text-white/80 text-sm">Keine Neuigkeiten mehr verpassen</p>
        </div>
      </div>
      
      <p className="text-white/90 mb-6">
        Erhalten Sie exklusive Updates zu neuen Kursen, Sonderangeboten 
        und hilfreichen Lerntipps direkt in Ihr Postfach.
      </p>
      
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ihre@email.de"
          disabled={status === 'loading'}
          className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 focus:bg-white/20 focus:border-white/40 outline-none"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-6 py-3 bg-white text-primary-600 font-semibold rounded-xl hover:bg-white/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Wird gesendet...
            </>
          ) : (
            <>
              Abonnieren
              <Send className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
      
      {status === 'error' && (
        <div className="flex items-center gap-2 mt-4 text-red-200">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{errorMessage}</span>
        </div>
      )}
      
      <p className="text-white/60 text-xs mt-4">
        Wir respektieren Ihre Privatsphäre. Abmeldung jederzeit möglich.
      </p>
    </div>
  );
}

