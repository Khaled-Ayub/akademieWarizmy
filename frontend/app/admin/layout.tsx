// ===========================================
// WARIZMY EDUCATION - Admin Layout
// ===========================================
// Gemeinsames Layout für alle Admin-Seiten

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  BookOpen, 
  LayoutDashboard,
  GraduationCap,
  Users,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import { ToastProvider } from '@/components/Toast';

// =========================================
// Navigation Items (Hauptmenü)
// =========================================
const navItems = [
  { 
    href: '/admin', 
    label: 'Dashboard', 
    icon: LayoutDashboard,
    exact: true 
  },
  { 
    href: '/admin/kurse', 
    label: 'Kurse & Lektionen', 
    icon: GraduationCap 
  },
  { 
    href: '/admin/benutzer', 
    label: 'Benutzer', 
    icon: Users,
  },
  { 
    href: '/admin/klassen', 
    label: 'Klassen', 
    icon: Users,
  },
  { 
    href: '/admin/zahlungen', 
    label: 'Zahlungen', 
    icon: CreditCard,
  },
];

// Zukünftige Features (disabled)
const futureItems = [
  { 
    href: '/admin/einstellungen', 
    label: 'Einstellungen', 
    icon: Settings,
  },
];

// =========================================
// Sidebar Komponente
// =========================================
function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  
  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-gray-900 text-white
        transform transition-transform duration-200 ease-in-out
        lg:translate-x-0 lg:relative lg:z-auto lg:h-screen lg:sticky lg:top-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
          <Link href="/admin" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="relative w-9 h-9 rounded-lg overflow-hidden shadow-sm">
              <Image
                src="/images/Logo/full (1).jpg"
                alt="WARIZMY Logo"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <span className="font-bold text-lg">WARIZMY</span>
              <span className="text-xs text-gray-400 block -mt-1">Admin</span>
            </div>
          </Link>
          <button 
            onClick={onClose}
            className="lg:hidden p-1 hover:bg-gray-800 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Navigation - Aktive Links */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                  ${active 
                    ? 'bg-primary-500 text-white' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
                {active && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            );
          })}
          
          {/* Trennlinie */}
          <div className="my-3 border-t border-gray-800" />
          
          {/* Zukünftige Features */}
          {futureItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 cursor-not-allowed"
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
                <span className="ml-auto text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded">Bald</span>
              </div>
            );
          })}
        </nav>
        
        {/* Bottom Section - Zur Website Link */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <Link 
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Zur Website</span>
          </Link>
        </div>
      </aside>
    </>
  );
}

// =========================================
// Header Komponente
// =========================================
function Header({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
      {/* Mobile Menu Button */}
      <button 
        onClick={onMenuClick}
        className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
      >
        <Menu className="w-5 h-5 text-gray-600" />
      </button>
      
      {/* Breadcrumb / Title Area */}
      <div className="flex-1 lg:ml-0 ml-4">
        <h1 className="text-lg font-semibold text-gray-900">Admin-Bereich</h1>
      </div>
      
      {/* User Menu */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="text-sm text-gray-600 hover:text-primary-500 hidden sm:block"
        >
          Zur Website →
        </Link>
        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
          <span className="text-sm font-medium text-primary-600">A</span>
        </div>
      </div>
    </header>
  );
}

// =========================================
// Admin Layout
// =========================================
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-100 flex">
        {/* Sidebar */}
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}

