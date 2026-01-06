// ===========================================
// WARIZMY EDUCATION - Loading Komponenten
// ===========================================
// Verschiedene Loading-Animationen und Skeletons

import { Loader2 } from 'lucide-react';

// ===========================================
// SPINNER VARIANTEN
// ===========================================

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * Einfacher Spinner
 */
export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };
  
  return (
    <Loader2 className={`animate-spin text-primary-500 ${sizes[size]} ${className}`} />
  );
}

/**
 * Spinner mit Text
 */
export function SpinnerWithText({ 
  text = 'Wird geladen...', 
  size = 'md' 
}: { 
  text?: string; 
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <Spinner size={size} />
      <p className="text-gray-500 text-sm">{text}</p>
    </div>
  );
}

/**
 * Fullscreen Loading Overlay
 */
export function FullscreenLoader({ text }: { text?: string }) {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <SpinnerWithText text={text} size="xl" />
    </div>
  );
}

/**
 * Pulsierender Logo Loader (für initiales Laden)
 */
export function LogoLoader() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-primary-500 flex items-center justify-center animate-pulse">
          <svg 
            viewBox="0 0 24 24" 
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </div>
        {/* Pulsierender Ring */}
        <div className="absolute inset-0 rounded-2xl border-2 border-primary-500 animate-ping opacity-75" />
      </div>
      <p className="text-gray-500 animate-pulse">WARIZMY lädt...</p>
    </div>
  );
}

// ===========================================
// SKELETON KOMPONENTEN
// ===========================================

/**
 * Basis Skeleton Block
 */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  );
}

/**
 * Text Skeleton (mehrere Zeilen)
 */
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} 
        />
      ))}
    </div>
  );
}

/**
 * Kurs-Karte Skeleton
 */
export function CourseCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Thumbnail */}
      <Skeleton className="h-48 rounded-none" />
      
      {/* Content */}
      <div className="p-6">
        {/* Badges */}
        <div className="flex gap-2 mb-3">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-16" />
        </div>
        
        {/* Title */}
        <Skeleton className="h-6 w-3/4 mb-3" />
        
        {/* Description */}
        <SkeletonText lines={2} />
        
        {/* Footer */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}

/**
 * Lehrer-Karte Skeleton
 */
export function TeacherCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Photo */}
      <Skeleton className="aspect-[4/3] rounded-none" />
      
      {/* Content */}
      <div className="p-6">
        <Skeleton className="h-6 w-2/3 mb-3" />
        <SkeletonText lines={2} />
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}

/**
 * Lektions-Liste Skeleton
 */
export function LessonListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i}
          className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl"
        >
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="w-5 h-5 rounded" />
        </div>
      ))}
    </div>
  );
}

/**
 * FAQ Skeleton
 */
export function FAQSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i}
          className="bg-white rounded-xl border border-gray-200 p-4"
        >
          <div className="flex justify-between items-center">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-5 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Tabellen Skeleton
 */
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 flex gap-4 border-b border-gray-200">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowI) => (
        <div 
          key={rowI}
          className="px-4 py-3 flex gap-4 border-b border-gray-100 last:border-b-0"
        >
          {Array.from({ length: cols }).map((_, colI) => (
            <Skeleton key={colI} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ===========================================
// LOADING PAGE (für Next.js loading.tsx)
// ===========================================

export default function LoadingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LogoLoader />
    </div>
  );
}

