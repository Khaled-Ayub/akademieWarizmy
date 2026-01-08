// ===========================================
// WARIZMY EDUCATION - Admin Announcement by ID API
// ===========================================
// Einzelne Ankündigung abrufen, aktualisieren, löschen

import { NextResponse } from 'next/server';

// PATCH /api/admin/announcements/[id] - Ankündigung aktualisieren
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/announcements/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    
    if (!res.ok) {
      return NextResponse.json(
        { success: false, detail: data.detail || 'Fehler beim Aktualisieren' },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, detail: 'Serverfehler' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/announcements/[id] - Ankündigung löschen
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/announcements/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!res.ok) {
      const data = await res.json();
      return NextResponse.json(
        { success: false, detail: data.detail || 'Fehler beim Löschen' },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, detail: 'Serverfehler' },
      { status: 500 }
    );
  }
}