import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Für Server-Side API Calls: Interne Docker-URL verwenden
const API_BASE_URL = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ detail: 'Nicht authentifiziert' }, { status: 401 });
    }

    const body = await request.json();

    const res = await fetch(`${API_BASE_URL}/v1/vocabulary/admin/ai/generate`, {
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

    return NextResponse.json(data);
  } catch (error) {
    console.error('AI generate error:', error);
    return NextResponse.json(
      { detail: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

