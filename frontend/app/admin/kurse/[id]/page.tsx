// ===========================================
// WARIZMY EDUCATION - Kurs Editor
// ===========================================
// Kurs bearbeiten + Lektionen verwalten

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ChevronLeft, 
  Save,
  Loader2,
  Plus,
  Trash2,
  Edit,
  Play,
  Clock,
  Eye,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  ImagePlus
} from 'lucide-react';

// Toast für Benachrichtigungen
import { useToast } from '@/components/Toast';
import api from '@/lib/api';

// KI-Generierung Hook
function useAIGenerate() {
  const [generating, setGenerating] = useState<string | null>(null);

  const generate = async (
    type: 'course_description' | 'course_short_description' | 'lesson_description' | 'lesson_titles',
    context: any
  ): Promise<string | null> => {
    setGenerating(type);
    try {
      const res = await fetch('/api/admin/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, context }),
      });
      if (!res.ok) throw new Error('Fehler');
      const data = await res.json();
      return data.text;
    } catch (err) {
      console.error('AI Error:', err);
      return null;
    } finally {
      setGenerating(null);
    }
  };

  return { generate, generating };
}

// =========================================
// Types (angepasst für FastAPI - flache Struktur)
// =========================================
interface Lesson {
  id?: string;
  title: string;
  slug: string;
  description: string;
  order: number;
  // Content-Typ
  content_type?: 'video' | 'text' | 'pdf' | 'mixed';
  // Video
  duration_minutes: number;
  vimeo_video_url: string;
  // Text (Rich Content)
  text_content?: string;
  // PDF
  pdf_url?: string;
  pdf_name?: string;
  // Einstellungen
  is_free_preview: boolean;
  isNew?: boolean;
  isEditing?: boolean;
  // Hausaufgaben
  homework?: HomeworkData[];
  has_homework?: boolean;
}

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  short_description: string;
  preview_video_url: string;
  thumbnail_url?: string;
  category: string;
  level: string;
  price: number;
  price_type: string;
  course_type: string;
  duration_weeks: number;
  is_active: boolean;
  is_featured: boolean;
  lessons?: Lesson[];
}

// =========================================
// Content-Typ Icons
// =========================================
import { Video, FileText, File, Layers, Upload, Calendar, BookOpen } from 'lucide-react';

// Tiptap Editor
import TiptapEditor from '@/components/TiptapEditor';

// Vimeo Player für Vorschau
import VimeoPlayer from '@/components/VimeoPlayer';

const CONTENT_TYPES = [
  { value: 'video', label: 'Video', icon: Video, description: 'Video-Lektion (Vimeo)' },
  { value: 'text', label: 'Text', icon: FileText, description: 'Formatierter Text-Inhalt' },
  { value: 'pdf', label: 'PDF', icon: File, description: 'PDF-Dokument zum Download' },
  { value: 'mixed', label: 'Gemischt', icon: Layers, description: 'Video + Text + PDF kombiniert' },
];

// RichTextEditor wurde durch TiptapEditor ersetzt (siehe Import oben)

// =========================================
// PDF Upload Component
// =========================================
function PDFUpload({ 
  pdfUrl, 
  pdfName,
  onUpload, 
  onRemove 
}: {
  pdfUrl?: string;
  pdfName?: string;
  onUpload: (url: string, name: string) => void;
  onRemove: () => void;
}) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.pdf')) {
      alert('Bitte nur PDF-Dateien hochladen');
      return;
    }
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'lessons/pdf');
    
    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      onUpload(data.url, file.name);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload fehlgeschlagen');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
      {pdfUrl ? (
        <div className="flex items-center gap-3">
          <File className="w-8 h-8 text-red-500" />
          <div className="flex-1">
            <p className="font-medium text-gray-800">{pdfName || 'PDF-Datei'}</p>
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:underline">
              Vorschau öffnen
            </a>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 text-red-500 hover:bg-red-50 rounded"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center cursor-pointer py-4">
          {uploading ? (
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          ) : (
            <Upload className="w-8 h-8 text-gray-400" />
          )}
          <span className="mt-2 text-sm text-gray-500">
            {uploading ? 'Wird hochgeladen...' : 'PDF-Datei auswählen'}
          </span>
          <input
            type="file"
            accept=".pdf"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
}

// =========================================
// Hausaufgaben-Bereich
// =========================================
interface HomeworkData {
  id?: string;
  title: string;
  description: string;
  deadline?: string;
  max_points?: number;
  is_active: boolean;
  // Content-Typ (wie bei Lektionen)
  content_type?: 'video' | 'text' | 'pdf' | 'mixed';
  // Video
  vimeo_video_url?: string;
  duration_minutes?: number;
  // Text
  text_content?: string;
  // PDF
  pdf_url?: string;
  pdf_name?: string;
}

// Hausaufgaben Content-Typen
const HW_CONTENT_TYPES = [
  { value: 'text', label: 'Text', icon: FileText, description: 'Anweisungen & Text' },
  { value: 'video', label: 'Video', icon: Video, description: 'Erklärungsvideo' },
  { value: 'pdf', label: 'PDF', icon: File, description: 'PDF-Arbeitsblatt' },
  { value: 'mixed', label: 'Gemischt', icon: Layers, description: 'Video + Text + PDF' },
];

function HomeworkSection({ 
  lessonId,
  homework,
  onSave,
  onDelete
}: {
  lessonId?: string;
  homework: HomeworkData[];
  onSave: (hw: HomeworkData) => void;
  onDelete: (id: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingHw, setEditingHw] = useState<HomeworkData | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<HomeworkData>({
    title: '',
    description: '',
    deadline: '',
    max_points: undefined,
    is_active: true,
    content_type: 'text',
    vimeo_video_url: '',
    duration_minutes: undefined,
    text_content: '',
    pdf_url: '',
    pdf_name: '',
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      deadline: '',
      max_points: undefined,
      is_active: true,
      content_type: 'text',
      vimeo_video_url: '',
      duration_minutes: undefined,
      text_content: '',
      pdf_url: '',
      pdf_name: '',
    });
    setShowForm(false);
    setEditingHw(null);
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) return;
    onSave(editingHw ? { ...formData, id: editingHw.id } : formData);
    resetForm();
  };

  // PDF Upload für Hausaufgaben
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.name.endsWith('.pdf')) {
      alert('Bitte nur PDF-Dateien hochladen');
      return;
    }
    
    setUploading(true);
    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('folder', 'homework/pdf');
    
    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: uploadData,
      });
      const data = await res.json();
      setFormData(prev => ({ ...prev, pdf_url: data.url, pdf_name: file.name }));
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload fehlgeschlagen');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border-2 border-amber-200 rounded-lg overflow-hidden bg-amber-50/30">
      {/* Header - Hervorgehoben */}
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-100 to-orange-100 border-b border-amber-200">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-amber-800">📝 Hausaufgaben</span>
          {homework.length > 0 && (
            <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full">
              {homework.length}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => { setShowForm(true); setEditingHw(null); }}
          className="text-xs bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-600 flex items-center gap-1 font-medium"
        >
          <Plus className="w-3 h-3" />
          Neue Hausaufgabe
        </button>
      </div>
      
      {/* Hausaufgaben-Liste */}
      {homework.length > 0 && (
        <div className="divide-y divide-amber-100">
          {homework.map((hw, idx) => (
            <div key={hw.id || idx} className="p-3 flex items-center gap-3 bg-white/50 hover:bg-white transition-colors">
              {/* Icon basierend auf Content-Typ */}
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                hw.content_type === 'video' ? 'bg-blue-100 text-blue-600' :
                hw.content_type === 'pdf' ? 'bg-red-100 text-red-600' :
                hw.content_type === 'mixed' ? 'bg-purple-100 text-purple-600' :
                'bg-amber-100 text-amber-600'
              }`}>
                {hw.content_type === 'video' ? <Video className="w-5 h-5" /> :
                 hw.content_type === 'pdf' ? <File className="w-5 h-5" /> :
                 hw.content_type === 'mixed' ? <Layers className="w-5 h-5" /> :
                 <FileText className="w-5 h-5" />}
              </div>
              
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{hw.title}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                  {hw.deadline && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(hw.deadline).toLocaleDateString('de-DE')}
                    </span>
                  )}
                  {hw.max_points && (
                    <span className="text-amber-600 font-medium">{hw.max_points} Punkte</span>
                  )}
                  <span className="capitalize px-2 py-0.5 bg-gray-100 rounded">
                    {HW_CONTENT_TYPES.find(t => t.value === hw.content_type)?.label || 'Text'}
                  </span>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => {
                  setEditingHw(hw);
                  setFormData(hw);
                  setShowForm(true);
                }}
                className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
              >
                <Edit className="w-4 h-4" />
              </button>
              {hw.id && (
                <button
                  type="button"
                  onClick={() => onDelete(hw.id!)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Erweitertes Formular */}
      {showForm && (
        <div className="p-4 bg-white border-t border-amber-200 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-800">
              {editingHw ? 'Hausaufgabe bearbeiten' : 'Neue Hausaufgabe'}
            </h4>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Titel */}
          <input
            type="text"
            placeholder="Titel der Hausaufgabe *"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
          
          {/* Kurzbeschreibung */}
          <textarea
            placeholder="Kurze Beschreibung / Anweisungen"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={2}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg resize-none"
          />
          
          {/* Content-Typ Auswahl */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Inhaltstyp</label>
            <div className="grid grid-cols-4 gap-2">
              {HW_CONTENT_TYPES.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, content_type: type.value as any }))}
                  className={`p-2 rounded-lg border-2 text-center transition-all ${
                    formData.content_type === type.value 
                      ? 'border-amber-500 bg-amber-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <type.icon className={`w-4 h-4 mx-auto mb-1 ${
                    formData.content_type === type.value ? 'text-amber-600' : 'text-gray-400'
                  }`} />
                  <span className={`text-xs font-medium ${
                    formData.content_type === type.value ? 'text-amber-600' : 'text-gray-600'
                  }`}>{type.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Video-Bereich */}
          {(formData.content_type === 'video' || formData.content_type === 'mixed') && (
            <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 text-blue-700">
                <Video className="w-4 h-4" />
                <span className="text-sm font-medium">Erklärungsvideo</span>
              </div>
              <input
                type="url"
                value={formData.vimeo_video_url || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, vimeo_video_url: e.target.value }))}
                placeholder="https://vimeo.com/123456789"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
          )}
          
          {/* Text-Bereich */}
          {(formData.content_type === 'text' || formData.content_type === 'mixed') && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-700">
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium">Aufgabenstellung (Text)</span>
              </div>
              <TiptapEditor
                value={formData.text_content || ''}
                onChange={(val) => setFormData(prev => ({ ...prev, text_content: val }))}
                placeholder="Detaillierte Aufgabenstellung hier eingeben..."
                minHeight="150px"
                maxHeight="300px"
              />
            </div>
          )}
          
          {/* PDF-Bereich */}
          {(formData.content_type === 'pdf' || formData.content_type === 'mixed') && (
            <div className="space-y-2 p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 text-red-700">
                <File className="w-4 h-4" />
                <span className="text-sm font-medium">PDF-Arbeitsblatt</span>
              </div>
              {formData.pdf_url ? (
                <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-200">
                  <File className="w-6 h-6 text-red-500" />
                  <span className="flex-1 text-sm truncate">{formData.pdf_name || 'PDF-Datei'}</span>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, pdf_url: '', pdf_name: '' }))}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-red-300 rounded-lg cursor-pointer hover:bg-red-100/50">
                  {uploading ? (
                    <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-red-400" />
                      <span className="text-sm text-red-600">PDF hochladen</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handlePdfUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          )}

          {/* Abgabe-Einstellungen */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Abgabefrist</label>
              <input
                type="datetime-local"
                value={formData.deadline || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Max. Punkte</label>
              <input
                type="number"
                min="0"
                placeholder="z.B. 100"
                value={formData.max_points || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, max_points: parseInt(e.target.value) || undefined }))}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg"
              />
            </div>
          </div>
          
          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!formData.title.trim()}
              className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 font-medium"
            >
              {editingHw ? 'Aktualisieren' : 'Hausaufgabe hinzufügen'}
            </button>
          </div>
        </div>
      )}
      
      {homework.length === 0 && !showForm && (
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-6 h-6 text-amber-500" />
          </div>
          <p className="text-sm text-gray-600 mb-2">Keine Hausaufgaben für diese Lektion</p>
          <p className="text-xs text-gray-400">Fügen Sie Übungen, Arbeitsblätter oder Videos hinzu</p>
        </div>
      )}
    </div>
  );
}

// =========================================
// Lektion Editor Modal (Erweitert)
// =========================================
function LessonModal({ 
  lesson, 
  onSave, 
  onClose,
  courseId,
  nextOrder,
  courseTitle
}: { 
  lesson: Lesson | null;
  onSave: (lesson: Lesson) => void;
  onClose: () => void;
  courseId: string;
  nextOrder: number;
  courseTitle: string;
}) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'content' | 'homework'>('content');
  // Track ob der Slug manuell geändert wurde
  const [slugManuallyChanged, setSlugManuallyChanged] = useState(!!lesson?.slug);
  const [formData, setFormData] = useState({
    title: lesson?.title || '',
    slug: lesson?.slug || '',
    description: lesson?.description || '',
    content_type: (lesson as any)?.content_type || 'video',
    // Video
    vimeo_video_url: lesson?.vimeo_video_url || '',
    // Text
    text_content: (lesson as any)?.text_content || '',
    // PDF
    pdf_url: (lesson as any)?.pdf_url || '',
    pdf_name: (lesson as any)?.pdf_name || '',
    // Einstellungen
    is_free_preview: lesson?.is_free_preview || false,
    order: lesson?.order || nextOrder,
  });
  const [homework, setHomework] = useState<HomeworkData[]>([]);
  const [saving, setSaving] = useState(false);
  const { generate, generating } = useAIGenerate();
  
  // Hausaufgaben laden wenn Lektion bearbeitet wird
  useEffect(() => {
    if (lesson?.id) {
      loadHomework(lesson.id);
    } else {
      setHomework([]);
    }
  }, [lesson?.id]);
  
  const fetchHomework = async (lessonId: string): Promise<HomeworkData[]> => {
    const res = await api.get(`/homework/admin/lesson/${lessonId}`);
    const hwData = res.data || [];
    return hwData.map((hw: any) => ({
      id: hw.id,
      title: hw.title,
      description: hw.description,
      deadline: hw.deadline ? new Date(hw.deadline).toISOString().slice(0, 16) : '',
      max_points: hw.max_points,
      content_type: hw.content_type || 'text',
      vimeo_video_url: hw.vimeo_video_url || '',
      duration_minutes: hw.duration_minutes,
      text_content: hw.text_content || '',
      pdf_url: hw.pdf_url || '',
      pdf_name: hw.pdf_name || '',
      is_active: hw.is_active !== false,
    }));
  };

  const loadHomework = async (lessonId: string) => {
    try {
      const items = await fetchHomework(lessonId);
      setHomework(items);
    } catch (err) {
      console.error('Fehler beim Laden der Hausaufgaben:', err);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[äÄ]/g, 'ae')
      .replace(/[öÖ]/g, 'oe')
      .replace(/[üÜ]/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  // Titel ändern und Slug automatisch generieren (wenn nicht manuell geändert)
  const handleTitleChange = (newTitle: string) => {
    setFormData(prev => ({
      ...prev,
      title: newTitle,
      // Slug nur auto-generieren, wenn nicht manuell geändert
      slug: slugManuallyChanged ? prev.slug : generateSlug(newTitle)
    }));
  };

  // Slug manuell ändern
  const handleSlugChange = (newSlug: string) => {
    setSlugManuallyChanged(true);
    setFormData(prev => ({ ...prev, slug: newSlug }));
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Bitte gib einen Titel ein');
      return;
    }
    setSaving(true);

    try {
      const payload = {
        ...formData,
        slug: formData.slug || generateSlug(formData.title),
        course_id: courseId,
      };

      let result;
      if (lesson?.id) {
        const res = await fetch(`/api/admin/lessons/${lesson.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Fehler beim Speichern');
        result = await res.json();
        toast.success('✅ Lektion erfolgreich aktualisiert!');
      } else {
        const res = await fetch('/api/admin/lessons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Fehler beim Erstellen');
        result = await res.json();
        toast.success('✅ Lektion erfolgreich erstellt!');
      }

      // Hausaufgaben speichern
      for (const hw of homework) {
        try {
          if (hw.id && hw.id.startsWith('temp-')) {
            // Neue Hausaufgabe erstellen
            const hwPayload = {
              lesson_id: result.id || result.data?.id,
              title: hw.title,
              description: hw.description,
              deadline: hw.deadline ? new Date(hw.deadline).toISOString() : null,
              max_points: hw.max_points,
              content_type: hw.content_type,
              vimeo_video_url: hw.vimeo_video_url || null,
              text_content: hw.text_content || null,
              pdf_url: hw.pdf_url || null,
              pdf_name: hw.pdf_name || null,
              is_active: hw.is_active,
            };
            
            await api.post('/homework/', hwPayload);
          } else if (hw.id) {
            // Bestehende Hausaufgabe aktualisieren
            const hwPayload = {
              title: hw.title,
              description: hw.description,
              deadline: hw.deadline ? new Date(hw.deadline).toISOString() : null,
              max_points: hw.max_points,
              content_type: hw.content_type,
              vimeo_video_url: hw.vimeo_video_url || null,
              text_content: hw.text_content || null,
              pdf_url: hw.pdf_url || null,
              pdf_name: hw.pdf_name || null,
              is_active: hw.is_active,
            };
            await api.put(`/homework/${hw.id}`, hwPayload);
          }
        } catch (hwErr) {
          console.error('Fehler beim Speichern der Hausaufgabe:', hwErr);
          toast.error(`❌ Fehler beim Speichern der Hausaufgabe "${hw.title}"`);
        }
      }

      let refreshedHomework: HomeworkData[] = [];
      const lessonId = result.id || result.data?.id;
      if (lessonId) {
        try {
          refreshedHomework = await fetchHomework(lessonId);
          setHomework(refreshedHomework);
        } catch (err) {
          console.error('Fehler beim Aktualisieren der Hausaufgaben:', err);
        }
      }

      onSave({ ...(result.data || result), homework: refreshedHomework });
    } catch (err) {
      console.error('Error saving lesson:', err);
      toast.error('❌ Fehler beim Speichern der Lektion');
    } finally {
      setSaving(false);
    }
  };

  const handleAIImproveText = async () => {
    if (!formData.text_content.trim()) {
      alert('Bitte zuerst Text eingeben');
      return;
    }
    const improved = await generate('lesson_description', { 
      title: formData.title || 'Lektion',
      courseTitle,
      currentText: formData.text_content
    });
    if (improved) {
      setFormData(prev => ({ ...prev, text_content: improved }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">
            {lesson?.id ? 'Lektion bearbeiten' : 'Neue Lektion'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('content')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'content' 
                ? 'border-primary-500 text-primary-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Inhalt
          </button>
          <button
            onClick={() => setActiveTab('homework')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'homework' 
                ? 'border-primary-500 text-primary-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Hausaufgaben
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'content' ? (
            <>
              {/* Titel & Slug */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titel *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="z.B. Einführung in das arabische Alphabet"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL-Slug</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="wird automatisch generiert"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {slugManuallyChanged ? '✏️ Manuell angepasst' : '🔄 Automatisch vom Titel'}
                  </p>
                </div>
              </div>

              {/* Kurzbeschreibung */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700">Kurzbeschreibung</label>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!formData.title) return alert('Bitte zuerst Titel eingeben');
                      const text = await generate('lesson_description', { title: formData.title, courseTitle });
                      if (text) setFormData(prev => ({ ...prev, description: text }));
                    }}
                    disabled={generating === 'lesson_description'}
                    className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 disabled:opacity-50"
                  >
                    {generating === 'lesson_description' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    KI generieren
                  </button>
                </div>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  placeholder="Kurze Beschreibung der Lektion..."
                />
              </div>

              {/* Content-Typ Auswahl */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Inhaltstyp</label>
                <div className="grid grid-cols-4 gap-2">
                  {CONTENT_TYPES.map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, content_type: type.value }))}
                      className={`p-3 rounded-lg border-2 text-center transition-all ${
                        formData.content_type === type.value 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <type.icon className={`w-5 h-5 mx-auto mb-1 ${
                        formData.content_type === type.value ? 'text-primary-600' : 'text-gray-400'
                      }`} />
                      <span className={`text-xs font-medium ${
                        formData.content_type === type.value ? 'text-primary-600' : 'text-gray-600'
                      }`}>{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Video-Bereich */}
              {(formData.content_type === 'video' || formData.content_type === 'mixed') && (
                <div className="space-y-3 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Video className="w-4 h-4" />
                    <span className="text-sm font-medium">Video</span>
                  </div>
                  <input
                    type="url"
                    value={formData.vimeo_video_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, vimeo_video_url: e.target.value }))}
                    placeholder="https://vimeo.com/123456789"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-blue-600">
                    Unterstützte Formate: vimeo.com/123, player.vimeo.com/video/123, vimeo.com/manage/videos/123
                  </p>
                  {/* Video-Vorschau */}
                  {formData.vimeo_video_url && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-600 mb-2">📺 Video-Vorschau:</p>
                      <div className="rounded-lg overflow-hidden border border-blue-200">
                        <VimeoPlayer 
                          videoUrl={formData.vimeo_video_url}
                          title="Vorschau"
                          className="max-h-[250px]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Text-Bereich */}
              {(formData.content_type === 'text' || formData.content_type === 'mixed') && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-700">
                    <FileText className="w-4 h-4" />
                    <span className="text-sm font-medium">Text-Inhalt</span>
                  </div>
                  <TiptapEditor
                    value={formData.text_content}
                    onChange={(val) => setFormData(prev => ({ ...prev, text_content: val }))}
                    onAIGenerate={handleAIImproveText}
                    generating={generating === 'lesson_description'}
                    placeholder="Lektion-Inhalt hier eingeben..."
                    minHeight="250px"
                    maxHeight="400px"
                  />
                </div>
              )}

              {/* PDF-Bereich */}
              {(formData.content_type === 'pdf' || formData.content_type === 'mixed') && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-700">
                    <File className="w-4 h-4" />
                    <span className="text-sm font-medium">PDF-Datei</span>
                  </div>
                  <PDFUpload
                    pdfUrl={formData.pdf_url}
                    pdfName={formData.pdf_name}
                    onUpload={(url, name) => setFormData(prev => ({ ...prev, pdf_url: url, pdf_name: name }))}
                    onRemove={() => setFormData(prev => ({ ...prev, pdf_url: '', pdf_name: '' }))}
                  />
                </div>
              )}

              {/* Einstellungen */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reihenfolge</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.order}
                    onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_free_preview}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_free_preview: e.target.checked }))}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm">Kostenlose Vorschau</span>
                  </label>
                </div>
              </div>
            </>
          ) : (
            /* Hausaufgaben Tab */
            <HomeworkSection
              lessonId={lesson?.id}
              homework={homework}
              onSave={(hw) => {
                if (hw.id) {
                  setHomework(prev => prev.map(h => h.id === hw.id ? hw : h));
                } else {
                  setHomework(prev => [...prev, { ...hw, id: `temp-${Date.now()}` }]);
                }
              }}
              onDelete={(id) => setHomework(prev => prev.filter(h => h.id !== id))}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            Abbrechen
          </button>
          <button 
            onClick={handleSave} 
            disabled={saving || !formData.title.trim()}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
}

// =========================================
// Lektion Zeile (mit Hausaufgaben-Badge)
// =========================================
function LessonRow({ 
  lesson, 
  index,
  onEdit, 
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast
}: { 
  lesson: Lesson;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const hasHomework = lesson.has_homework || (lesson.homework && lesson.homework.length > 0);
  
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg group transition-colors ${
      hasHomework 
        ? 'bg-gradient-to-r from-gray-50 to-amber-50/50 hover:from-gray-100 hover:to-amber-100/50 border-l-4 border-l-amber-400' 
        : 'bg-gray-50 hover:bg-gray-100'
    }`}>
      {/* Drag Handle + Order */}
      <div className="flex items-center gap-2">
        <div className="flex flex-col">
          <button 
            onClick={onMoveUp} 
            disabled={isFirst}
            className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button 
            onClick={onMoveDown} 
            disabled={isLast}
            className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
          <span className="text-sm font-medium text-primary-600">{index + 1}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-medium text-gray-900 truncate">{lesson.title}</h4>
          {lesson.is_free_preview && (
            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">Frei</span>
          )}
          {/* Hausaufgaben-Badge */}
          {hasHomework && (
            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
              📝 Hausaufgabe
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
          {lesson.vimeo_video_url && (
            <span className="flex items-center gap-1">
              <Play className="w-3 h-3" />
              Video
            </span>
          )}
          {/* Content-Typ Anzeige */}
          {lesson.content_type && lesson.content_type !== 'video' && (
            <span className="flex items-center gap-1 text-gray-400">
              {lesson.content_type === 'text' && <><FileText className="w-3 h-3" /> Text</>}
              {lesson.content_type === 'pdf' && <><File className="w-3 h-3" /> PDF</>}
              {lesson.content_type === 'mixed' && <><Layers className="w-3 h-3" /> Mixed</>}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="p-2 hover:bg-white rounded-lg text-gray-500 hover:text-primary-500">
          <Edit className="w-4 h-4" />
        </button>
        <button onClick={onDelete} className="p-2 hover:bg-white rounded-lg text-gray-500 hover:text-red-500">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// =========================================
// Hauptseite
// =========================================
export default function KursEditorPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const toast = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null | 'new'>(null);

  // Thumbnail State
  const [thumbnail, setThumbnail] = useState<{ url: string } | null>(null);
  
  // Track ob der Slug manuell geändert wurde
  const [courseSlugManuallyChanged, setCourseSlugManuallyChanged] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    short_description: '',
    preview_video_url: '',
    category: 'arabic',
    level: 'beginner',
    price: 0,
    price_type: 'one_time',
    course_type: 'course',
    duration_weeks: 0,
    session_type: 'online',
    default_location_id: '',
    is_active: false,
    is_featured: false,
    is_published: false,
  });
  
  // Standorte laden
  const [locations, setLocations] = useState<{id: string; name: string; is_online: boolean}[]>([]);
  
  // Slug generieren Funktion
  const generateCourseSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[äÄ]/g, 'ae')
      .replace(/[öÖ]/g, 'oe')
      .replace(/[üÜ]/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  // Kurs-Titel ändern und Slug automatisch generieren
  const handleCourseTitleChange = (newTitle: string) => {
    setFormData(prev => ({
      ...prev,
      title: newTitle,
      slug: courseSlugManuallyChanged ? prev.slug : generateCourseSlug(newTitle)
    }));
  };

  // Kurs-Slug manuell ändern
  const handleCourseSlugChange = (newSlug: string) => {
    setCourseSlugManuallyChanged(true);
    setFormData(prev => ({ ...prev, slug: newSlug }));
  };

  // Bild hochladen
  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Nur Bilder sind erlaubt (JPG, PNG, WebP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Bild zu groß (max. 5MB)');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload fehlgeschlagen');
      }

      const data = await res.json();
      setThumbnail({ url: data.url });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Kurs laden (über lokale API-Route)
  useEffect(() => {
    async function loadCourse() {
      try {
        const res = await fetch(`/api/admin/courses/${params.id}`, { cache: 'no-store' });
        const data = await res.json();
        
        // FastAPI gibt das Objekt direkt zurück oder in data.data (für Kompatibilität)
        const courseData = data.data || data;
        
        if (courseData && courseData.id) {
          setCourse(courseData);
          // Wenn Kurs bereits einen Slug hat, als manuell geändert markieren
          if (courseData.slug) {
            setCourseSlugManuallyChanged(true);
          }
          setFormData({
            title: courseData.title || '',
            slug: courseData.slug || '',
            description: courseData.description || '',
            short_description: courseData.short_description || '',
            preview_video_url: courseData.preview_video_url || '',
            category: courseData.category || 'arabic',
            level: courseData.level || 'beginner',
            price: courseData.price || 0,
            price_type: courseData.price_type || 'one_time',
            course_type: courseData.course_type || 'course',
            duration_weeks: courseData.duration_weeks || 0,
            session_type: courseData.session_type || 'online',
            default_location_id: courseData.default_location_id || '',
            is_active: courseData.is_active || false,
            is_featured: courseData.is_featured || false,
            is_published: courseData.is_published || false,
          });
          // FastAPI gibt lessons direkt als Array zurück
          // Filtere ungültige Einträge heraus und stelle sicher, dass alle Lessons gültig sind
          const validLessons = (courseData.lessons || []).filter(
            (lesson: any) => lesson && lesson.id
          );
          setLessons(validLessons);
          
          // Thumbnail laden falls vorhanden
          if (courseData.thumbnail_url) {
            setThumbnail({
              url: courseData.thumbnail_url,
            });
          }
        }
      } catch (err) {
        console.error('Error loading course:', err);
        setError('Kurs konnte nicht geladen werden');
      } finally {
        setLoading(false);
      }
    }
    loadCourse();
  }, [params.id]);

  // Standorte laden
  useEffect(() => {
    async function loadLocations() {
      try {
        const res = await fetch('/api/admin/locations');
        const data = await res.json();
        setLocations(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error loading locations:', err);
      }
    }
    loadLocations();
  }, []);

  // Kurs speichern (über lokale API-Route)
  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Bitte gib einen Kurs-Titel ein');
      return;
    }
    
    setSaving(true);
    setError(null);

    try {
      // Daten mit Thumbnail-URL und generiertem Slug zusammenstellen
      const courseData = {
        ...formData,
        slug: formData.slug || generateCourseSlug(formData.title),
        thumbnail_url: thumbnail?.url || null,
      };

      const res = await fetch(`/api/admin/courses/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData),
      });

      if (!res.ok) throw new Error('Fehler beim Speichern');
      
      setError(null);
      toast.success('✅ Kurs erfolgreich gespeichert!');
    } catch (err: any) {
      setError(err.message);
      toast.error('❌ Fehler beim Speichern des Kurses');
    } finally {
      setSaving(false);
    }
  };

  // Lektion löschen
  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Lektion wirklich löschen?')) return;

    try {
      await fetch(`/api/admin/lessons/${lessonId}`, { method: 'DELETE' });
      setLessons(lessons.filter(l => l.id !== lessonId));
    } catch (err) {
      console.error('Error deleting lesson:', err);
    }
  };

  // Lektion verschieben
  const handleMoveLesson = async (index: number, direction: 'up' | 'down') => {
    const newLessons = [...lessons];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    [newLessons[index], newLessons[targetIndex]] = [newLessons[targetIndex], newLessons[index]];
    
    // Update order via API-Route
    for (let i = 0; i < newLessons.length; i++) {
      const lesson = newLessons[i];
      if (lesson.id) {
        fetch(`/api/admin/lessons/${lesson.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: i + 1 }),
        });
      }
    }
    
    setLessons(newLessons);
  };

  // Lektion gespeichert
  const handleLessonSaved = (savedLesson: Lesson) => {
    const existingIndex = lessons.findIndex(l => l.id === savedLesson.id);
    if (existingIndex >= 0) {
      const newLessons = [...lessons];
      newLessons[existingIndex] = savedLesson;
      setLessons(newLessons);
    } else {
      setLessons([...lessons, savedLesson]);
    }
    setEditingLesson(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Kurs nicht gefunden</p>
        <Link href="/admin/kurse" className="text-primary-500 hover:underline mt-2 inline-block">
          Zurück zur Übersicht
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/kurse" className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kurs bearbeiten</h1>
            <p className="text-gray-500 text-sm">{formData.title || 'Unbenannt'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/kurse/${formData.slug}`}
            target="_blank"
            className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Vorschau
          </Link>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="px-4 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Speichern
          </button>
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Kurs Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Kursdaten</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titel *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleCourseTitleChange(e.target.value)}
                placeholder="z.B. Arabisch für Anfänger"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL-Slug</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => handleCourseSlugChange(e.target.value)}
                placeholder="wird automatisch generiert"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                {courseSlugManuallyChanged ? '✏️ Manuell angepasst' : '🔄 Automatisch vom Titel'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vorschau-Video (Vimeo Link)</label>
              <input
                type="url"
                value={formData.preview_video_url}
                onChange={(e) => setFormData(prev => ({ ...prev, preview_video_url: e.target.value }))}
                placeholder="https://vimeo.com/123456789"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Unterstützte Formate: vimeo.com/123, player.vimeo.com/video/123, vimeo.com/manage/videos/123
              </p>
              {/* Video-Vorschau für Kurs */}
              {formData.preview_video_url && (
                <div className="mt-3">
                  <p className="text-xs text-gray-600 mb-2">📺 Video-Vorschau:</p>
                  <div className="rounded-lg overflow-hidden border border-gray-200">
                    <VimeoPlayer 
                      videoUrl={formData.preview_video_url}
                      title="Kurs-Vorschau"
                      className="max-h-[200px]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Kursbild (Thumbnail) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kursbild (Thumbnail)</label>
              <p className="text-xs text-gray-500 mb-2">Empfohlen: <strong>1280 × 720 px</strong> (16:9)</p>
              
              {thumbnail ? (
                <div className="relative inline-block">
                  <img 
                    src={thumbnail.url}
                    alt="Kursbild" 
                    className="w-48 h-27 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => setThumbnail(null)}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors cursor-pointer"
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    className="hidden"
                    id="thumbnail-upload-edit"
                  />
                  <label htmlFor="thumbnail-upload-edit" className="cursor-pointer">
                    {uploading ? (
                      <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto" />
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <ImagePlus className="w-8 h-8 text-gray-400" />
                        <span className="text-xs text-gray-500">Bild hochladen</span>
                      </div>
                    )}
                  </label>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white"
                >
                  <option value="arabic">Arabisch</option>
                  <option value="islamic">Islamisch</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white"
                >
                  <option value="beginner">Anfänger</option>
                  <option value="intermediate">Fortgeschritten</option>
                  <option value="advanced">Experte</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preis (EUR)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dauer (Wochen)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.duration_weeks}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration_weeks: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
                />
              </div>
            </div>

            {/* Unterrichtsart & Standort */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">📍 Unterrichtsart</label>
                <select
                  value={formData.session_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, session_type: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
                >
                  <option value="online">🌐 Online (Zoom)</option>
                  <option value="onsite">🏢 Vor Ort</option>
                  <option value="hybrid">🔄 Hybrid (Online + Vor Ort)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Standort</label>
                <select
                  value={formData.default_location_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, default_location_id: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
                  disabled={formData.session_type === 'online'}
                >
                  <option value="">Kein Standort</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
                {formData.session_type === 'online' && (
                  <p className="text-xs text-gray-500 mt-1">Bei Online nicht erforderlich</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-6 pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_published}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
                  className="w-4 h-4 rounded border-green-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm font-medium text-green-700">✅ Veröffentlicht</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm">Aktiv</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                  className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm">⭐ Hervorgehoben (Startseite)</span>
              </label>
            </div>
            
            {/* Hinweis zur Veröffentlichung */}
            {!formData.is_published && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ <strong>Hinweis:</strong> Der Kurs ist noch nicht veröffentlicht und wird nicht auf der Webseite angezeigt. 
                  Aktivieren Sie "Veröffentlicht", um den Kurs sichtbar zu machen.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Lektionen */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 sticky top-20">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Lektionen ({lessons.length})</h2>
              <button
                onClick={() => setEditingLesson('new')}
                className="p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
              {lessons.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">Noch keine Lektionen</p>
                  <button
                    onClick={() => setEditingLesson('new')}
                    className="text-primary-500 text-sm hover:underline mt-2"
                  >
                    Erste Lektion hinzufügen
                  </button>
                </div>
              ) : (
                lessons.map((lesson, index) => (
                  <LessonRow
                    key={lesson.id || `lesson-${index}`}
                    lesson={lesson}
                    index={index}
                    onEdit={() => setEditingLesson(lesson)}
                    onDelete={() => lesson.id && handleDeleteLesson(String(lesson.id))}
                    onMoveUp={() => handleMoveLesson(index, 'up')}
                    onMoveDown={() => handleMoveLesson(index, 'down')}
                    isFirst={index === 0}
                    isLast={index === lessons.length - 1}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lesson Modal */}
      {editingLesson && (
        <LessonModal
          lesson={editingLesson === 'new' ? null : editingLesson}
          onSave={handleLessonSaved}
          onClose={() => setEditingLesson(null)}
          courseId={params.id}
          nextOrder={lessons.length + 1}
          courseTitle={formData.title}
        />
      )}
    </div>
  );
}
