'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Languages, 
  Save, 
  BookOpen,
  Tag,
  Plus,
  Trash2,
  Sparkles,
  RefreshCw,
  Check,
  X,
  Edit2,
  ChevronDown,
  ChevronUp,
  Wand2,
  AlertCircle,
  Zap,
  Link2,
} from 'lucide-react';
import { useToast } from '@/components/Toast';

// =========================================
// Types & Constants
// =========================================
const WORD_TYPES = [
  { value: 'noun', label: 'Nomen (اسم)', arabic: 'اسم', description: 'Substantive: Haus, Auto, Buch', color: 'from-blue-500 to-indigo-500', icon: '📦' },
  { value: 'verb', label: 'Verben (فعل)', arabic: 'فعل', description: 'كَتَبَ – يَكْتُبُ (schreiben)', color: 'from-amber-500 to-orange-500', icon: '⚡' },
  { value: 'particle', label: 'Partikel (حرف)', arabic: 'حرف', description: 'Präpositionen, Konjunktionen', color: 'from-purple-500 to-pink-500', icon: '🔗' },
];

// Nomen-Kategorien
const NOUN_CATEGORIES = [
  { value: 'family', label: 'Familie', arabic: 'عائلة' },
  { value: 'school', label: 'Schule & Bildung', arabic: 'مدرسة' },
  { value: 'food', label: 'Essen & Trinken', arabic: 'طعام وشراب' },
  { value: 'colors', label: 'Farben', arabic: 'ألوان' },
  { value: 'body', label: 'Körper', arabic: 'جسم' },
  { value: 'clothes', label: 'Kleidung', arabic: 'ملابس' },
  { value: 'house', label: 'Haus & Wohnung', arabic: 'بيت' },
  { value: 'nature', label: 'Natur', arabic: 'طبيعة' },
  { value: 'animals', label: 'Tiere', arabic: 'حيوانات' },
  { value: 'time', label: 'Zeit', arabic: 'وقت' },
  { value: 'religion', label: 'Religion', arabic: 'دين' },
  { value: 'adjectives', label: 'Adjektive', arabic: 'صفات' },
  { value: 'general', label: 'Allgemein', arabic: 'عام' },
];

// Verb-Kategorien (nach Muster)
const VERB_CATEGORIES = [
  { value: 'pattern_fataha', label: 'Muster فَتَحَ – يَفْتَحُ', arabic: 'فَتَحَ', group: 'Grundmuster' },
  { value: 'pattern_nasara', label: 'Muster نَصَرَ – يَنْصُرُ', arabic: 'نَصَرَ', group: 'Grundmuster' },
  { value: 'pattern_daraba', label: 'Muster ضَرَبَ – يَضْرِبُ', arabic: 'ضَرَبَ', group: 'Grundmuster' },
  { value: 'derived_ii', label: 'Form II فَعَّلَ', arabic: 'فَعَّلَ', group: 'Abgeleitet' },
  { value: 'derived_iii', label: 'Form III فَاعَلَ', arabic: 'فَاعَلَ', group: 'Abgeleitet' },
  { value: 'derived_iv', label: 'Form IV أَفْعَلَ', arabic: 'أَفْعَلَ', group: 'Abgeleitet' },
  { value: 'derived_v', label: 'Form V تَفَعَّلَ', arabic: 'تَفَعَّلَ', group: 'Abgeleitet' },
  { value: 'derived_vi', label: 'Form VI تَفَاعَلَ', arabic: 'تَفَاعَلَ', group: 'Abgeleitet' },
  { value: 'derived_vii', label: 'Form VII اِنْفَعَلَ', arabic: 'اِنْفَعَلَ', group: 'Abgeleitet' },
  { value: 'derived_viii', label: 'Form VIII اِفْتَعَلَ', arabic: 'اِفْتَعَلَ', group: 'Abgeleitet' },
  { value: 'derived_x', label: 'Form X اِسْتَفْعَلَ', arabic: 'اِسْتَفْعَلَ', group: 'Abgeleitet' },
  { value: 'daily', label: 'Alltag', arabic: 'يومي', group: 'Thema' },
  { value: 'general_verbs', label: 'Allgemein', arabic: 'عام', group: 'Thema' },
];

// Partikel-Kategorien
const PARTICLE_CATEGORIES = [
  { value: 'prepositions', label: 'Präpositionen (حروف الجر)', arabic: 'حروف الجر' },
  { value: 'conjunctions', label: 'Konjunktionen (حروف العطف)', arabic: 'حروف العطف' },
  { value: 'negation', label: 'Verneinung', arabic: 'حروف النفي' },
  { value: 'interrogative', label: 'Fragepartikel', arabic: 'أدوات الاستفهام' },
  { value: 'demonstrative', label: 'Demonstrativpronomen', arabic: 'أسماء الإشارة' },
  { value: 'general', label: 'Allgemein', arabic: 'عام' },
];

const LEVELS = [
  { value: 'a1', label: 'A1 - Anfänger' },
  { value: 'a2', label: 'A2 - Grundlagen' },
  { value: 'b1', label: 'B1 - Mittelstufe' },
  { value: 'b2', label: 'B2 - Fortgeschritten' },
];

interface VocabularyItem {
  id: string;
  // Für alle Wortarten
  arabic: string;           // Haupteintrag (bei Verben: كَتَبَ – يَكْتُبُ)
  german: string;           // Übersetzung
  // Verb-spezifisch
  past_tense?: string;      // Vergangenheit (كَتَبَ)
  present_tense?: string;   // Gegenwart (يَكْتُبُ)
  root?: string;            // Wurzel (ك ت ب)
  // Nomen-spezifisch
  gender?: string;          // m/f
  plural?: string;          // Plural
  // Allgemein
  example_arabic?: string;
  example_german?: string;
  notes?: string;
  isEditing?: boolean;
  isNew?: boolean;
}

interface FormData {
  title: string;
  title_arabic: string;
  slug: string;
  description: string;
  word_type: string;
  subcategory: string;
  level: string;
  tags: string[];
}

// =========================================
// Helper
// =========================================
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function generateId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// =========================================
// Component
// =========================================
export default function NewVocabularyListPage() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState<FormData>({
    title: '',
    title_arabic: '',
    slug: '',
    description: '',
    word_type: 'noun',
    subcategory: 'general',
    level: 'a1',
    tags: [],
  });
  
  const [vocabularyItems, setVocabularyItems] = useState<VocabularyItem[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  
  // KI-Generierung
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState(10);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  
  // UI State
  const [saving, setSaving] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [step, setStep] = useState(1);

  // =========================================
  // Form Handlers
  // =========================================
  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: slugManuallyEdited ? prev.slug : generateSlug(title),
    }));
  };

  // =========================================
  // Vokabel Handlers
  // =========================================
  const addNewVocabularyItem = () => {
    const newItem: VocabularyItem = {
      id: generateId(),
      arabic: '',
      german: '',
      past_tense: '',
      present_tense: '',
      root: '',
      gender: '',
      plural: '',
      example_arabic: '',
      example_german: '',
      notes: '',
      isNew: true,
      isEditing: true,
    };
    setVocabularyItems([...vocabularyItems, newItem]);
    setEditingItemId(newItem.id);
  };

  const updateVocabularyItem = (id: string, updates: Partial<VocabularyItem>) => {
    setVocabularyItems(items => 
      items.map(item => {
        if (item.id !== id) return item;
        const updated = { ...item, ...updates };
        
        // Bei Verben: arabic automatisch aus past + present generieren
        if (formData.word_type === 'verb' && (updates.past_tense || updates.present_tense)) {
          const past = updates.past_tense ?? item.past_tense ?? '';
          const present = updates.present_tense ?? item.present_tense ?? '';
          if (past && present) {
            updated.arabic = `${past} – ${present}`;
          } else if (past) {
            updated.arabic = past;
          } else if (present) {
            updated.arabic = present;
          }
        }
        
        return updated;
      })
    );
  };

  const deleteVocabularyItem = (id: string) => {
    setVocabularyItems(items => items.filter(item => item.id !== id));
    if (editingItemId === id) setEditingItemId(null);
  };

  const confirmVocabularyItem = (id: string) => {
    const item = vocabularyItems.find(v => v.id === id);
    if (!item?.arabic.trim() || !item?.german.trim()) {
      showToast('Arabisch und Deutsch sind erforderlich', 'error');
      return;
    }
    updateVocabularyItem(id, { isEditing: false, isNew: false });
    setEditingItemId(null);
  };

  // =========================================
  // KI-Generierung
  // =========================================
  const generateWithAI = async () => {
    if (!aiTopic.trim()) {
      showToast('Bitte gib ein Thema ein', 'error');
      return;
    }

    setAiGenerating(true);
    try {
      const existingWords = vocabularyItems
        .filter(v => v.arabic.trim())
        .map(v => `${v.arabic} = ${v.german}`)
        .join(', ');
      
      console.log('🤖 Starte KI-Generierung...', { topic: aiTopic, word_type: formData.word_type, count: aiCount });
      
      const res = await fetch('/api/vocabulary/admin/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic,
          word_type: formData.word_type,
          subcategory: formData.subcategory,
          level: formData.level,
          count: aiCount,
          additional_context: existingWords 
            ? `Bereits vorhanden (nicht wiederholen): ${existingWords}. Bei Verben Format: Vergangenheit – Gegenwart (3. Person Singular maskulin)` 
            : 'Bei Verben Format: Vergangenheit – Gegenwart (3. Person Singular maskulin)',
        }),
      });

      console.log('📥 API Response Status:', res.status);

      if (!res.ok) {
        const error = await res.json();
        console.error('❌ API Error:', error);
        
        if (res.status === 401) {
          throw new Error('Du musst eingeloggt sein, um KI-Funktionen zu nutzen. Bitte melde dich an.');
        }
        throw new Error(error.detail || 'KI-Generierung fehlgeschlagen');
      }

      const generated = await res.json();
      console.log('✅ Generierte Vokabeln:', generated);
      
      if (!Array.isArray(generated) || generated.length === 0) {
        throw new Error('Keine Vokabeln generiert. Bitte versuche es mit einem anderen Thema.');
      }
      
      const newItems: VocabularyItem[] = generated.map((item: any) => ({
        id: generateId(),
        arabic: item.arabic || '',
        german: item.german || '',
        past_tense: item.past_tense || '',
        present_tense: item.present_tense || '',
        root: item.root || '',
        gender: item.gender || '',
        plural: item.plural || '',
        example_arabic: item.example_arabic || '',
        example_german: item.example_german || '',
        notes: item.notes || '',
        isNew: true,
        isEditing: false,
      }));

      setVocabularyItems([...vocabularyItems, ...newItems]);
      setAiTopic('');
      showToast(`${newItems.length} Vokabeln generiert!`, 'success');
      
    } catch (error) {
      console.error('❌ KI-Generierung Fehler:', error);
      showToast((error as Error).message, 'error');
    } finally {
      setAiGenerating(false);
    }
  };

  // =========================================
  // Submit
  // =========================================
  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      showToast('Bitte gib einen Titel ein', 'error');
      return;
    }

    const validItems = vocabularyItems.filter(v => v.arabic.trim() && v.german.trim());

    setSaving(true);
    try {
      const listPayload: any = {
        title: formData.title,
        title_arabic: formData.title_arabic || null,
        slug: formData.slug || undefined,
        description: formData.description || null,
        word_type: formData.word_type,
        level: formData.level,
        tags: formData.tags,
      };

      // Unterkategorie basierend auf Wortart
      if (formData.word_type === 'noun') {
        listPayload.noun_category = formData.subcategory;
      } else if (formData.word_type === 'verb') {
        listPayload.verb_category = formData.subcategory;
      } else if (formData.word_type === 'particle') {
        listPayload.particle_category = formData.subcategory;
      }

      const listRes = await fetch('/api/vocabulary/admin/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listPayload),
      });

      if (!listRes.ok) {
        const error = await listRes.json();
        throw new Error(error.detail || 'Fehler beim Erstellen der Liste');
      }

      const createdList = await listRes.json();

      // Vokabeln hinzufügen
      if (validItems.length > 0) {
        const itemsPayload = validItems.map((item, i) => ({
          arabic: item.arabic,
          german: item.german,
          past_tense: item.past_tense || null,
          present_tense: item.present_tense || null,
          root: item.root || null,
          gender: item.gender || null,
          plural: item.plural || null,
          example_arabic: item.example_arabic || null,
          example_german: item.example_german || null,
          notes: item.notes || null,
          order: i,
        }));

        await fetch(`/api/vocabulary/admin/lists/${createdList.id}/items/bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemsPayload),
        });
      }

      showToast(`Vokabelliste erstellt! ${validItems.length} Vokabeln wurden hinzugefügt.`, 'success');
      router.push(`/admin/vokabeln/${createdList.id}`);
      
    } catch (error) {
      showToast((error as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // =========================================
  // Helpers
  // =========================================
  const getSubcategories = () => {
    switch (formData.word_type) {
      case 'noun': return NOUN_CATEGORIES;
      case 'verb': return VERB_CATEGORIES;
      case 'particle': return PARTICLE_CATEGORIES;
      default: return [];
    }
  };

  const getWordTypeInfo = () => WORD_TYPES.find(t => t.value === formData.word_type);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getWordTypeInfo()?.color || 'from-amber-400 to-orange-500'} flex items-center justify-center text-xl`}>
                {getWordTypeInfo()?.icon || '📚'}
              </div>
              
              <div>
                <h1 className="text-xl font-bold text-white">
                  {formData.title || 'Neue Vokabelliste'}
                </h1>
                <p className="text-sm text-slate-400">
                  {step === 1 ? 'Schritt 1: Grunddaten' : `Schritt 2: Vokabeln (${vocabularyItems.length})`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 mr-4">
                <button
                  onClick={() => setStep(1)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    step === 1 ? 'bg-amber-500 text-white' : 'bg-white/10 text-slate-400 hover:bg-white/20'
                  }`}
                >
                  1
                </button>
                <div className="w-8 h-0.5 bg-white/10" />
                <button
                  onClick={() => formData.title.trim() && setStep(2)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    step === 2 ? 'bg-amber-500 text-white' : 'bg-white/10 text-slate-400 hover:bg-white/20'
                  } ${!formData.title.trim() && 'opacity-50 cursor-not-allowed'}`}
                >
                  2
                </button>
              </div>

              {step === 2 && (
                <button
                  onClick={handleSubmit}
                  disabled={saving || !formData.title.trim()}
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/25 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Speichern...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Speichern ({vocabularyItems.filter(v => v.arabic && v.german).length})
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* =========================================
           STEP 1: GRUNDDATEN
        ========================================= */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Wortart */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5 text-amber-400" />
                Wortart wählen
              </h2>
              
              <div className="grid grid-cols-3 gap-4">
                {WORD_TYPES.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ 
                      ...prev, 
                      word_type: type.value,
                      subcategory: type.value === 'noun' ? 'general' : type.value === 'verb' ? 'general_verbs' : 'general'
                    }))}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      formData.word_type === type.value
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-white/10 hover:border-white/20 bg-white/5'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${type.color} flex items-center justify-center mb-3 text-2xl`}>
                      {type.icon}
                    </div>
                    <p className="font-semibold text-white">{type.label}</p>
                    <p className="text-xs text-slate-400 mt-1">{type.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Unterkategorie */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                Kategorie / Muster
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                {getSubcategories().map((cat: any) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, subcategory: cat.value }))}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      formData.subcategory === cat.value
                        ? 'border-amber-500 bg-amber-500/20 text-amber-400'
                        : 'border-white/10 hover:border-white/20 text-slate-300'
                    }`}
                  >
                    <p className="font-medium text-sm truncate">{cat.label}</p>
                    <p className="text-xs text-slate-500 font-arabic truncate" dir="rtl">{cat.arabic}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Titel & Details */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Grundinformationen</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Titel (Deutsch) *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="z.B. Verben Lektion 1"
                      className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Titel (Arabisch)</label>
                    <input
                      type="text"
                      value={formData.title_arabic}
                      onChange={(e) => setFormData(prev => ({ ...prev, title_arabic: e.target.value }))}
                      placeholder="أفعال الدرس الأول"
                      className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 text-right font-arabic"
                      dir="rtl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Sprachniveau</label>
                    <select
                      value={formData.level}
                      onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500/50"
                    >
                      {LEVELS.map(level => (
                        <option key={level.value} value={level.value}>{level.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">URL-Slug</label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => {
                        setSlugManuallyEdited(true);
                        setFormData(prev => ({ ...prev, slug: e.target.value }));
                      }}
                      placeholder="verben-lektion-1"
                      className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 font-mono text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Beschreibung</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Kurze Beschreibung der Vokabelliste..."
                    rows={2}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => formData.title.trim() && setStep(2)}
                disabled={!formData.title.trim()}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/25 disabled:opacity-50"
              >
                Weiter zu Vokabeln
                <ChevronDown className="w-5 h-5 rotate-[-90deg]" />
              </button>
            </div>
          </div>
        )}

        {/* =========================================
           STEP 2: VOKABELN
        ========================================= */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Info-Box für Verb-Format */}
            {formData.word_type === 'verb' && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                <p className="text-amber-400 text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <strong>Verb-Format:</strong> Vergangenheit – Gegenwart (3. Person Singular maskulin)
                </p>
                <p className="text-amber-400/70 text-xs mt-1 font-arabic" dir="rtl">
                  مثال: كَتَبَ – يَكْتُبُ = schreiben
                </p>
              </div>
            )}

            {/* KI-Generierung */}
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl overflow-hidden">
              <button
                onClick={() => setShowAiPanel(!showAiPanel)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-white">Mit KI generieren</p>
                    <p className="text-sm text-slate-400">Anthropic Claude erstellt Vokabeln automatisch</p>
                  </div>
                </div>
                {showAiPanel ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </button>
              
              {showAiPanel && (
                <div className="px-6 pb-6 pt-2 border-t border-white/10">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Thema / Kontext</label>
                      <input
                        type="text"
                        value={aiTopic}
                        onChange={(e) => setAiTopic(e.target.value)}
                        placeholder={formData.word_type === 'verb' ? 'z.B. Alltag, Schule, Kommunikation...' : 'z.B. Familie, Essen, Farben...'}
                        className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
                      />
                    </div>
                    
                    {vocabularyItems.length > 0 && (
                      <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                        <p className="text-sm text-purple-300">
                          <AlertCircle className="w-4 h-4 inline mr-1" />
                          {vocabularyItems.length} vorhandene Vokabeln werden nicht wiederholt.
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4">
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">Anzahl</label>
                        <select
                          value={aiCount}
                          onChange={(e) => setAiCount(Number(e.target.value))}
                          className="px-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500/50"
                        >
                          {[5, 10, 15, 20].map(n => (
                            <option key={n} value={n}>{n} Vokabeln</option>
                          ))}
                        </select>
                      </div>
                      
                      <button
                        onClick={generateWithAI}
                        disabled={aiGenerating || !aiTopic.trim()}
                        className="flex-1 mt-6 flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 transition-all"
                      >
                        {aiGenerating ? (
                          <>
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            Generiere...
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-5 h-5" />
                            Generieren
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Vokabeln Liste */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Languages className="w-5 h-5 text-amber-400" />
                  Vokabeln ({vocabularyItems.length})
                </h2>
                <button
                  onClick={addNewVocabularyItem}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Hinzufügen
                </button>
              </div>

              <div className="space-y-3">
                {vocabularyItems.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-xl">
                    <Languages className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 mb-2">Noch keine Vokabeln</p>
                    <p className="text-sm text-slate-500">
                      Füge Vokabeln manuell hinzu oder lass sie von der KI generieren.
                    </p>
                  </div>
                ) : (
                  vocabularyItems.map((item, index) => (
                    <VocabularyItemRow
                      key={item.id}
                      item={item}
                      index={index}
                      wordType={formData.word_type}
                      isEditing={editingItemId === item.id || !!item.isEditing}
                      onUpdate={(updates) => updateVocabularyItem(item.id, updates)}
                      onDelete={() => deleteVocabularyItem(item.id)}
                      onEdit={() => {
                        setEditingItemId(item.id);
                        updateVocabularyItem(item.id, { isEditing: true });
                      }}
                      onConfirm={() => confirmVocabularyItem(item.id)}
                      onCancel={() => {
                        if (item.isNew && !item.arabic.trim()) {
                          deleteVocabularyItem(item.id);
                        } else {
                          updateVocabularyItem(item.id, { isEditing: false });
                          setEditingItemId(null);
                        }
                      }}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Zurück
              </button>

              <button
                onClick={handleSubmit}
                disabled={saving || !formData.title.trim()}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/25 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Speichern...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Liste speichern ({vocabularyItems.filter(v => v.arabic && v.german).length} Vokabeln)
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .font-arabic {
          font-family: 'Noto Sans Arabic', 'Amiri', sans-serif;
        }
      `}</style>
    </div>
  );
}

// =========================================
// Vokabel Row Component
// =========================================
function VocabularyItemRow({
  item,
  index,
  wordType,
  isEditing,
  onUpdate,
  onDelete,
  onEdit,
  onConfirm,
  onCancel,
}: {
  item: VocabularyItem;
  index: number;
  wordType: string;
  isEditing: boolean;
  onUpdate: (updates: Partial<VocabularyItem>) => void;
  onDelete: () => void;
  onEdit: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (isEditing) {
    return (
      <div className="bg-slate-800/50 border border-amber-500/30 rounded-xl p-4">
        {/* Verb-Eingabe */}
        {wordType === 'verb' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Vergangenheit (الماضي) *</label>
                <input
                  type="text"
                  value={item.past_tense || ''}
                  onChange={(e) => onUpdate({ past_tense: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white text-right text-lg font-arabic focus:outline-none focus:border-amber-500/50"
                  dir="rtl"
                  placeholder="كَتَبَ"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Gegenwart (المضارع) *</label>
                <input
                  type="text"
                  value={item.present_tense || ''}
                  onChange={(e) => onUpdate({ present_tense: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white text-right text-lg font-arabic focus:outline-none focus:border-amber-500/50"
                  dir="rtl"
                  placeholder="يَكْتُبُ"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Bedeutung (Deutsch) *</label>
                <input
                  type="text"
                  value={item.german}
                  onChange={(e) => onUpdate({ german: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-amber-500/50"
                  placeholder="schreiben"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Wurzel (جذر)</label>
                <input
                  type="text"
                  value={item.root || ''}
                  onChange={(e) => onUpdate({ root: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white text-right font-arabic focus:outline-none focus:border-amber-500/50"
                  dir="rtl"
                  placeholder="ك ت ب"
                />
              </div>
            </div>
            {/* Vorschau */}
            <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <p className="text-xs text-slate-400 mb-1">Vorschau:</p>
              <p className="text-amber-400 font-arabic text-lg" dir="rtl">
                {item.past_tense && item.present_tense 
                  ? `${item.past_tense} – ${item.present_tense}` 
                  : item.past_tense || item.present_tense || '...'
                } = {item.german || '...'}
              </p>
            </div>
          </div>
        ) : (
          /* Nomen/Partikel-Eingabe */
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Arabisch *</label>
                <input
                  type="text"
                  value={item.arabic}
                  onChange={(e) => onUpdate({ arabic: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white text-right text-lg font-arabic focus:outline-none focus:border-amber-500/50"
                  dir="rtl"
                  placeholder={wordType === 'noun' ? 'كِتَاب' : 'في'}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Deutsch *</label>
                <input
                  type="text"
                  value={item.german}
                  onChange={(e) => onUpdate({ german: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-amber-500/50"
                  placeholder={wordType === 'noun' ? 'Buch' : 'in'}
                />
              </div>
            </div>
            {wordType === 'noun' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Geschlecht</label>
                  <select
                    value={item.gender || ''}
                    onChange={(e) => onUpdate({ gender: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="">-</option>
                    <option value="m">مذكر (m)</option>
                    <option value="f">مؤنث (f)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Plural</label>
                  <input
                    type="text"
                    value={item.plural || ''}
                    onChange={(e) => onUpdate({ plural: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white text-right font-arabic focus:outline-none focus:border-amber-500/50"
                    dir="rtl"
                    placeholder="كُتُب"
                  />
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
          >
            <Check className="w-4 h-4" />
            Bestätigen
          </button>
        </div>
      </div>
    );
  }

  // Anzeige-Modus
  return (
    <div className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
      item.isNew ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-white/5 border border-white/10 hover:border-white/20'
    }`}>
      <span className="w-8 h-8 flex items-center justify-center text-slate-500 text-sm font-mono">
        {index + 1}
      </span>
      
      <div className="flex-1 grid grid-cols-2 gap-4">
        <div>
          <p className="text-lg text-white font-arabic text-right" dir="rtl">
            {item.arabic || <span className="text-slate-500">—</span>}
          </p>
          {wordType === 'verb' && item.root && (
            <p className="text-xs text-slate-500 font-arabic text-right" dir="rtl">جذر: {item.root}</p>
          )}
        </div>
        <div>
          <p className="text-white">{item.german || <span className="text-slate-500">—</span>}</p>
          {wordType === 'noun' && item.gender && (
            <span className="text-xs text-slate-500">{item.gender === 'm' ? 'maskulin' : 'feminin'}</span>
          )}
        </div>
      </div>
      
      {item.isNew && (
        <span className="px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded">NEU</span>
      )}
      
      <div className="flex items-center gap-1">
        <button
          onClick={onEdit}
          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
