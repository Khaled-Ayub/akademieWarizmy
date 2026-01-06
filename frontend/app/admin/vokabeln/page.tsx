'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Search, 
  Filter, 
  BookOpen, 
  Languages, 
  Sparkles,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  ChevronDown,
} from 'lucide-react';

// =========================================
// Types
// =========================================
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
  course_id: string | null;
  order: number;
  is_published: boolean;
  is_ai_generated: boolean;
  is_ai_verified: boolean;
  item_count: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

// Wortarten
const WORD_TYPES = [
  { value: 'noun', label: 'Nomen', arabic: 'اسماء', color: 'bg-blue-500' },
  { value: 'verb', label: 'Verben', arabic: 'افعال', color: 'bg-green-500' },
  { value: 'particle', label: 'Partikel', arabic: 'حروف', color: 'bg-purple-500' },
];

// Nomen-Kategorien
const NOUN_CATEGORIES: Record<string, { label: string; arabic: string }> = {
  general: { label: 'Allgemein', arabic: 'عام' },
  food: { label: 'Essen & Trinken', arabic: 'طعام وشراب' },
  school: { label: 'Schule & Bildung', arabic: 'مدرسة' },
  work: { label: 'Arbeit & Beruf', arabic: 'عمل ومهنة' },
  family: { label: 'Familie', arabic: 'عائلة' },
  body: { label: 'Körper', arabic: 'جسم' },
  clothes: { label: 'Kleidung', arabic: 'ملابس' },
  house: { label: 'Haus & Wohnung', arabic: 'بيت ومنزل' },
  nature: { label: 'Natur', arabic: 'طبيعة' },
  animals: { label: 'Tiere', arabic: 'حيوانات' },
  colors: { label: 'Farben', arabic: 'ألوان' },
  numbers: { label: 'Zahlen', arabic: 'أرقام' },
  time: { label: 'Zeit & Datum', arabic: 'وقت' },
  weather: { label: 'Wetter', arabic: 'طقس' },
  travel: { label: 'Reisen', arabic: 'سفر' },
  health: { label: 'Gesundheit', arabic: 'صحة' },
  religion: { label: 'Religion & Islam', arabic: 'دين' },
  quran: { label: 'Quran-Vokabeln', arabic: 'قرآن' },
  greetings: { label: 'Begrüßungen', arabic: 'تحيات' },
  places: { label: 'Orte', arabic: 'أماكن' },
  emotions: { label: 'Gefühle', arabic: 'مشاعر' },
  technology: { label: 'Technologie', arabic: 'تكنولوجيا' },
};

// Verb-Kategorien
const VERB_CATEGORIES: Record<string, { label: string; arabic: string }> = {
  three_letter: { label: 'Dreistämmig (Form I)', arabic: 'ثلاثي' },
  four_letter: { label: 'Vierstämmig', arabic: 'رباعي' },
  derived_ii: { label: 'Form II', arabic: 'فَعَّلَ' },
  derived_iii: { label: 'Form III', arabic: 'فَاعَلَ' },
  derived_iv: { label: 'Form IV', arabic: 'أَفْعَلَ' },
  derived_v: { label: 'Form V', arabic: 'تَفَعَّلَ' },
  derived_vi: { label: 'Form VI', arabic: 'تَفَاعَلَ' },
  derived_vii: { label: 'Form VII', arabic: 'اِنْفَعَلَ' },
  derived_viii: { label: 'Form VIII', arabic: 'اِفْتَعَلَ' },
  derived_x: { label: 'Form X', arabic: 'اِسْتَفْعَلَ' },
  daily: { label: 'Alltag', arabic: 'يومي' },
  school_verbs: { label: 'Schule & Lernen', arabic: 'مدرسة' },
  work_verbs: { label: 'Arbeit & Beruf', arabic: 'عمل' },
  movement: { label: 'Bewegung', arabic: 'حركة' },
  communication: { label: 'Kommunikation', arabic: 'تواصل' },
  emotions_verbs: { label: 'Gefühle', arabic: 'مشاعر' },
  cooking: { label: 'Kochen', arabic: 'طبخ' },
  worship: { label: 'Gottesdienst', arabic: 'عبادة' },
  general_verbs: { label: 'Allgemein', arabic: 'عام' },
};

// Partikel-Kategorien
const PARTICLE_CATEGORIES: Record<string, { label: string; arabic: string }> = {
  prepositions: { label: 'Präpositionen', arabic: 'حروف الجر' },
  conjunctions: { label: 'Konjunktionen', arabic: 'حروف العطف' },
  negation: { label: 'Verneinung', arabic: 'حروف النفي' },
  interrogative: { label: 'Fragepartikel', arabic: 'أدوات الاستفهام' },
  conditional: { label: 'Konditionalsätze', arabic: 'أدوات الشرط' },
  demonstrative: { label: 'Demonstrativpronomen', arabic: 'أسماء الإشارة' },
  relative: { label: 'Relativpronomen', arabic: 'أسماء الموصولة' },
  vocative: { label: 'Vokativ', arabic: 'أدوات النداء' },
  exception: { label: 'Ausnahme', arabic: 'أدوات الاستثناء' },
  emphasis: { label: 'Betonung', arabic: 'أدوات التوكيد' },
  future: { label: 'Futurpartikel', arabic: 'أدوات المستقبل' },
  general: { label: 'Allgemein', arabic: 'عام' },
};

const LEVELS: Record<string, string> = {
  a1: 'A1 - Anfänger',
  a2: 'A2 - Grundlagen',
  b1: 'B1 - Mittelstufe',
  b2: 'B2 - Fortgeschritten',
  c1: 'C1 - Experte',
  c2: 'C2 - Muttersprachlich',
};

const getSubcategoryLabel = (list: VocabularyList): string => {
  if (list.word_type === 'noun' && list.noun_category) {
    return NOUN_CATEGORIES[list.noun_category]?.label || list.noun_category;
  }
  if (list.word_type === 'verb' && list.verb_category) {
    return VERB_CATEGORIES[list.verb_category]?.label || list.verb_category;
  }
  if (list.word_type === 'particle' && list.particle_category) {
    return PARTICLE_CATEGORIES[list.particle_category]?.label || list.particle_category;
  }
  return 'Allgemein';
};

const getWordTypeColor = (wordType: string): string => {
  const type = WORD_TYPES.find(t => t.value === wordType);
  return type?.color || 'bg-gray-500';
};

// =========================================
// Component
// =========================================
export default function VocabularyAdminPage() {
  const router = useRouter();
  const [lists, setLists] = useState<VocabularyList[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [wordTypeFilter, setWordTypeFilter] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    fetchLists();
  }, [wordTypeFilter, levelFilter]);

  const fetchLists = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (wordTypeFilter) params.append('word_type', wordTypeFilter);
      if (levelFilter) params.append('level', levelFilter);
      
      const res = await fetch(`/api/vocabulary/admin/lists?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLists(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteList = async (id: string) => {
    if (!confirm('Diese Vokabelliste wirklich löschen?')) return;
    
    try {
      const res = await fetch(`/api/vocabulary/admin/lists/${id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        setLists(lists.filter(l => l.id !== id));
      }
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
    }
  };

  const togglePublish = async (list: VocabularyList) => {
    try {
      const res = await fetch(`/api/vocabulary/admin/lists/${list.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !list.is_published }),
      });
      
      if (res.ok) {
        setLists(lists.map(l => 
          l.id === list.id ? { ...l, is_published: !l.is_published } : l
        ));
      }
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  // Gefilterte und gruppierte Listen
  const filteredLists = lists.filter(list => 
    list.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    list.title_arabic?.includes(searchQuery) ||
    list.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Nach Wortart gruppieren
  const groupedLists = {
    noun: filteredLists.filter(l => l.word_type === 'noun'),
    verb: filteredLists.filter(l => l.word_type === 'verb'),
    particle: filteredLists.filter(l => l.word_type === 'particle'),
  };

  // Statistiken
  const stats = {
    total: lists.length,
    nouns: lists.filter(l => l.word_type === 'noun').length,
    verbs: lists.filter(l => l.word_type === 'verb').length,
    particles: lists.filter(l => l.word_type === 'particle').length,
    totalItems: lists.reduce((sum, l) => sum + l.item_count, 0),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Languages className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Vokabeln</h1>
                <p className="text-sm text-slate-400">Arabisch-Deutsch · اسماء · افعال · حروف</p>
              </div>
            </div>
            
            <button
              onClick={() => router.push('/admin/vokabeln/neu')}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/25"
            >
              <Plus className="w-5 h-5" />
              Neue Liste
            </button>
          </div>

          {/* Stats - Nach Wortart */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                  <span className="text-white font-arabic text-lg">اسم</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.nouns}</p>
                  <p className="text-xs text-slate-400">Nomen</p>
                </div>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <span className="text-white font-arabic text-lg">فعل</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.verbs}</p>
                  <p className="text-xs text-slate-400">Verben</p>
                </div>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="text-white font-arabic text-lg">حرف</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.particles}</p>
                  <p className="text-xs text-slate-400">Partikel</p>
                </div>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <Languages className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.totalItems}</p>
                  <p className="text-xs text-slate-400">Vokabeln</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Vokabellisten suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
              showFilters || wordTypeFilter || levelFilter
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
            }`}
          >
            <Filter className="w-5 h-5" />
            Filter
          </button>
        </div>

        {showFilters && (
          <div className="flex gap-4 mb-6 p-4 bg-white/5 border border-white/10 rounded-xl">
            <div className="flex-1">
              <label className="block text-sm text-slate-400 mb-2">Wortart</label>
              <select
                value={wordTypeFilter}
                onChange={(e) => setWordTypeFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">Alle Wortarten</option>
                {WORD_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label} ({type.arabic})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm text-slate-400 mb-2">Niveau</label>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">Alle Niveaus</option>
                {Object.entries(LEVELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {(wordTypeFilter || levelFilter) && (
              <button
                onClick={() => { setWordTypeFilter(''); setLevelFilter(''); }}
                className="self-end px-4 py-2.5 text-amber-400 hover:text-amber-300 transition-colors"
              >
                Zurücksetzen
              </button>
            )}
          </div>
        )}

        {/* Listen nach Wortart gruppiert */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 bg-white/5 border border-white/10 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredLists.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/5 flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-slate-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Keine Vokabellisten gefunden</h3>
            <p className="text-slate-400 mb-6">
              {searchQuery || wordTypeFilter || levelFilter
                ? 'Versuche andere Suchbegriffe oder Filter.'
                : 'Erstelle deine erste Vokabelliste!'}
            </p>
            <button
              onClick={() => router.push('/admin/vokabeln/neu')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium"
            >
              <Plus className="w-5 h-5" />
              Erste Liste erstellen
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Nomen */}
            {groupedLists.noun.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center font-arabic text-white">اسم</span>
                  Nomen <span className="text-slate-500 font-normal">({groupedLists.noun.length})</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedLists.noun.map(list => (
                    <ListCard key={list.id} list={list} router={router} onDelete={deleteList} onTogglePublish={togglePublish} />
                  ))}
                </div>
              </div>
            )}

            {/* Verben */}
            {groupedLists.verb.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center font-arabic text-white">فعل</span>
                  Verben <span className="text-slate-500 font-normal">({groupedLists.verb.length})</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedLists.verb.map(list => (
                    <ListCard key={list.id} list={list} router={router} onDelete={deleteList} onTogglePublish={togglePublish} />
                  ))}
                </div>
              </div>
            )}

            {/* Partikel */}
            {groupedLists.particle.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center font-arabic text-white">حرف</span>
                  Partikel <span className="text-slate-500 font-normal">({groupedLists.particle.length})</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedLists.particle.map(list => (
                    <ListCard key={list.id} list={list} router={router} onDelete={deleteList} onTogglePublish={togglePublish} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx global>{`
        .font-arabic {
          font-family: 'Noto Sans Arabic', 'Amiri', 'Traditional Arabic', sans-serif;
        }
      `}</style>
    </div>
  );
}

// =========================================
// ListCard Component
// =========================================
function ListCard({ 
  list, 
  router, 
  onDelete, 
  onTogglePublish 
}: { 
  list: VocabularyList; 
  router: any;
  onDelete: (id: string) => void;
  onTogglePublish: (list: VocabularyList) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className={`group bg-white/5 border rounded-xl overflow-hidden hover:border-amber-500/30 transition-all cursor-pointer ${
        list.word_type === 'noun' ? 'border-blue-500/20' :
        list.word_type === 'verb' ? 'border-green-500/20' :
        'border-purple-500/20'
      }`}
      onClick={() => router.push(`/admin/vokabeln/${list.id}`)}
    >
      {/* Header */}
      <div className={`h-2 ${getWordTypeColor(list.word_type)}`} />
      
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                {list.title}
              </h3>
              {list.is_ai_generated && (
                <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
              )}
            </div>
            {list.title_arabic && (
              <p className="text-sm text-slate-400 font-arabic" dir="rtl">{list.title_arabic}</p>
            )}
          </div>
          
          {/* Actions Menu */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-slate-400" />
            </button>
            
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-48 bg-slate-800 border border-white/10 rounded-lg shadow-xl z-20 py-1 overflow-hidden">
                  <button
                    onClick={() => {
                      router.push(`/admin/vokabeln/${list.id}`);
                      setMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" /> Bearbeiten
                  </button>
                  <button
                    onClick={() => {
                      onTogglePublish(list);
                      setMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2"
                  >
                    {list.is_published ? (
                      <><Clock className="w-4 h-4" /> Verstecken</>
                    ) : (
                      <><CheckCircle className="w-4 h-4" /> Veröffentlichen</>
                    )}
                  </button>
                  <div className="h-px bg-white/10 my-1" />
                  <button
                    onClick={() => {
                      onDelete(list.id);
                      setMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Löschen
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`px-2 py-0.5 rounded text-xs font-medium text-white ${getWordTypeColor(list.word_type)}`}>
            {getSubcategoryLabel(list)}
          </span>
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-700 text-slate-300">
            {list.level.toUpperCase()}
          </span>
          {!list.is_published && (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-500/20 text-amber-400">
              Entwurf
            </span>
          )}
          {list.is_ai_verified && (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400">
              KI-Geprüft
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">
            <strong className="text-white">{list.item_count}</strong> Vokabeln
          </span>
          <span className="text-slate-500">
            {new Date(list.updated_at).toLocaleDateString('de-DE')}
          </span>
        </div>
      </div>
    </div>
  );
}
