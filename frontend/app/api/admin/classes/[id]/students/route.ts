// ===========================================
// WARIZMY EDUCATION - Admin Class Students API
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

// GET - Alle Studenten einer Klasse abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_URL}/admin/classes/${id}/students`, {
      headers: { 
        'Content-Type': 'application/json',
        ...authHeaders,
      },
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Not found' }));
      return NextResponse.json(error, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

// POST - Student zu Klasse hinzufügen
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const enrollment_type = searchParams.get('enrollment_type') || 'one_time';
    
    if (!user_id) {
      return NextResponse.json({ detail: 'user_id required' }, { status: 400 });
    }
    
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_URL}/admin/classes/${id}/students?user_id=${user_id}&enrollment_type=${enrollment_type}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...authHeaders,
      },
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Failed' }));
      return NextResponse.json(error, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error adding student:', error);
    return NextResponse.json(
      { error: 'Failed to add student' },
      { status: 500 }
    );
  }
}
