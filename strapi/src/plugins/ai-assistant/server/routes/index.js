'use strict';

/**
 * AI Assistant Plugin Routen
 * 
 * In Strapi 4 werden Plugin-Routen als Content-API registriert
 * und sind unter /api/[plugin-name]/[route-path] erreichbar.
 * 
 * Verfügbare Endpunkte:
 * - POST /api/ai-assistant/generate - Text generieren
 * - POST /api/ai-assistant/improve - Text verbessern
 * - POST /api/ai-assistant/translate - Text übersetzen
 */
module.exports = {
  // Content-API Routen für öffentlichen Zugriff
  type: 'content-api',
  routes: [
    {
      // Text generieren
      method: 'POST',
      path: '/generate',
      handler: 'aiController.generate',
      config: {
        policies: [],
        auth: false, // Kein Auth erforderlich
      },
    },
    {
      // Text verbessern
      method: 'POST',
      path: '/improve',
      handler: 'aiController.improve',
      config: {
        policies: [],
        auth: false,
      },
    },
    {
      // Text übersetzen
      method: 'POST',
      path: '/translate',
      handler: 'aiController.translate',
      config: {
        policies: [],
        auth: false,
      },
    },
  ],
};
