// ===========================================
// Progress Sync Hook
// ===========================================
// Globaler Hook zum Synchronisieren von Fortschritts-Updates über die App

import { useCallback, useEffect } from 'react';

type ProgressChangeListener = (data: {
  lessonId: string;
  courseId: string;
  completed: boolean;
}) => void;

const listeners: Set<ProgressChangeListener> = new Set();

/**
 * Hook zum Abhören von Fortschritts-Änderungen
 */
export function useProgressSync(callback: ProgressChangeListener) {
  useEffect(() => {
    listeners.add(callback);
    return () => {
      listeners.delete(callback);
    };
  }, [callback]);
}

/**
 * Benachrichtige alle Listener über eine Fortschritts-Änderung
 */
export function notifyProgressChange(data: {
  lessonId: string;
  courseId: string;
  completed: boolean;
}) {
  console.log('Progress change notified:', data);
  listeners.forEach(listener => {
    try {
      listener(data);
    } catch (err) {
      console.error('Error in progress listener:', err);
    }
  });
}
