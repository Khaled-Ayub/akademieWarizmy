'use strict';

const OpenAI = require('openai');

/**
 * AI Service
 * Kommuniziert mit OpenAI API für Textgenerierung
 * 
 * Funktionen:
 * - generateText: Text basierend auf Typ und Sprache generieren
 * - improveText: Bestehenden Text verbessern
 * - translateText: Text in Zielsprache übersetzen
 */
module.exports = {
  /**
   * OpenAI Client initialisieren
   * Verwendet OPENAI_API_KEY aus Umgebungsvariablen
   */
  getClient() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    // Validierung: API Key muss gesetzt sein
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY Umgebungsvariable nicht gesetzt');
    }

    // OpenAI Client erstellen und zurückgeben
    return new OpenAI({ apiKey });
  },

  /**
   * Text generieren basierend auf Prompt und Typ
   * 
   * @param {object} params - Parameter
   * @param {string} params.prompt - Der Prompt für die KI
   * @param {string} params.type - Typ: course_description, lesson_content, faq_answer, general
   * @param {string} params.language - Sprache: de, en, ar, tr, fr
   * @returns {object} - { success: boolean, text: string, usage: object }
   */
  async generateText({ prompt, type = 'general', language = 'de' }) {
    const client = this.getClient();

    // System-Prompts für verschiedene Content-Typen
    const systemPrompts = {
      // Kursbeschreibung: Professionell und überzeugend
      course_description: `Du bist ein Experte für Bildungsinhalte. Erstelle eine professionelle Kursbeschreibung auf ${language === 'de' ? 'Deutsch' : language}. Die Beschreibung soll informativ, ansprechend und überzeugend sein.`,
      
      // Lektionsinhalte: Klar strukturiert und verständlich
      lesson_content: `Du bist ein erfahrener Lehrer. Erstelle Lektionsinhalte auf ${language === 'de' ? 'Deutsch' : language}. Der Text soll klar strukturiert und leicht verständlich sein.`,
      
      // FAQ-Antworten: Präzise und hilfreich
      faq_answer: `Du bist ein hilfreicher Assistent. Beantworte die Frage präzise und verständlich auf ${language === 'de' ? 'Deutsch' : language}.`,
      
      // Allgemein: Standard-Assistent
      general: `Du bist ein hilfreicher Assistent. Antworte auf ${language === 'de' ? 'Deutsch' : language}.`,
    };

    // OpenAI API aufrufen
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini', // Kostengünstiges, schnelles Modell
      messages: [
        { role: 'system', content: systemPrompts[type] || systemPrompts.general },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7, // Kreativität: mittlerer Wert
      max_tokens: 1000, // Maximale Antwortlänge
    });

    // Ergebnis formatieren und zurückgeben
    return {
      success: true,
      text: response.choices[0].message.content,
      usage: response.usage, // Token-Verbrauch
    };
  },

  /**
   * Text verbessern oder umschreiben
   * 
   * @param {object} params - Parameter
   * @param {string} params.text - Der zu verbessernde Text
   * @param {string} params.instruction - Spezifische Anweisung (optional)
   * @returns {object} - { success: boolean, text: string, usage: object }
   */
  async improveText({ text, instruction = 'Verbessere diesen Text' }) {
    const client = this.getClient();

    // OpenAI API für Textverbesserung aufrufen
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
      temperature: 0.5, // Weniger Kreativität für präzise Verbesserungen
      max_tokens: 1500,
    });

    return {
      success: true,
      text: response.choices[0].message.content,
      usage: response.usage,
    };
  },

  /**
   * Text in Zielsprache übersetzen
   * 
   * @param {object} params - Parameter
   * @param {string} params.text - Der zu übersetzende Text
   * @param {string} params.targetLanguage - Zielsprache: de, en, ar, tr, fr
   * @returns {object} - { success: boolean, text: string, usage: object }
   */
  async translateText({ text, targetLanguage }) {
    const client = this.getClient();

    // Sprachnamen für natürlichere Prompts
    const languageNames = {
      de: 'Deutsch',
      en: 'Englisch',
      ar: 'Arabisch',
      tr: 'Türkisch',
      fr: 'Französisch',
    };

    // OpenAI API für Übersetzung aufrufen
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: `Du bist ein professioneller Übersetzer. Übersetze den folgenden Text ins ${languageNames[targetLanguage] || targetLanguage}. Behalte den Stil und Ton bei.` 
        },
        { role: 'user', content: text },
      ],
      temperature: 0.3, // Niedrige Kreativität für genaue Übersetzungen
      max_tokens: 1500,
    });

    return {
      success: true,
      text: response.choices[0].message.content,
      usage: response.usage,
    };
  },
};

