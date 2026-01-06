'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Languages, 
  Save, 
  Sparkles, 
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Play,
  GripVertical,
  Wand2,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useToast } from '@/components/Toast';

// =========================================
// Types
// =========================================
interface VocabularyItem {
  id: string;
  arabic: string;
  arabic_voweled: string | null;
  transliteration: string | null;
  german: string;
  german_alternatives: string[];
  word_type: string | null;
  gender: string | null;
  plural: string | null;
  root: string | null;
  example_arabic: string | null;
  example_german: string | null;
  notes: string | null;
  difficulty: number;
  order: number;
  is_verified: boolean;
  ai_confidence: number | null;
}

interface VocabularyList {
  id: string;
  title: string;
  title_arabic: string | null;
  slug: string;
  description: string | null;
  word_type: string;
  noun_category: string | null;
  verb_category: string | null;
  particle_category: string | null;
  subcategory: string | null;
  level: string;
  tags: string[];
  is_published: boolean;
  is_ai_generated: boolean;
  is_ai_verified: boolean;
  item_count: number;
  items: VocabularyItem[];
}

const WORD_TYPE_INFO: Record<string, { label: string; arabic: string; color: string }> = {
  noun: { label: 'Nomen', arabic: 'اسماء', color: 'from-blue-500 to-indigo-500' },
  verb: { label: 'Verben', arabic: 'افعال', color: 'from-green-500 to-emerald-500' },
  particle: { label: 'Partikel', arabic: 'حروف', color: 'from-purple-500 to-pink-500' },
};

const LEVELS = [
  { value: 'a1', label: 'A1' },
  { value: 'a2', label: 'A2' },
  { value: 'b1', label: 'B1' },
  { value: 'b2', label: 'B2' },
  { value: 'c1', label: 'C1' },
  { value: 'c2', label: 'C2' },
];

const ITEM_WORD_TYPES = [
  { value: 'اسم', label: 'Nomen' },
  { value: 'فعل', label: 'Verb' },
  { value: 'حرف', label: 'Partikel' },
];

// =========================================
// Component
// =========================================
export default function VocabularyListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { showToast } = useToast();
  
  const [list, setList] = useState<VocabularyList | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Editing states
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<VocabularyItem>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState<Partial<VocabularyItem>>({
    arabic: '',
    german: '',
    difficulty: 1,
  });
  
  // AI states
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiVerifying, setAiVerifying] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState(10);
  const [showAiPanel, setShowAiPanel] = useState(false);
  
  // Expanded item details
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // =========================================
  // Data Loading
  // =========================================
  useEffect(() => {
    fetchList();
  }, [resolvedParams.id]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vocabulary/lists/${resolvedParams.id}`);
      if (res.ok) {
        const data = await res.json();
        setList(data);
      } else {
        throw new Error('Liste nicht gefunden');
      }
    } catch (error) {
      showToast('error', 'Fehler', 'Liste konnte nicht geladen werden');
      router.push('/admin/vokabeln');
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // List Actions
  // =========================================
  const updateList = async (updates: Partial<VocabularyList>) => {
    if (!list) return;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/vocabulary/admin/lists/${list.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      if (res.ok) {
        const updated = await res.json();
        setList(prev => prev ? { ...prev, ...updated } : null);
        showToast('success', 'Gespeichert');
      } else {
        throw new Error('Fehler beim Speichern');
      }
    } catch (error) {
      showToast('error', 'Fehler', (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = () => {
    if (list) {
      updateList({ is_published: !list.is_published });
    }
  };

  // =========================================
  // Item Actions
  // =========================================
  const addItem = async () => {
    if (!list || !newItem.arabic?.trim() || !newItem.german?.trim()) {
      showToast('error', 'Fehler', 'Arabisch und Deutsch sind erforderlich');
      return;
    }

    try {
      const res = await fetch(`/api/vocabulary/admin/lists/${list.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newItem,
          order: list.items.length,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setList(prev => prev ? {
          ...prev,
          items: [...prev.items, created],
          item_count: prev.item_count + 1,
        } : null);
        setNewItem({ arabic: '', german: '', difficulty: 1 });
        setShowAddForm(false);
        showToast('success', 'Vokabel hinzugefügt');
      }
    } catch (error) {
      showToast('error', 'Fehler', 'Vokabel konnte nicht hinzugefügt werden');
    }
  };

  const updateItem = async (itemId: string) => {
    try {
      const res = await fetch(`/api/vocabulary/admin/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        const updated = await res.json();
        setList(prev => prev ? {
          ...prev,
          items: prev.items.map(item => item.id === itemId ? updated : item),
        } : null);
        setEditingItem(null);
        setEditForm({});
        showToast('success', 'Vokabel aktualisiert');
      }
    } catch (error) {
      showToast('error', 'Fehler', 'Vokabel konnte nicht aktualisiert werden');
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!confirm('Diese Vokabel wirklich löschen?')) return;

    try {
      const res = await fetch(`/api/vocabulary/admin/items/${itemId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setList(prev => prev ? {
          ...prev,
          items: prev.items.filter(item => item.id !== itemId),
          item_count: prev.item_count - 1,
        } : null);
        showToast('success', 'Vokabel gelöscht');
      }
    } catch (error) {
      showToast('error', 'Fehler', 'Vokabel konnte nicht gelöscht werden');
    }
  };

  // =========================================
  // AI Actions
  // =========================================
  const generateWithAI = async () => {
    if (!list || !aiTopic.trim()) {
      showToast('error', 'Fehler', 'Bitte gib ein Thema ein');
      return;
    }

    setAiGenerating(true);
    try {
      const res = await fetch(`/api/vocabulary/admin/ai/generate-to-list/${list.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic,
          category: list.category,
          level: list.level,
          count: aiCount,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setList(updated);
        setAiTopic('');
        setShowAiPanel(false);
        showToast('success', `${aiCount} Vokabeln generiert!`, 'Die KI hat neue Vokabeln erstellt.');
      } else {
        const error = await res.json();
        throw new Error(error.detail || 'KI-Generierung fehlgeschlagen');
      }
    } catch (error) {
      showToast('error', 'KI-Fehler', (error as Error).message);
    } finally {
      setAiGenerating(false);
    }
  };

  const verifyWithAI = async () => {
    if (!list) return;

    setAiVerifying(true);
    try {
      const res = await fetch(`/api/vocabulary/admin/ai/verify-list/${list.id}`, {
        method: 'POST',
      });

      if (res.ok) {
        const result = await res.json();
        await fetchList(); // Refresh to get updated verification status
        showToast('success', 'Überprüfung abgeschlossen', 
          `${result.correct_count}/${result.verified_count} Vokabeln korrekt`);
      } else {
        throw new Error('Überprüfung fehlgeschlagen');
      }
    } catch (error) {
      showToast('error', 'KI-Fehler', (error as Error).message);
    } finally {
      setAiVerifying(false);
    }
  };

  // =========================================
  // Render
  // =========================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!list) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin/vokabeln')}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Languages className="w-5 h-5 text-white" />
              </div>
              
              <div>
                <h1 className="text-xl font-bold text-white">{list.title}</h1>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400">{list.item_count} Vokabeln</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400">{list.level.toUpperCase()}</span>
                  {list.is_ai_generated && (
                    <>
                      <span className="text-slate-600">•</span>
                      <span className="text-purple-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> KI-Generiert
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Publish Toggle */}
              <button
                onClick={togglePublish}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  list.is_published
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-slate-700/50 text-slate-400 border border-white/10'
                }`}
              >
                {list.is_published ? (
                  <><Eye className="w-4 h-4" /> Veröffentlicht</>
                ) : (
                  <><EyeOff className="w-4 h-4" /> Entwurf</>
                )}
              </button>
              
              {/* AI Verify Button */}
              <button
                onClick={verifyWithAI}
                disabled={aiVerifying || list.items.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {aiVerifying ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                KI-Prüfung
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Main Content - Vocabulary Items */}
          <div className="col-span-2 space-y-4">
            {/* AI Generate Panel */}
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
                        placeholder="z.B. Einkaufen im Supermarkt, Arztbesuch, Moschee..."
                        className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
                      />
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">Anzahl</label>
                        <select
                          value={aiCount}
                          onChange={(e) => setAiCount(Number(e.target.value))}
                          className="px-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500/50"
                        >
                          {[5, 10, 15, 20, 30].map(n => (
                            <option key={n} value={n}>{n} Vokabeln</option>
                          ))}
                        </select>
                      </div>
                      
                      <button
                        onClick={generateWithAI}
                        disabled={aiGenerating || !aiTopic.trim()}
                        className="flex-1 mt-6 flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {aiGenerating ? (
                          <>
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            Generiere...
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-5 h-5" />
                            Vokabeln generieren
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Add New Item Button */}
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl text-slate-400 hover:text-amber-400 hover:border-amber-500/30 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Vokabel hinzufügen
              </button>
            )}

            {/* Add Form */}
            {showAddForm && (
              <div className="bg-white/5 border border-amber-500/30 rounded-xl p-5">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-amber-400" />
                  Neue Vokabel
                </h3>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Arabisch *</label>
                    <input
                      type="text"
                      value={newItem.arabic || ''}
                      onChange={(e) => setNewItem(prev => ({ ...prev, arabic: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-white text-right text-xl font-arabic placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
                      dir="rtl"
                      placeholder="كتاب"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Deutsch *</label>
                    <input
                      type="text"
                      value={newItem.german || ''}
                      onChange={(e) => setNewItem(prev => ({ ...prev, german: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
                      placeholder="Buch"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Transliteration</label>
                    <input
                      type="text"
                      value={newItem.transliteration || ''}
                      onChange={(e) => setNewItem(prev => ({ ...prev, transliteration: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
                      placeholder="kitāb"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Wortart</label>
                    <select
                      value={newItem.word_type || ''}
                      onChange={(e) => setNewItem(prev => ({ ...prev, word_type: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-amber-500/50"
                    >
                      <option value="">Auswählen...</option>
                      {WORD_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setNewItem({ arabic: '', german: '', difficulty: 1 });
                    }}
                    className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={addItem}
                    disabled={!newItem.arabic?.trim() || !newItem.german?.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    Hinzufügen
                  </button>
                </div>
              </div>
            )}

            {/* Vocabulary Items List */}
            <div className="space-y-2">
              {list.items.map((item, index) => (
                <div
                  key={item.id}
                  className={`bg-white/5 border rounded-xl overflow-hidden transition-all ${
                    expandedItem === item.id ? 'border-amber-500/30' : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Item Header */}
                  <div 
                    className="flex items-center gap-4 p-4 cursor-pointer"
                    onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                  >
                    <span className="w-8 h-8 flex items-center justify-center text-slate-600 text-sm font-mono">
                      {index + 1}
                    </span>
                    
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xl text-white font-arabic text-right" dir="rtl">
                          {item.arabic_voweled || item.arabic}
                        </p>
                        {item.transliteration && (
                          <p className="text-sm text-slate-500 italic">{item.transliteration}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-lg text-white">{item.german}</p>
                        {item.word_type && (
                          <p className="text-sm text-slate-500">{item.word_type}</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Status indicators */}
                    <div className="flex items-center gap-2">
                      {item.is_verified && (
                        <span className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center" title="Verifiziert">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        </span>
                      )}
                      {item.ai_confidence !== null && item.ai_confidence < 80 && (
                        <span className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center" title={`KI-Konfidenz: ${item.ai_confidence}%`}>
                          <AlertCircle className="w-4 h-4 text-amber-400" />
                        </span>
                      )}
                      
                      {/* Actions */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingItem(item.id);
                          setEditForm(item);
                        }}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteItem(item.id);
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedItem === item.id && (
                    <div className="px-4 pb-4 pt-2 border-t border-white/10 grid grid-cols-2 gap-4 text-sm">
                      {item.plural && (
                        <div>
                          <span className="text-slate-500">Plural:</span>
                          <span className="ml-2 text-white font-arabic">{item.plural}</span>
                        </div>
                      )}
                      {item.root && (
                        <div>
                          <span className="text-slate-500">Wurzel:</span>
                          <span className="ml-2 text-white font-arabic">{item.root}</span>
                        </div>
                      )}
                      {item.gender && (
                        <div>
                          <span className="text-slate-500">Geschlecht:</span>
                          <span className="ml-2 text-white">{item.gender === 'm' ? 'maskulin' : 'feminin'}</span>
                        </div>
                      )}
                      {item.example_arabic && (
                        <div className="col-span-2">
                          <span className="text-slate-500">Beispiel:</span>
                          <p className="text-white font-arabic text-right mt-1" dir="rtl">{item.example_arabic}</p>
                          {item.example_german && (
                            <p className="text-slate-300 mt-1">{item.example_german}</p>
                          )}
                        </div>
                      )}
                      {item.notes && (
                        <div className="col-span-2">
                          <span className="text-slate-500">Notizen:</span>
                          <p className="text-slate-300 mt-1">{item.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {list.items.length === 0 && (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">Noch keine Vokabeln vorhanden</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Füge Vokabeln manuell hinzu oder lass sie von der KI generieren.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - List Settings */}
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sticky top-24">
              <h3 className="font-semibold text-white mb-4">Listeneinstellungen</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Titel</label>
                  <input
                    type="text"
                    value={list.title}
                    onChange={(e) => setList(prev => prev ? { ...prev, title: e.target.value } : null)}
                    onBlur={() => updateList({ title: list.title })}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Kategorie</label>
                  <select
                    value={list.category}
                    onChange={(e) => updateList({ category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-amber-500/50"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Niveau</label>
                  <select
                    value={list.level}
                    onChange={(e) => updateList({ level: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-amber-500/50"
                  >
                    {LEVELS.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Beschreibung</label>
                  <textarea
                    value={list.description || ''}
                    onChange={(e) => setList(prev => prev ? { ...prev, description: e.target.value } : null)}
                    onBlur={() => updateList({ description: list.description })}
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-white resize-none focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-slate-400">Vokabeln</span>
                    <span className="text-white font-medium">{list.item_count}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-slate-400">KI-Generiert</span>
                    <span className={list.is_ai_generated ? 'text-purple-400' : 'text-slate-500'}>
                      {list.is_ai_generated ? 'Ja' : 'Nein'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">KI-Geprüft</span>
                    <span className={list.is_ai_verified ? 'text-green-400' : 'text-slate-500'}>
                      {list.is_ai_verified ? 'Ja' : 'Nein'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">Vokabel bearbeiten</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Arabisch</label>
                  <input
                    type="text"
                    value={editForm.arabic || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, arabic: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white text-right font-arabic text-xl focus:outline-none focus:border-amber-500/50"
                    dir="rtl"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Arabisch (vokalisiert)</label>
                  <input
                    type="text"
                    value={editForm.arabic_voweled || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, arabic_voweled: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white text-right font-arabic text-xl focus:outline-none focus:border-amber-500/50"
                    dir="rtl"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Deutsch</label>
                  <input
                    type="text"
                    value={editForm.german || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, german: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Transliteration</label>
                  <input
                    type="text"
                    value={editForm.transliteration || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, transliteration: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Wortart</label>
                  <select
                    value={editForm.word_type || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, word_type: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="">Auswählen...</option>
                    {WORD_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Geschlecht</label>
                  <select
                    value={editForm.gender || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, gender: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="">Nicht zutreffend</option>
                    <option value="m">Maskulin</option>
                    <option value="f">Feminin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Plural</label>
                  <input
                    type="text"
                    value={editForm.plural || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, plural: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white text-right font-arabic focus:outline-none focus:border-amber-500/50"
                    dir="rtl"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Wurzel</label>
                  <input
                    type="text"
                    value={editForm.root || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, root: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white text-right font-arabic focus:outline-none focus:border-amber-500/50"
                    dir="rtl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Beispielsatz (Arabisch)</label>
                <input
                  type="text"
                  value={editForm.example_arabic || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, example_arabic: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white text-right font-arabic focus:outline-none focus:border-amber-500/50"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Beispielsatz (Deutsch)</label>
                <input
                  type="text"
                  value={editForm.example_german || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, example_german: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Notizen</label>
                <textarea
                  value={editForm.notes || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white resize-none focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            <div className="p-6 border-t border-white/10 flex justify-end gap-3">
              <button
                onClick={() => {
                  setEditingItem(null);
                  setEditForm({});
                }}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={() => updateItem(editingItem)}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
              >
                <Check className="w-4 h-4" />
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Arabic font style */}
      <style jsx global>{`
        .font-arabic {
          font-family: 'Noto Sans Arabic', 'Amiri', 'Traditional Arabic', sans-serif;
        }
      `}</style>
    </div>
  );
}

