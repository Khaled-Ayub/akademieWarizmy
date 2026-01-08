// ===========================================
// WARIZMY EDUCATION - Homework API Routes
// ===========================================
// API-Endpunkte für Hausaufgaben-Verwaltung

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

// POST - Neue Hausaufgabe erstellen
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_URL}/homework/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.json();
      return NextResponse.json(error, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating homework:', error);
    return NextResponse.json(
      { error: 'Failed to create homework' },
      { status: 500 }
    );
  }
}

// GET - Hausaufgaben einer Lektion abrufen
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get('lesson_id');
    
    if (!lessonId) {
      return NextResponse.json(
        { error: 'lesson_id required' },
        { status: 400 }
      );
    }

    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_URL}/homework/admin/lesson/${lessonId}`, {
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
    });

    if (!res.ok) {
      const error = await res.json();
      return NextResponse.json(error, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching homework:', error);
    return NextResponse.json(
      { error: 'Failed to fetch homework' },
      { status: 500 }
    );
  }
}

// PUT - Hausaufgabe aktualisieren
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const homeworkId = searchParams.get('id');
    
    if (!homeworkId) {
      return NextResponse.json(
        { error: 'homework id required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_URL}/homework/${homeworkId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.json();
      return NextResponse.json(error, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating homework:', error);
    return NextResponse.json(
      { error: 'Failed to update homework' },
      { status: 500 }
    );
  }
}

// DELETE - Hausaufgabe löschen
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const homeworkId = searchParams.get('id');
    
    if (!homeworkId) {
      return NextResponse.json(
        { error: 'homework id required' },
        { status: 400 }
      );
    }

    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_URL}/homework/${homeworkId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
    });

    if (!res.ok) {
      const error = await res.json();
      return NextResponse.json(error, { status: res.status });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting homework:', error);
    return NextResponse.json(
      { error: 'Failed to delete homework' },
      { status: 500 }
    );
  }
}