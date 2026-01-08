// ===========================================
// WARIZMY EDUCATION - Admin Announcements API
// ===========================================
// CRUD für Ankündigungen

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// GET /api/admin/announcements - Alle Ankündigungen abrufen
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/announcements`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, data: [], detail: errorData.detail || 'Fehler beim Laden' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, data: [], detail: 'Serverfehler' },
      { status: 500 }
    );
  }
}

// POST /api/admin/announcements - Neue Ankündigung erstellen
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    const body = await request.json();
    
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
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

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, detail: 'Serverfehler' },
      { status: 500 }
    );
  }
}