// ===========================================
// WARIZMY EDUCATION - AI Content Generator
// ===========================================
// Generiert Kursbeschreibungen, Lektionstitel etc.

import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface GenerateRequest {
  type: 'course_description' | 'course_short_description' | 'lesson_description' | 'lesson_titles';
  context: {
    title?: string;
    category?: string;
    level?: string;
    courseTitle?: string;
    lessonCount?: number;
  };
}

export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OpenAI API Key nicht konfiguriert' },
      { status: 500 }
    );
  }

  try {
    const body: GenerateRequest = await request.json();
    const { type, context } = body;

    let prompt = '';
    
    switch (type) {
      case 'course_description':
        prompt = `Schreibe eine ausführliche, professionelle Kursbeschreibung auf Deutsch für einen Online-Kurs mit folgenden Details:
- Titel: ${context.title}
- Kategorie: ${context.category === 'arabic' ? 'Arabisch' : 'Islamische Studien'}
- Level: ${context.level === 'beginner' ? 'Anfänger' : context.level === 'intermediate' ? 'Fortgeschrittene' : 'Experten'}

Die Beschreibung sollte:
- 2-3 Absätze haben
- Die Lernziele erklären
- Den Nutzen für die Studenten betonen
- Professionell und einladend klingen

Schreibe nur die Beschreibung, ohne Überschriften.`;
        break;

      case 'course_short_description':
        prompt = `Schreibe eine kurze, prägnante Beschreibung (max. 150 Zeichen) auf Deutsch für einen Kurs namens "${context.title}". 
Die Beschreibung soll neugierig machen und den Hauptnutzen vermitteln. Nur den Text, keine Anführungszeichen.`;
        break;

      case 'lesson_description':
        prompt = `Schreibe eine kurze Lektionsbeschreibung (2-3 Sätze) auf Deutsch für eine Lektion namens "${context.title}" im Kurs "${context.courseTitle}".
Erkläre was in dieser Lektion gelernt wird. Nur den Text.`;
        break;

      case 'lesson_titles':
        prompt = `Generiere ${context.lessonCount || 5} sinnvolle Lektionstitel auf Deutsch für einen ${context.category === 'arabic' ? 'Arabisch' : 'Islam'}-Kurs mit dem Titel "${context.courseTitle}".
Level: ${context.level === 'beginner' ? 'Anfänger' : context.level === 'intermediate' ? 'Fortgeschrittene' : 'Experten'}

Format: Nummerierte Liste (1. Titel, 2. Titel, etc.)
Die Titel sollten logisch aufeinander aufbauen.`;
        break;

      default:
        return NextResponse.json({ error: 'Unbekannter Typ' }, { status: 400 });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Du bist ein Experte für islamische Bildung und Arabisch-Unterricht. Du hilfst beim Erstellen von professionellen Kursinhalten auf Deutsch.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI Error:', error);
      return NextResponse.json(
        { error: 'Fehler bei der KI-Generierung' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const generatedText = data.choices[0]?.message?.content?.trim() || '';

    return NextResponse.json({ text: generatedText });
  } catch (error) {
    console.error('AI Generate Error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}


