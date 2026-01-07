// ===========================================
// WARIZMY EDUCATION - Admin Courses API Route
// ===========================================
// Proxy für FastAPI Backend mit Server-seitigem Token

import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// GET - Alle Kurse abrufen (Admin: inkl. nicht veröffentlichte)
export async function GET(request: NextRequest) {
  try {
    // Admin-Endpoint verwenden, um auch unveröffentlichte Kurse zu sehen
    const apiUrl = `${API_URL}/courses/admin/all`;
    
    console.log('Fetching courses from:', apiUrl);
    
    const res = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
        // TODO: Auth-Token hinzufügen wenn implementiert
      },
      cache: 'no-store',
    });

    console.log('API response status:', res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.error('API error response:', errorText);
      // Bei Fehlern leeres items-Array zurückgeben, damit Frontend nicht crasht
      return NextResponse.json({ items: [], total: 0, error: errorText });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching courses:', error);
    // Bei Fehlern leeres items-Array zurückgeben, damit Frontend nicht crasht
    return NextResponse.json({ items: [], total: 0, error: String(error) });
  }
}

// POST - Neuen Kurs erstellen
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Unterstütze sowohl { data: ... } als auch direkte Daten
    const courseData = body.data || body;
    
    const res = await fetch(`${API_URL}/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // TODO: Auth-Token hinzufügen wenn implementiert
      },
      body: JSON.stringify(courseData),
    });

    if (!res.ok) {
      const error = await res.json();
      return NextResponse.json(error, { status: res.status });
    }

    const data = await res.json();
    // Wrappen für Frontend-Kompatibilität
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }
}
