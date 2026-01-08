// ===========================================
// WARIZMY EDUCATION - Admin AI Suggestion API
// ===========================================
// KI-Vorschläge für Ankündigungen

import { NextResponse } from 'next/server';

// POST /api/admin/announcements/ai-suggest - KI-Vorschlag generieren
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/announcements/ai-suggest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    
    if (!res.ok) {
      return NextResponse.json(
        { success: false, detail: data.detail || 'KI nicht verfügbar' },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        detail: 'Serverfehler',
        suggestion: `⚠️ ${body?.prompt || 'Ankündigung'}

[Beschreibung hier ergänzen...]

Weitere Informationen folgen.` 
      },
      { status: 500 }
    );
  }
}