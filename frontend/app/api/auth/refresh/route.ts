import { NextRequest, NextResponse } from 'next/server';

const RAW_API_URL =
  process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

function normalizeApiUrl(url: string): string {
  const trimmed = url.replace(/\/+$/, '');
  if (trimmed.endsWith('/api')) return trimmed;
  return `${trimmed}/api`;
}

const API_URL = normalizeApiUrl(RAW_API_URL);

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('warizmy_refresh_token')?.value;
    if (!refreshToken) {
      return NextResponse.json({ detail: 'No refresh token' }, { status: 401 });
    }

    // Backend expects a single body parameter "refresh_token: str".
    // FastAPI will treat this as a raw JSON string body, not {refresh_token: "..."}.
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(refreshToken),
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
    console.error('Refresh proxy error:', error);
    return NextResponse.json({ detail: 'Refresh failed' }, { status: 500 });
  }
}


