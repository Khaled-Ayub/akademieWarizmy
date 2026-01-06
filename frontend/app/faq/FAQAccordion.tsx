// ===========================================
// WARIZMY EDUCATION - FAQ Akkordeon
// ===========================================
// Client Component für interaktives Akkordeon

'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

// ===========================================
// TYPEN (neue flache Struktur von FastAPI)
// ===========================================

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
  order: number;
}

interface FAQAccordionProps {
  faqs: FAQ[];
}

// ===========================================
// AKKORDEON ITEM
// ===========================================

function AccordionItem({ faq, isOpen, onToggle }: { 
  faq: FAQ; 
  isOpen: boolean; 
  onToggle: () => void;
}) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white mb-3 last:mb-0">
      {/* Frage (Header) */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-900 pr-4">
          {faq.question}
        </span>
        <ChevronDown 
          className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      
      {/* Antwort (Content) */}
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-6 pb-4 text-gray-600 border-t border-gray-100 pt-4">
          <div dangerouslySetInnerHTML={{ __html: faq.answer }} />
        </div>
      </div>
    </div>
  );
}

// ===========================================
// HAUPTKOMPONENTE
// ===========================================

export default function FAQAccordion({ faqs }: FAQAccordionProps) {
  // Alle offenen Items tracken (mehrere können offen sein)
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  
  const toggleItem = (id: string) => {
    setOpenItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };
  
  return (
    <div>
      {faqs.map(faq => (
        <AccordionItem
          key={faq.id}
          faq={faq}
          isOpen={openItems.has(faq.id)}
          onToggle={() => toggleItem(faq.id)}
        />
      ))}
    </div>
  );
}
