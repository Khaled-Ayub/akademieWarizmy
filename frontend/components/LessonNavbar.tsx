'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, ChevronLeft, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

interface LessonNavbarProps {
  courseTitle: string;
  courseSlug: string;
}

export default function LessonNavbar({ courseTitle, courseSlug }: LessonNavbarProps) {
  const { user, isAuthenticated, logout, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const dashboardHref = user?.role === 'teacher' ? '/lehrer/dashboard' : '/dashboard';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="container-custom">
        <div className="flex items-center justify-between h-14">
          {/* Logo + Zurück */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
            </Link>
            <div className="h-6 w-px bg-gray-200" />
            <Link 
              href={`/kurse/${courseSlug}`}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary-500 font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{courseTitle}</span>
              <span className="sm:hidden">Zurück</span>
            </Link>
          </div>
          
          {/* Auth */}
          <div className="flex items-center gap-4">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-4">
                <Link 
                  href={dashboardHref}
                  className="hidden sm:flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary-500 font-medium"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                <button
                  onClick={() => logout()}
                  className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-500 font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="sr-only sm:not-sr-only">Abmelden</span>
                </button>
              </div>
            ) : (
              <Link 
                href="/login" 
                className="text-sm text-gray-600 hover:text-primary-500 font-medium"
              >
                Anmelden
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
