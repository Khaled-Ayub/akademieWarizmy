// ===========================================
// WARIZMY EDUCATION - Tailwind CSS Konfiguration
// ===========================================

/** @type {import('tailwindcss').Config} */
module.exports = {
  // Dark Mode via Klasse
  darkMode: 'class',
  
  // Content-Pfade
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  
  theme: {
    extend: {
      // Benutzerdefinierte Farben
      colors: {
        // Primärfarbe (Petrol/Türkis - islamische Ästhetik)
        primary: {
          50: '#e6f7f7',
          100: '#ccefef',
          200: '#99dfdf',
          300: '#66cfcf',
          400: '#33bfbf',
          500: '#008B8B', // Hauptfarbe
          600: '#007070',
          700: '#005555',
          800: '#003b3b',
          900: '#002020',
        },
        // Sekundärfarbe (Gold/Amber)
        secondary: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#C5930A', // Hauptfarbe
          600: '#a07608',
          700: '#7a5906',
          800: '#553d04',
          900: '#2f2102',
        },
        // Hintergrund
        background: {
          light: '#FAFAF9',
          dark: '#1A1A2E',
        },
      },
      
      // Benutzerdefinierte Schriftarten
      fontFamily: {
        // Arabische Schrift
        arabic: ['Amiri', 'serif'],
        // Moderne serifenlose Schrift
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        // Überschriften
        heading: ['Playfair Display', 'serif'],
      },
      
      // Hintergrundbilder
      backgroundImage: {
        // Geometrisches islamisches Muster
        'pattern-geometric': "url('/patterns/geometric.svg')",
        // Gradient
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      
      // Animationen
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      
      // Box Shadow
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      
      // Border Radius
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
    },
  },
  
  plugins: [],
};

