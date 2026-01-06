import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.API_INTERNAL_URL?.replace('/api', '') || 'http://backend:8000';

// POST: KI-Überprüfung der Vokabelliste
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

    const res = await fetch(`${BACKEND_URL}/api/v1/vocabulary/admin/ai/verify-list/${id}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('AI verify error:', error);
    return NextResponse.json(
      { detail: 'Fehler bei der KI-Überprüfung' },
      { status: 500 }
    );
  }
}

