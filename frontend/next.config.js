// ===========================================
// WARIZMY EDUCATION - Next.js Konfiguration
// ===========================================

const withPWA = require('next-pwa')({
  dest: 'public',
  // PWA nur in Produktion aktivieren
  disable: process.env.NODE_ENV === 'development',
  // Service Worker Registrierung
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // React Strict Mode
  reactStrictMode: true,
  
  // Bilder von externen Domains erlauben
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ac.warizmy.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'i.vimeocdn.com',
      },
    ],
  },
  
  // Umgebungsvariablen für Client
  env: {
    NEXT_PUBLIC_APP_NAME: 'WARIZMY Education',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  
  // Weiterleitungen (leer - /admin ist jetzt eigenes Dashboard)
  async redirects() {
    return [];
  },
  
  // Header für Sicherheit
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);

