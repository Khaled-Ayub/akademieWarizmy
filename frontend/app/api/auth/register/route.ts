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
    const body = await request.json();
    console.log('[API /auth/register] Received registration request for:', body.email);

    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    console.log('[API /auth/register] Backend response status:', res.status);

    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { detail: text };
    }

    if (!res.ok) {
      console.error('[API /auth/register] Registration failed:', data);
    } else {
      console.log('[API /auth/register] Registration successful');
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[API /auth/register] Proxy error:', error);
    return NextResponse.json({ detail: 'Register failed' }, { status: 500 });
  }
}


