import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering - benötigt request.cookies
export const dynamic = 'force-dynamic';

const RAW_API_URL =
  process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

function normalizeApiUrl(url: string): string {
  const trimmed = url.replace(/\/+$/, '');
  if (trimmed.endsWith('/api')) return trimmed;
  return `${trimmed}/api`;
}

const API_URL = normalizeApiUrl(RAW_API_URL);

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('warizmy_access_token')?.value;
    if (!token) {
      return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }

    const res = await fetch(`${API_URL}/auth/me`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { detail: text };
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Me proxy error:', error);
    return NextResponse.json({ detail: 'Failed to fetch user' }, { status: 500 });
  }
}


