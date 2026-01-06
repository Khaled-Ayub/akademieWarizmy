import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.API_INTERNAL_URL?.replace('/api', '') || process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000';

// POST: KI-Generierung und direkt zur Liste hinzufügen
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ detail: 'Nicht autorisiert' }, { status: 401 });
    }

    const body = await request.json();

    const res = await fetch(`${BACKEND_URL}/api/v1/vocabulary/admin/ai/generate-to-list/${id}`, {
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
      { detail: 'Fehler bei der KI-Generierung' },
      { status: 500 }
    );
  }
}

