// ===========================================
// WARIZMY EDUCATION - Admin Homework Single API
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

/**
 * Helper: Authorization Header aus Cookies erstellen
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const token = cookieStore.get('warizmy_access_token')?.value;
  
  if (!token) {
    return {};
  }
  
  return {
    Authorization: `Bearer ${token}`,
  };
}

// PUT - Hausaufgabe aktualisieren
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const authHeaders = await getAuthHeaders();

    const res = await fetch(`${API_URL}/homework/${params.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Backend Error:', errorText);
      try {
        const error = JSON.parse(errorText);
        return NextResponse.json(error, { status: res.status });
      } catch {
        return NextResponse.json({ error: errorText }, { status: res.status });
      }
    }

    const homework = await res.json();
    return NextResponse.json(homework);
  } catch (error) {
    console.error('Error updating homework:', error);
    return NextResponse.json(
      { error: 'Failed to update homework' },
      { status: 500 }
    );
  }
}

// DELETE - Hausaufgabe loeschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_URL}/homework/${params.id}`, {
      method: 'DELETE',
      headers: {
        ...authHeaders,
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      try {
        const error = JSON.parse(errorText);
        return NextResponse.json(error, { status: res.status });
      } catch {
        return NextResponse.json({ error: errorText }, { status: res.status });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting homework:', error);
    return NextResponse.json(
      { error: 'Failed to delete homework' },
      { status: 500 }
    );
  }
}
