// ===========================================
// WARIZMY EDUCATION - Admin Single Course API
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
    'Authorization': `Bearer ${token}`,
  };
}

// GET - Einzelnen Kurs abrufen (Admin-Route für alle Kurse inkl. nicht veröffentlichte)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(
      `${API_URL}/courses/admin/${params.id}`,
      {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        cache: 'no-store',
      }
    );

    if (!res.ok) {
      const error = await res.json();
      return NextResponse.json(error, { status: res.status });
    }

    const course = await res.json();
    
    // Direkt das flache FastAPI-Format zurückgeben
    return NextResponse.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    );
  }
}

// PUT - Kurs aktualisieren
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    // Unterstütze sowohl { data: ... } als auch direkte Daten
    const courseData = body.data || body;
    
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_URL}/courses/${params.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(courseData),
    });

    if (!res.ok) {
      const error = await res.json();
      return NextResponse.json(error, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    );
  }
}

// DELETE - Kurs löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_URL}/courses/${params.id}`, {
      method: 'DELETE',
      headers: {
        ...authHeaders,
      },
    });

    if (!res.ok) {
      const error = await res.json();
      return NextResponse.json(error, { status: res.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    );
  }
}
