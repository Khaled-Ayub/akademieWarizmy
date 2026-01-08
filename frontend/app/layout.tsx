// ===========================================
// WARIZMY EDUCATION - Root Layout
// ===========================================
// Haupt-Layout für die gesamte Anwendung

import type { Metadata, Viewport } from 'next';
import { Outfit, Playfair_Display, Amiri, Poppins } from 'next/font/google';
import './globals.css';
import AnnouncementBanner from '@/components/AnnouncementBanner';

// Schriftarten laden
const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const amiri = Amiri({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-amiri',
  display: 'swap',
});

// Moderne Schriftart für Banner
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

// Metadata für SEO
export const metadata: Metadata = {
  title: {
    default: 'WARIZMY Education - Arabisch & Islamische Bildung',
    template: '%s | WARIZMY Education',
  },
  description: 'Lernplattform für Arabisch und islamische Bildung mit Vor-Ort-Unterricht, Live-Streaming und Aufzeichnungen.',
  keywords: ['Arabisch lernen', 'Islamische Bildung', 'Online-Kurse', 'Quran', 'Tajweed'],
  authors: [{ name: 'WARIZMY Education' }],
  creator: 'WARIZMY Education',
  publisher: 'WARIZMY Education',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    url: 'https://ac.warizmy.com',
    siteName: 'WARIZMY Education',
    title: 'WARIZMY Education - Arabisch & Islamische Bildung',
    description: 'Lernplattform für Arabisch und islamische Bildung',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'WARIZMY Education',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WARIZMY Education',
    description: 'Arabisch & Islamische Bildung',
    images: ['/og-image.jpg'],
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

// Viewport für PWA
export const viewport: Viewport = {
  themeColor: '#008B8B',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

// Root Layout Komponente
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      lang="de" 
      className={`${outfit.variable} ${playfair.variable} ${amiri.variable} ${poppins.variable}`}
    >
      <head>
        {/* Preconnect für externe Ressourcen */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-sans antialiased bg-background-light text-gray-900 min-h-screen">
        {/* Ankündigungs-Banner - erscheint ganz oben */}
        <AnnouncementBanner />
        {children}
      </body>
    </html>
  );
}

