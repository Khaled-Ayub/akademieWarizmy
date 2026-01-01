'use strict';

/**
 * AI Controller
 * Verarbeitet Anfragen zur Textgenerierung
 * 
 * WICHTIG: In Strapi 4 müssen Controller als Factory-Funktionen definiert werden,
 * die das strapi-Objekt erhalten und ein Objekt mit Methoden zurückgeben.
 */
module.exports = ({ strapi }) => ({
  /**
   * Text mit KI generieren
   * POST /api/ai-assistant/generate
   * 
   * @param {object} ctx - Koa Context
   * @param {object} ctx.request.body - Request Body
   * @param {string} ctx.request.body.prompt - Der Prompt für die KI
   * @param {string} ctx.request.body.type - Typ: course_description, lesson_content, faq_answer, general
   * @param {string} ctx.request.body.language - Sprache: de, en, ar, tr, fr
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
      const result = await strapi
        .plugin('ai-assistant')
        .service('aiService')
        .generateText({ prompt, type, language });

      // Erfolgreiche Antwort zurückgeben
      ctx.body = result;
    } catch (error) {
      // Fehlerbehandlung
      strapi.log.error('AI Generate Error:', error);
      ctx.badRequest(error.message);
    }
  },

  /**
   * Text verbessern/umschreiben
   * POST /api/ai-assistant/improve
   * 
   * @param {object} ctx - Koa Context
   * @param {object} ctx.request.body - Request Body
   * @param {string} ctx.request.body.text - Der zu verbessernde Text
   * @param {string} ctx.request.body.instruction - Anweisung zur Verbesserung (optional)
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
      const result = await strapi
        .plugin('ai-assistant')
        .service('aiService')
        .improveText({ text, instruction });

      // Erfolgreiche Antwort zurückgeben
      ctx.body = result;
    } catch (error) {
      // Fehlerbehandlung
      strapi.log.error('AI Improve Error:', error);
      ctx.badRequest(error.message);
    }
  },

  /**
   * Text übersetzen
   * POST /api/ai-assistant/translate
   * 
   * @param {object} ctx - Koa Context
   * @param {object} ctx.request.body - Request Body
   * @param {string} ctx.request.body.text - Der zu übersetzende Text
   * @param {string} ctx.request.body.targetLanguage - Zielsprache: de, en, ar, tr, fr
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
      const result = await strapi
        .plugin('ai-assistant')
        .service('aiService')
        .translateText({ text, targetLanguage });

      // Erfolgreiche Antwort zurückgeben
      ctx.body = result;
    } catch (error) {
      // Fehlerbehandlung
      strapi.log.error('AI Translate Error:', error);
      ctx.badRequest(error.message);
    }
  },
});
