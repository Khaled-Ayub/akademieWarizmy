'use strict';

/**
 * AI Custom Routes
 * Definiert die API-Endpunkte für KI-Funktionen
 * 
 * Diese Routen sind ohne Authentifizierung zugänglich.
 * In Produktion sollte auth auf die gewünschte Policy gesetzt werden.
 * 
 * Verfügbare Endpunkte:
 * - POST /api/ai/generate - Text generieren
 * - POST /api/ai/improve - Text verbessern
 * - POST /api/ai/translate - Text übersetzen
 */
module.exports = {
  routes: [
    {
      // Text generieren
      // Beispiel: curl -X POST http://localhost:1337/api/ai/generate -H "Content-Type: application/json" -d '{"prompt":"...", "type":"course_description"}'
      method: 'POST',
      path: '/ai/generate',
      handler: 'ai.generate',
      config: {
        auth: false, // Ohne Authentifizierung (für Entwicklung)
        policies: [],
        middlewares: [],
      },
    },
    {
      // Text verbessern
      // Beispiel: curl -X POST http://localhost:1337/api/ai/improve -H "Content-Type: application/json" -d '{"text":"..."}'
      method: 'POST',
      path: '/ai/improve',
      handler: 'ai.improve',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      // Text übersetzen
      // Beispiel: curl -X POST http://localhost:1337/api/ai/translate -H "Content-Type: application/json" -d '{"text":"...", "targetLanguage":"en"}'
      method: 'POST',
      path: '/ai/translate',
      handler: 'ai.translate',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};

