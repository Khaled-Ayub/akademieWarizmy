// ===========================================
// WARIZMY EDUCATION - Student Onboarding
// ===========================================
// First-login profile completion for students

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Save, ChevronLeft } from 'lucide-react';

import { usersApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { ToastProvider, useToast } from '@/components/Toast';

function safeNextPath(next: string | null, fallback: string) {
  if (!next) return fallback;
  if (!next.startsWith('/') || next.startsWith('//')) return fallback;
  // Prevent redirect loop
  if (next === '/onboarding' || next.startsWith('/onboarding?')) return fallback;
  return next;
}

function OnboardingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const { user, isAuthenticated, checkAuth, setUser } = useAuthStore();

  const next = useMemo(() => safeNextPath(searchParams.get('next'), '/dashboard'), [searchParams]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [dateOfBirth, setDateOfBirth] = useState<string>('');
  const [newsletter, setNewsletter] = useState<boolean>(false);
  const [whatsappUpdates, setWhatsappUpdates] = useState<boolean>(false);
  const [whatsappChannel, setWhatsappChannel] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      console.log('[Onboarding] starting auth check...');
      const ok = await checkAuth();
      console.log('[Onboarding] checkAuth result:', ok);
      if (cancelled) return;

      if (!ok) {
        router.replace(`/login?next=${encodeURIComponent('/onboarding')}`);
        return;
      }

      const u = useAuthStore.getState().user;

      // Non-students should never be here
      if (u?.role && u.role !== 'student') {
        router.replace('/dashboard');
        return;
      }

      // If already completed, just continue
      if (u?.role === 'student' && u?.onboarding_completed) {
        router.replace(next);
        return;
      }

      // Prefill if we already have values
      setDateOfBirth(u?.date_of_birth || '');
      setNewsletter(!!u?.newsletter_opt_in);
      setWhatsappUpdates(!!u?.whatsapp_opt_in);
      setWhatsappChannel(!!u?.whatsapp_channel_opt_in);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [checkAuth, next, router, user]);

  const handleSave = async () => {
    if (!isAuthenticated) return;

    // Minimal validation: require DOB (you can relax this if desired)
    if (!dateOfBirth) {
      toast.error('Bitte gib dein Geburtsdatum an.');
      return;
    }

    setSaving(true);
    try {
      const updated = await usersApi.updateProfile({
        date_of_birth: dateOfBirth,
        newsletter_opt_in: newsletter,
        whatsapp_opt_in: whatsappUpdates,
        whatsapp_channel_opt_in: whatsappChannel,
        onboarding_completed: true,
      });

      // Keep auth store user in sync (users/me returns profile shape)
      if (user) {
        setUser({
          ...user,
          date_of_birth: updated.date_of_birth ?? dateOfBirth,
          newsletter_opt_in: updated.newsletter_opt_in ?? newsletter,
          whatsapp_opt_in: updated.whatsapp_opt_in ?? whatsappUpdates,
          whatsapp_channel_opt_in: updated.whatsapp_channel_opt_in ?? whatsappChannel,
          onboarding_completed: updated.onboarding_completed ?? true,
        });
      }

      toast.success('Profil gespeichert!');
      // Use window.location for reliable redirect after state changes
      window.location.href = next;
    } catch (err: any) {
      console.error('Onboarding save error:', err);
      toast.error(err?.message || 'Speichern fehlgeschlagen');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          Laden...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href={next}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-4 h-4" />
            Später
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 font-medium"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Speichern
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h1 className="text-2xl font-bold text-gray-900">Willkommen, {user?.first_name}!</h1>
            <p className="text-gray-600 mt-1">
              Bitte ergänze kurz dein Profil. Das dauert nur eine Minute.
            </p>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Geburtsdatum *</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-primary-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Wird für personalisierte Inhalte und ggf. Kurs-/Zertifikatsdaten genutzt.
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Kommunikation</label>

              <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={newsletter}
                  onChange={(e) => setNewsletter(e.target.checked)}
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">Newsletter erhalten</div>
                  <div className="text-sm text-gray-600">Tipps, neue Kurse und wichtige Updates per E-Mail.</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={whatsappChannel}
                  onChange={(e) => setWhatsappChannel(e.target.checked)}
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">WhatsApp Channel beitreten</div>
                  <div className="text-sm text-gray-600">Ankündigungen und Erinnerungen im WhatsApp Channel.</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={whatsappUpdates}
                  onChange={(e) => setWhatsappUpdates(e.target.checked)}
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">WhatsApp Benachrichtigungen</div>
                  <div className="text-sm text-gray-600">Direkte Nachrichten (z.B. Kurs-Infos). Optional.</div>
                </div>
              </label>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-900">
              Du kannst diese Einstellungen jederzeit im Profil ändern.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <ToastProvider>
      <OnboardingInner />
    </ToastProvider>
  );
}


