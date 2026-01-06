// ===========================================
// WARIZMY EDUCATION - Kurs-Suche Komponente
// ===========================================
// Suchfeld mit Live-Suche und Filter

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { 
  Search, 
  X, 
  Loader2, 
  BookOpen,
  Clock,
  ChevronRight
} from 'lucide-react';

// ===========================================
// TYPEN
// ===========================================

interface Course {
  id: number;
  attributes: {
    title: string;
    slug: string;
    short_description?: string;
    category: string;
    level: string;
    duration_weeks?: number;
    price: number;
  };
}

interface CourseSearchProps {
  className?: string;
  placeholder?: string;
  onSearch?: (query: string) => void;
}

// ===========================================
// HILFSFUNKTIONEN
// ===========================================

// Debounce Hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return debouncedValue;
}

// Kategorie Label
function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    'arabic': 'Arabisch',
    'quran': 'Quran',
    'islamic_studies': 'Islamstudien',
    'tajweed': 'Tajweed',
    'children': 'Kinder',
  };
  return labels[category] || category;
}

// Level Label
function getLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    'beginner': 'Anfänger',
    'intermediate': 'Mittelstufe',
    'advanced': 'Fortgeschritten',
  };
  return labels[level] || level;
}

// ===========================================
// HAUPTKOMPONENTE
// ===========================================

export default function CourseSearch({ 
  className = '',
  placeholder = 'Kurse durchsuchen...',
  onSearch
}: CourseSearchProps) {
  // State
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Course[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Debounced Query
  const debouncedQuery = useDebounce(query, 300);
  
  // Suche ausführen
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      return;
    }
    
    async function search() {
      setIsLoading(true);
      
      try {
        const res = await fetch(
          `/api/courses/search?q=${encodeURIComponent(debouncedQuery)}`
        );
        
        if (res.ok) {
          const data = await res.json();
          setResults(data.data || []);
        }
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }
    
    search();
    onSearch?.(debouncedQuery);
  }, [debouncedQuery, onSearch]);
  
  // Click Outside Handler
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Keyboard Navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };
  
  // Clear Search
  const clearSearch = () => {
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };
  
  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-12 pr-10 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
        />
        
        {/* Clear / Loading */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          ) : query ? (
            <button
              onClick={clearSearch}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          ) : null}
        </div>
      </div>
      
      {/* Results Dropdown */}
      {isOpen && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="p-6 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary-500" />
              <p className="text-sm text-gray-500 mt-2">Suche läuft...</p>
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                <p className="text-xs text-gray-500">
                  {results.length} Ergebnis{results.length !== 1 ? 'se' : ''} gefunden
                </p>
              </div>
              <div>
                {results.map(course => (
                  <Link
                    key={course.id}
                    href={`/kurse/${course.attributes.slug}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-primary-600" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">
                        {course.attributes.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                          {getCategoryLabel(course.attributes.category)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {getLevelLabel(course.attributes.level)}
                        </span>
                        {course.attributes.duration_weeks && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {course.attributes.duration_weeks} Wo.
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Price */}
                    <div className="flex-shrink-0 text-right">
                      {course.attributes.price > 0 ? (
                        <span className="font-semibold text-gray-900">
                          €{course.attributes.price}
                        </span>
                      ) : (
                        <span className="text-green-600 font-medium text-sm">
                          Kostenlos
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
              
              {/* Alle Ergebnisse Link */}
              <Link
                href={`/kurse?suche=${encodeURIComponent(query)}`}
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 p-3 bg-gray-50 text-primary-600 hover:bg-gray-100 transition-colors font-medium text-sm"
              >
                Alle Ergebnisse anzeigen
                <ChevronRight className="w-4 h-4" />
              </Link>
            </>
          ) : (
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">Keine Kurse gefunden</p>
              <p className="text-sm text-gray-500 mt-1">
                Versuchen Sie andere Suchbegriffe
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

