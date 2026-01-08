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
    const email = String(body?.email || '').trim();
    const password = String(body?.password || '');

    console.log('[API /auth/login] Login attempt for:', email);

    if (!email || !password) {
      console.error('[API /auth/login] Missing email or password');
      return NextResponse.json({ detail: 'E-Mail und Passwort sind erforderlich' }, { status: 400 });
    }

    const form = new URLSearchParams();
    form.append('username', email);
    form.append('password', password);

    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });

    console.log('[API /auth/login] Backend response status:', res.status);

    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { detail: text };
    }

    if (!res.ok) {
      console.error('[API /auth/login] Login failed:', data?.detail);
    } else {
      console.log('[API /auth/login] Login successful');
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[API /auth/login] Proxy error:', error);
    return NextResponse.json({ detail: 'Login failed' }, { status: 500 });
  }
}


