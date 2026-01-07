// ===========================================
// WARIZMY EDUCATION - Admin Users API Route
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const API_URL = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'https://acbackend.warizmyacademy.de/api';

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

// GET - Alle Benutzer abrufen
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const search = searchParams.get('search');
    
    let url = `${API_URL}/admin/users`;
    const params = new URLSearchParams();
    if (role && role !== 'all') params.append('role', role);
    if (search) params.append('search', search);
    if (params.toString()) url += `?${params.toString()}`;

    const authHeaders = await getAuthHeaders();
    const res = await fetch(url, {
      headers: { 
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Unknown error' }));
      return NextResponse.json(error, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST - Neuen Benutzer erstellen
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_URL}/admin/users`, {
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

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

