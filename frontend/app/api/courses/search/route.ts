// ===========================================
// WARIZMY EDUCATION - Kurs-Suche API
// ===========================================
// API Route für Live-Suche nach Kursen

import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering - benötigt request.url
export const dynamic = 'force-dynamic';

// FastAPI URL
const API_URL = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

/**
 * GET /api/courses/search?q=suchbegriff
 * Durchsucht Kurse nach Titel und Beschreibung
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    
    // Mindestens 2 Zeichen für Suche
    if (query.length < 2) {
      return NextResponse.json({ data: [] });
    }
    
    // FastAPI Suche
    const res = await fetch(
      `${API_URL}/courses?search=${encodeURIComponent(query)}&limit=10`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        // Kurzes Caching für Suche
        next: { revalidate: 60 },
      }
    );
    
    if (!res.ok) {
      console.error('API search error:', res.status);
      return NextResponse.json({ data: [] });
    }
    
    const data = await res.json();
    // FastAPI gibt direkt ein Array zurück
    return NextResponse.json({ data: data });
    
  } catch (error) {
    console.error('Search API Error:', error);
    return NextResponse.json({ data: [] });
  }
}
