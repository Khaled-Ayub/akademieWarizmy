'use strict';

const OpenAI = require('openai');

/**
 * AI Service
 * Kommuniziert mit OpenAI API
 */
module.exports = ({ strapi }) => ({
  /**
   * OpenAI Client initialisieren
   */
  getClient() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY Umgebungsvariable nicht gesetzt');
    }

    return new OpenAI({ apiKey });
  },

  /**
   * Text generieren
   */
  async generateText({ prompt, type = 'general', language = 'de' }) {
    const client = this.getClient();

    // System-Prompt basierend auf Typ
    const systemPrompts = {
      course_description: `Du bist ein Experte für Bildungsinhalte. Erstelle eine professionelle Kursbeschreibung auf ${language === 'de' ? 'Deutsch' : language}. Die Beschreibung soll informativ, ansprechend und überzeugend sein.`,
      lesson_content: `Du bist ein erfahrener Lehrer. Erstelle Lektionsinhalte auf ${language === 'de' ? 'Deutsch' : language}. Der Text soll klar strukturiert und leicht verständlich sein.`,
      faq_answer: `Du bist ein hilfreicher Assistent. Beantworte die Frage präzise und verständlich auf ${language === 'de' ? 'Deutsch' : language}.`,
      general: `Du bist ein hilfreicher Assistent. Antworte auf ${language === 'de' ? 'Deutsch' : language}.`,
    };

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompts[type] || systemPrompts.general },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return {
      success: true,
      text: response.choices[0].message.content,
      usage: response.usage,
    };
  },

  /**
   * Text verbessern
   */
  async improveText({ text, instruction = 'Verbessere diesen Text' }) {
    const client = this.getClient();

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'Du bist ein professioneller Lektor. Verbessere Texte hinsichtlich Grammatik, Stil und Klarheit. Behalte den ursprünglichen Sinn bei.' 
        },
        { 
          role: 'user', 
          content: `${instruction}:\n\n${text}` 
        },
      ],
      temperature: 0.5,
      max_tokens: 1500,
    });

    return {
      success: true,
      text: response.choices[0].message.content,
      usage: response.usage,
    };
  },

  /**
   * Text übersetzen
   */
  async translateText({ text, targetLanguage }) {
    const client = this.getClient();

    const languageNames = {
      de: 'Deutsch',
      en: 'Englisch',
      ar: 'Arabisch',
      tr: 'Türkisch',
      fr: 'Französisch',
    };

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: `Du bist ein professioneller Übersetzer. Übersetze den folgenden Text ins ${languageNames[targetLanguage] || targetLanguage}. Behalte den Stil und Ton bei.` 
        },
        { role: 'user', content: text },
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    return {
      success: true,
      text: response.choices[0].message.content,
      usage: response.usage,
    };
  },
});

