// ===========================================
// WARIZMY EDUCATION - Admin Homework API Route
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

// GET - Hausaufgaben einer Lektion abrufen (Admin)
export async function GET(request: NextRequest) {
  try {
    const lessonId = request.nextUrl.searchParams.get('lesson_id');
    if (!lessonId) {
      return NextResponse.json({ error: 'lesson_id ist erforderlich' }, { status: 400 });
    }

    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_URL}/homework/admin/lesson/${lessonId}`, {
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      cache: 'no-store',
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

    const homeworks = await res.json();
    return NextResponse.json(homeworks);
  } catch (error) {
    console.error('Error fetching homework:', error);
    return NextResponse.json(
      { error: 'Failed to fetch homework' },
      { status: 500 }
    );
  }
}

// POST - Neue Hausaufgabe erstellen (Admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeaders = await getAuthHeaders();

    const res = await fetch(`${API_URL}/homework`, {
      method: 'POST',
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
    console.error('Error creating homework:', error);
    return NextResponse.json(
      { error: 'Failed to create homework' },
      { status: 500 }
    );
  }
}
