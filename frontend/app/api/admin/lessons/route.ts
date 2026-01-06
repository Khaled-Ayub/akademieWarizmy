// ===========================================
// WARIZMY EDUCATION - Admin Lessons API Route
// ===========================================

import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// POST - Neue Lektion erstellen
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Unterstütze sowohl { data: { course: id, ... } } als auch direkte Daten
    const lessonData = body.data || body;
    
    // courseId kann als 'course' oder 'course_id' kommen
    const courseId = lessonData.course || lessonData.course_id;
    
    if (!courseId) {
      return NextResponse.json({ error: 'course oder course_id ist erforderlich' }, { status: 400 });
    }
    
    // Daten für Backend vorbereiten
    const backendData = {
      title: lessonData.title,
      slug: lessonData.slug,
      description: lessonData.description || '',
      order: lessonData.order || 1,
      vimeo_video_url: lessonData.vimeo_video_url || null,
      duration_minutes: lessonData.duration_minutes || 0,
      is_free_preview: lessonData.is_free_preview || false,
      is_published: lessonData.is_published || false,
    };
    
    const res = await fetch(`${API_URL}/courses/${courseId}/lessons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendData),
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

    const lesson = await res.json();
    
    // Direkt das flache FastAPI-Format zurückgeben
    return NextResponse.json(lesson);
  } catch (error) {
    console.error('Error creating lesson:', error);
    return NextResponse.json(
      { error: 'Failed to create lesson' },
      { status: 500 }
    );
  }
}
