// ===========================================
// WARIZMY EDUCATION - Media Upload API Route
// ===========================================
// Lädt Dateien zu MinIO hoch via FastAPI Backend

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Backend URL für Server-seitige Calls
// Priorität: API_INTERNAL_URL > NEXT_PUBLIC_API_URL > localhost (dev only)
const API_URL = process.env.API_INTERNAL_URL 
  || process.env.NEXT_PUBLIC_API_URL 
  || 'http://localhost:8000/api';

/**
 * Helper: Authorization Header aus Cookies erstellen
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const token = cookieStore.get('warizmy_access_token')?.value;
  
  if (!token) {
    return {};
  }
  
  return {
    'Authorization': `Bearer ${token}`,
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'courses';

    if (!file) {
      return NextResponse.json({ error: 'Keine Datei hochgeladen' }, { status: 400 });
    }

    // Bestimme den richtigen Endpoint basierend auf Dateityp
    let endpoint = '/upload/any';
    
    if (file.type.startsWith('image/')) {
      endpoint = '/upload/image';
    } else if (file.type === 'application/pdf' || 
               file.type.includes('document') || 
               file.type.includes('spreadsheet') ||
               file.type === 'text/plain') {
      endpoint = '/upload/document';
    } else if (file.type.startsWith('video/')) {
      endpoint = '/upload/video';
    }

    // FormData für FastAPI erstellen
    const apiFormData = new FormData();
    apiFormData.append('file', file);
    apiFormData.append('folder', folder);

    console.log(`Uploading to: ${API_URL}${endpoint}`);

    const authHeaders = await getAuthHeaders();
    // An FastAPI Backend senden
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        ...authHeaders,
      },
      body: apiFormData,
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Upload Error Response:', errorText);
      
      try {
        const error = JSON.parse(errorText);
        return NextResponse.json({ error: error.detail || 'Upload fehlgeschlagen' }, { status: res.status });
      } catch {
        return NextResponse.json({ error: 'Upload fehlgeschlagen' }, { status: 500 });
      }
    }

    const data = await res.json();
    
    // Antwort-Format anpassen für Frontend
    return NextResponse.json({
      success: true,
      id: Date.now(), // Temporäre ID
      url: data.url,
      filename: data.filename,
      size: data.size,
      content_type: data.content_type,
    });
    
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Upload fehlgeschlagen' }, { status: 500 });
  }
}
