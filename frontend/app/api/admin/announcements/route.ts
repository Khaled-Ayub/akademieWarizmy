// ===========================================
// WARIZMY EDUCATION - Admin Announcements API
// ===========================================
// CRUD für Ankündigungen

import { NextResponse } from 'next/server';

// GET /api/admin/announcements - Alle Ankündigungen abrufen
export async function GET() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/announcements`, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      throw new Error('Failed to fetch announcements');
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, detail: 'Serverfehler' },
      { status: 500 }
    );
  }
}

// POST /api/admin/announcements - Neue Ankündigung erstellen
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    
    if (!res.ok) {
      return NextResponse.json(
        { success: false, detail: data.detail || 'Fehler beim Erstellen' },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, detail: 'Serverfehler' },
      { status: 500 }
    );
  }
}