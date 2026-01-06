import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Für Server-Side API Calls: Interne Docker-URL verwenden
const BACKEND_URL = process.env.API_INTERNAL_URL?.replace('/api', '') || process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000';

// GET: Alle Vokabellisten abrufen (Admin)
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ detail: 'Nicht autorisiert' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();

    const res = await fetch(
      `${BACKEND_URL}/api/v1/vocabulary/admin/lists${queryString ? `?${queryString}` : ''}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await res.json();
    
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Vocabulary admin list error:', error);
    return NextResponse.json(
      { detail: 'Fehler beim Laden der Vokabellisten' },
      { status: 500 }
    );
  }
}

// POST: Neue Vokabelliste erstellen
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ detail: 'Nicht autorisiert' }, { status: 401 });
    }

    const body = await request.json();

    const res = await fetch(`${BACKEND_URL}/api/v1/vocabulary/admin/lists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Vocabulary create error:', error);
    return NextResponse.json(
      { detail: 'Fehler beim Erstellen der Vokabelliste' },
      { status: 500 }
    );
  }
}

