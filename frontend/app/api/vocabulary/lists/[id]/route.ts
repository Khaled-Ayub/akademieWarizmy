import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.API_INTERNAL_URL?.replace('/api', '') || process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000';

// GET: Einzelne Vokabelliste mit Items abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    const res = await fetch(`${BACKEND_URL}/api/v1/vocabulary/lists/${id}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const data = await res.json();
    
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Vocabulary list fetch error:', error);
    return NextResponse.json(
      { detail: 'Fehler beim Laden der Vokabelliste' },
      { status: 500 }
    );
  }
}

