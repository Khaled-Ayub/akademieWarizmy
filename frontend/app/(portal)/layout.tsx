// ===========================================
// WARIZMY EDUCATION - Portal Layout
// ===========================================
// Gemeinsames Layout für Student & Lehrer Dashboards

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  BookOpen, 
  LayoutDashboard,
  GraduationCap,
  Calendar,
  ClipboardCheck,
  Award,
  FileText,
  User,
  Users,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Bell,
  Settings
} from 'lucide-react';

import { useAuthStore, User as UserType } from '@/stores/authStore';

// =========================================
// Navigation Items basierend auf Rolle
// =========================================
const studentNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/meine-kurse', label: 'Meine Kurse', icon: GraduationCap },
  { href: '/dashboard/kalender', label: 'Kalender', icon: Calendar },
  { href: '/dashboard/anwesenheit', label: 'Anwesenheit', icon: ClipboardCheck },
  { href: '/dashboard/pruefungen', label: 'Prüfungen', icon: FileText },
  { href: '/dashboard/zertifikate', label: 'Zertifikate', icon: Award },
  { href: '/dashboard/profil', label: 'Mein Profil', icon: User },
];

const teacherNavItems = [
  { href: '/lehrer/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/lehrer/dashboard/meine-klassen', label: 'Meine Klassen', icon: Users },
  { href: '/lehrer/dashboard/kalender', label: 'Stundenplan', icon: Calendar },
  { href: '/lehrer/dashboard/anwesenheit', label: 'Anwesenheit', icon: ClipboardCheck },
  { href: '/lehrer/dashboard/pruefungen', label: 'Prüfungen', icon: FileText },
  { href: '/lehrer/dashboard/profil', label: 'Mein Profil', icon: User },
];

// =========================================
// Sidebar Komponente
// =========================================
function Sidebar({ 
  isOpen, 
  onClose, 
  user,
  navItems 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  user: UserType | null;
  navItems: typeof studentNavItems;
}) {
  const pathname = usePathname();
  
  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const roleLabels: Record<string, string> = {
    student: 'Student',
    teacher: 'Lehrer',
    admin: 'Administrator',
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
        fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200
        transform transition-transform duration-200 ease-in-out
        lg:translate-x-0 lg:relative lg:z-auto lg:h-screen lg:sticky lg:top-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-500 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg text-gray-900">WARIZMY</span>
              <span className="text-xs text-gray-500 block -mt-1">
                {user ? roleLabels[user.role] : 'Portal'}
              </span>
            </div>
          </Link>
          <button 
            onClick={onClose}
            className="lg:hidden p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* User Info */}
        {user && (
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary-600">
                  {user.first_name[0]}{user.last_name[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Navigation */}
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
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
                    ? 'bg-primary-50 text-primary-600 font-medium' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-primary-500' : ''}`} />
                <span className="text-sm">{item.label}</span>
                {active && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            );
          })}
        </nav>
        
        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-white">
          {user?.role === 'admin' && (
            <Link 
              href="/admin"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors mb-2"
            >
              <Settings className="w-5 h-5" />
              <span className="text-sm">Admin-Bereich</span>
            </Link>
          )}
          <Link 
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Zur Website</span>
          </Link>
        </div>
      </aside>
    </>
  );
}

// =========================================
// Header Komponente
// =========================================
function Header({ 
  onMenuClick, 
  user 
}: { 
  onMenuClick: () => void;
  user: UserType | null;
}) {
  const { logout } = useAuthStore();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
      {/* Mobile Menu Button */}
      <button 
        onClick={onMenuClick}
        className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
      >
        <Menu className="w-5 h-5 text-gray-600" />
      </button>
      
      {/* Search / Title */}
      <div className="flex-1 lg:ml-0 ml-4">
        <h1 className="text-lg font-semibold text-gray-900 hidden lg:block">
          Willkommen zurück{user ? `, ${user.first_name}` : ''}!
        </h1>
      </div>
      
      {/* Right Side */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="p-2 hover:bg-gray-100 rounded-lg relative">
          <Bell className="w-5 h-5 text-gray-500" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        
        {/* User Menu */}
        <div className="relative">
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg"
          >
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-sm font-medium text-primary-600">
                {user ? `${user.first_name[0]}${user.last_name[0]}` : '?'}
              </span>
            </div>
          </button>
          
          {showUserMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <Link
                  href="/dashboard/profil"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setShowUserMenu(false)}
                >
                  <User className="w-4 h-4" />
                  Profil
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                >
                  <LogOut className="w-4 h-4" />
                  Abmelden
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

// =========================================
// Portal Layout
// =========================================
export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAuthenticated, checkAuth } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [authReady, setAuthReady] = useState(false);

  // Navigation Items basierend auf Rolle
  const navItems = pathname.startsWith('/lehrer') ? teacherNavItems : studentNavItems;

  // Auth Check
  useEffect(() => {
    const verify = async () => {
      const isValid = await checkAuth();
      if (!isValid) {
        router.push('/login');
        return;
      }

      const u = useAuthStore.getState().user;

      // Role routing: teacher routes vs student routes
      if (pathname.startsWith('/lehrer') && u?.role !== 'teacher') {
        router.replace('/dashboard');
        return;
      }
      if (pathname.startsWith('/dashboard') && u?.role === 'teacher') {
        router.replace('/lehrer/dashboard');
        return;
      }

      // Force student onboarding if profile not completed
      if (u?.role === 'student' && !u?.onboarding_completed) {
        router.replace(`/onboarding?next=${encodeURIComponent(pathname)}`);
        return;
      }

      setAuthReady(true);
    };
    verify();
  }, [checkAuth, pathname, router]);

  if (!authReady || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        user={user}
        navItems={navItems}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <Header 
          onMenuClick={() => setSidebarOpen(true)} 
          user={user}
        />
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

