// ===========================================
// WARIZMY EDUCATION - Admin Users API Route
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const API_URL = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'https://acbackend.warizmyacademy.de/api';
const ACCESS_TOKEN_COOKIE = 'warizmy_access_token';
const REFRESH_TOKEN_COOKIE = 'warizmy_refresh_token';

function getCookieDomainFromRequest(request: NextRequest): string | undefined {
  const host = request.headers.get('host') || '';
  if (host === 'warizmyacademy.de' || host.endsWith('.warizmyacademy.de')) {
    return '.warizmyacademy.de';
  }
  return undefined;
}

function applyAuthCookies(
  response: NextResponse,
  request: NextRequest,
  tokens: { access_token: string; refresh_token?: string }
) {
  const domain = process.env.NODE_ENV === 'production' ? getCookieDomainFromRequest(request) : undefined;
  const base = {
    httpOnly: false, // tokens are currently also read on the client via js-cookie
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    ...(domain ? { domain } : {}),
  };

  // 30 minutes
  response.cookies.set(ACCESS_TOKEN_COOKIE, tokens.access_token, {
    ...base,
    maxAge: 60 * 30,
  });

  if (tokens.refresh_token) {
    // 7 days
    response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refresh_token, {
      ...base,
      maxAge: 60 * 60 * 24 * 7,
    });
  }
}

async function refreshAccessToken(request: NextRequest): Promise<{ access_token: string; refresh_token?: string } | null> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) return null;

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  if (!data?.access_token) return null;

  return { access_token: data.access_token, refresh_token: data.refresh_token };
}

/**
 * Helper: Authorization Header aus Cookies erstellen
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  
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
    let res = await fetch(url, {
      headers: { 
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      cache: 'no-store',
    });

    // If the access token is expired/missing, try to refresh once and retry.
    if (res.status === 401) {
      const refreshed = await refreshAccessToken(request);
      if (refreshed) {
        res = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${refreshed.access_token}`,
          },
          cache: 'no-store',
        });

        if (res.ok) {
          const data = await res.json();
          const nextRes = NextResponse.json(data);
          applyAuthCookies(nextRes, request, refreshed);
          return nextRes;
        }
      }
    }

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
    let res = await fetch(`${API_URL}/admin/users`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(body),
    });

    // If the access token is expired/missing, try to refresh once and retry.
    if (res.status === 401) {
      const refreshed = await refreshAccessToken(request);
      if (refreshed) {
        res = await fetch(`${API_URL}/admin/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${refreshed.access_token}`,
          },
          body: JSON.stringify(body),
        });

        if (res.ok) {
          const data = await res.json();
          const nextRes = NextResponse.json(data);
          applyAuthCookies(nextRes, request, refreshed);
          return nextRes;
        }
      }
    }

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

