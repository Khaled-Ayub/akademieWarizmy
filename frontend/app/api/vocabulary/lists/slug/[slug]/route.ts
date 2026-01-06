import { NextRequest, NextResponse } from 'next/server';

// Für Server-Side API Calls: Interne Docker-URL verwenden
const API_BASE_URL = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const res = await fetch(`${API_BASE_URL}/vocabulary/lists/slug/${params.slug}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Vocabulary list by slug error:', error);
    return NextResponse.json(
      { detail: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

