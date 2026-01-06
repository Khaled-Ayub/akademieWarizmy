import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.API_INTERNAL_URL?.replace('/api', '') || 'http://backend:8000';

// PUT: Vokabelliste aktualisieren
export async function PUT(
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

    const res = await fetch(`${BACKEND_URL}/api/v1/vocabulary/admin/lists/${id}`, {
      method: 'PUT',
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
    console.error('Vocabulary update error:', error);
    return NextResponse.json(
      { detail: 'Fehler beim Aktualisieren der Vokabelliste' },
      { status: 500 }
    );
  }
}

// DELETE: Vokabelliste löschen
export async function DELETE(
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

    const res = await fetch(`${BACKEND_URL}/api/v1/vocabulary/admin/lists/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Vocabulary delete error:', error);
    return NextResponse.json(
      { detail: 'Fehler beim Löschen der Vokabelliste' },
      { status: 500 }
    );
  }
}

