'use strict';

/**
 * AI Controller
 * Verarbeitet HTTP-Anfragen für KI-Funktionen
 * 
 * Endpunkte:
 * - POST /api/ai/generate - Text generieren
 * - POST /api/ai/improve - Text verbessern
 * - POST /api/ai/translate - Text übersetzen
 */
module.exports = {
  /**
   * Text mit KI generieren
   * POST /api/ai/generate
   * 
   * Request Body:
   * {
   *   "prompt": "Erstelle eine Kursbeschreibung...",
   *   "type": "course_description", // optional: course_description, lesson_content, faq_answer, general
   *   "language": "de" // optional: de, en, ar, tr, fr
   * }
   * 
   * Response:
   * {
   *   "success": true,
   *   "text": "Generierter Text...",
   *   "usage": { "prompt_tokens": 50, "completion_tokens": 200, "total_tokens": 250 }
   * }
   */
  async generate(ctx) {
    try {
      // Parameter aus Request Body extrahieren
      const { prompt, type, language } = ctx.request.body;
      
      // Validierung: Prompt ist erforderlich
      if (!prompt) {
        return ctx.badRequest('Prompt ist erforderlich');
      }

      // AI Service aufrufen
      const aiService = strapi.service('api::ai.ai');
      const result = await aiService.generateText({ prompt, type, language });

      // Erfolgreiche Antwort zurückgeben
      ctx.body = result;
    } catch (error) {
      // Fehler loggen und zurückgeben
      strapi.log.error('AI Generate Error:', error);
      return ctx.badRequest(error.message);
    }
  },

  /**
   * Text verbessern/umschreiben
   * POST /api/ai/improve
   * 
   * Request Body:
   * {
   *   "text": "Der zu verbessernde Text...",
   *   "instruction": "Mache den Text formeller" // optional
   * }
   * 
   * Response:
   * {
   *   "success": true,
   *   "text": "Verbesserter Text...",
   *   "usage": { ... }
   * }
   */
  async improve(ctx) {
    try {
      // Parameter aus Request Body extrahieren
      const { text, instruction } = ctx.request.body;
      
      // Validierung: Text ist erforderlich
      if (!text) {
        return ctx.badRequest('Text ist erforderlich');
      }

      // AI Service aufrufen
      const aiService = strapi.service('api::ai.ai');
      const result = await aiService.improveText({ text, instruction });

      // Erfolgreiche Antwort zurückgeben
      ctx.body = result;
    } catch (error) {
      // Fehler loggen und zurückgeben
      strapi.log.error('AI Improve Error:', error);
      return ctx.badRequest(error.message);
    }
  },

  /**
   * Text übersetzen
   * POST /api/ai/translate
   * 
   * Request Body:
   * {
   *   "text": "Der zu übersetzende Text...",
   *   "targetLanguage": "en" // erforderlich: de, en, ar, tr, fr
   * }
   * 
   * Response:
   * {
   *   "success": true,
   *   "text": "Translated text...",
   *   "usage": { ... }
   * }
   */
  async translate(ctx) {
    try {
      // Parameter aus Request Body extrahieren
      const { text, targetLanguage } = ctx.request.body;
      
      // Validierung: Text und Zielsprache sind erforderlich
      if (!text || !targetLanguage) {
        return ctx.badRequest('Text und Zielsprache sind erforderlich');
      }

      // AI Service aufrufen
      const aiService = strapi.service('api::ai.ai');
      const result = await aiService.translateText({ text, targetLanguage });

      // Erfolgreiche Antwort zurückgeben
      ctx.body = result;
    } catch (error) {
      // Fehler loggen und zurückgeben
      strapi.log.error('AI Translate Error:', error);
      return ctx.badRequest(error.message);
    }
  },
};

