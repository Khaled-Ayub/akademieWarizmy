// ===========================================
// WARIZMY EDUCATION - Schedules API Route
// ===========================================
// Öffentliche API für Unterrichtstermine (Kalender)

import { NextRequest, NextResponse } from 'next/server';

// FastAPI URL für Server-Side
const API_URL = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

/**
 * GET /api/schedules
 * Ruft Unterrichtstermine ab mit optionalen Filtern
 * Query-Parameter:
 * - from: Startdatum (YYYY-MM-DD)
 * - to: Enddatum (YYYY-MM-DD)
 * - courseId: Filter nach Kurs
 */
export async function GET(request: NextRequest) {
  try {
    // Query-Parameter extrahieren
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const courseId = searchParams.get('courseId');

    // Query-Parameter aufbauen
    const queryParams = new URLSearchParams();
    if (from) queryParams.append('from_date', from);
    if (to) queryParams.append('to_date', to);
    if (courseId) queryParams.append('course_id', courseId);

    const queryString = queryParams.toString();
    const url = `${API_URL}/sessions${queryString ? `?${queryString}` : ''}`;

    // FastAPI aufrufen
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      // Cache für 5 Minuten
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      // Falls Endpoint nicht existiert
      if (res.status === 404) {
        return NextResponse.json({ data: [] });
      }
      throw new Error(`API error: ${res.status}`);
    }

    const data = await res.json();
    // Wrap in data property for compatibility
    return NextResponse.json({ data: Array.isArray(data) ? data : [] });
  } catch (error) {
    console.error('Schedules API Error:', error);
    // Leeres Array zurückgeben, falls Fehler
    return NextResponse.json({ data: [] });
  }
}
