'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, LogOut, LayoutDashboard, User, ChevronDown, BookOpen, Settings, Award } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import Logo from './Logo';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, isAuthenticated, logout, checkAuth } = useAuthStore();
  const pathname = usePathname();

  // Check auth on mount to ensure correct state on public pages
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/kurse', label: 'Kurse' },
    { href: '/lehrer', label: 'Lehrer' },
    { href: '/ueber-uns', label: 'Über uns' },
    { href: '/faq', label: 'FAQ' },
    { href: '/kontakt', label: 'Kontakt' },
  ];

  const dashboardHref = user?.role === 'teacher' ? '/lehrer/dashboard' : '/dashboard';

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 py-2' : 'bg-white/80 backdrop-blur-sm py-4'
      }`}
    >
      <div className="container-custom">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Logo size="md" />

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`font-medium transition-colors ${
                  pathname === link.href ? 'text-primary-500' : 'text-gray-600 hover:text-primary-500'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Auth Buttons / User Menu */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                {/* Dashboard Button bleibt im Menü */}
                <Link 
                  href={dashboardHref}
                  className="flex items-center gap-2 text-gray-600 hover:text-primary-500 font-medium transition-colors"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span>Dashboard</span>
                </Link>
                
                {/* Profil Dropdown Menü */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-600">
                        {user.first_name?.[0]}{user.last_name?.[0]}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowUserMenu(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                        {/* User Info Header */}
                        <div className="px-4 py-3 border-b border-gray-100">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <span className="text-base font-medium text-primary-600">
                                {user.first_name?.[0]}{user.last_name?.[0]}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {user.first_name} {user.last_name}
                              </p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                              {user.role === 'teacher' ? 'Lehrer' : 'Schüler'}
                            </span>
                            {user.email_verified && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                Verifiziert
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Menu Items */}
                        <div className="py-1">
                          <Link
                            href="/dashboard/profil"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <User className="w-4 h-4 text-gray-500" />
                            <span>Profil bearbeiten</span>
                          </Link>
                          
                          <Link
                            href="/dashboard/meine-kurse"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <BookOpen className="w-4 h-4 text-gray-500" />
                            <span>Meine Kurse</span>
                          </Link>
                          
                          <Link
                            href="/dashboard/zertifikate"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <Award className="w-4 h-4 text-gray-500" />
                            <span>Zertifikate</span>
                          </Link>
                          
                          <Link
                            href="/dashboard/einstellungen"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <Settings className="w-4 h-4 text-gray-500" />
                            <span>Einstellungen</span>
                          </Link>
                        </div>
                        
                        <div className="border-t border-gray-100 pt-1">
                          <button
                            onClick={() => {
                              logout();
                              setShowUserMenu(false);
                            }}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Abmelden</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="text-gray-600 hover:text-primary-500 font-medium transition-colors"
                >
                  Anmelden
                </Link>
                <Link 
                  href="/registrieren" 
                  className="btn-primary py-2 px-5 text-sm font-semibold rounded-xl shadow-md shadow-primary-500/20 hover:shadow-lg hover:shadow-primary-500/30 transition-all"
                >
                  Registrieren
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-t border-gray-100 shadow-xl animate-fade-in-down">
          <div className="container-custom py-6 flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-lg font-medium py-2 px-4 rounded-lg ${
                  pathname === link.href ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="h-px bg-gray-100 my-2" />
            {isAuthenticated && user ? (
              <>
                <Link
                  href={dashboardHref}
                  className="flex items-center gap-3 text-lg font-medium py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg"
                  onClick={() => setIsOpen(false)}
                >
                  <LayoutDashboard className="w-5 h-5 text-primary-500" />
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-3 text-lg font-medium py-3 px-4 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <LogOut className="w-5 h-5" />
                  Abmelden
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-3 mt-2">
                <Link
                  href="/login"
                  className="btn bg-gray-100 text-gray-700 hover:bg-gray-200 py-3 text-center"
                  onClick={() => setIsOpen(false)}
                >
                  Anmelden
                </Link>
                <Link
                  href="/registrieren"
                  className="btn-primary py-3 text-center"
                  onClick={() => setIsOpen(false)}
                >
                  Registrieren
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
