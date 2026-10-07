/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Switzer — one clean modern grotesque across the whole site.
        sans: ['Switzer', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Switzer', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['Switzer', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Switzer', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        elegant: ['Switzer', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // --- Brand palette v2.0 (jewel tones) ---
        plum: '#39234E',
        'plum-deep': '#39234E',
        // Status colours — admin-only, theme-aware (index.css --adm-*)
        blue: 'rgb(var(--adm-done) / <alpha-value>)',
        mauve: 'rgb(var(--adm-cancelled) / <alpha-value>)',
        coral: 'rgb(var(--adm-pending) / <alpha-value>)',
        'coral-deep': 'rgb(var(--adm-pending-text) / <alpha-value>)',
        // --- Secondary accent: periwinkle (in-family blue, harmonizes w/ violet/indigo) ---
        sky: '#7A7FD1',
        // --- Accent: a single violet (plum family) for the whole public site ---
        moon: '#6B3FA0',
        'moon-bright': '#6B3FA0',
        'moon-deep': '#6B3FA0',
        'moon-mist': '#6B3FA0',
        charcoal: '#564D4D',
        'charcoal-deep': '#3A3234',
        sage: 'rgb(var(--adm-confirmed) / <alpha-value>)',
        cream: '#FFFFFF',
        ink: '#211E2E',
        // --- Semantic tokens ---
        taupe: '#8A7D7D',
        paper: '#FFFFFF',
        'paper-2': '#EAE0D5',
        'paper-3': '#E0D4C6',
        line: '#E7E5E1',
        espresso: '#2C1B3E',
        // --- Back-compat aliases ---
        terracotta: '#F19F58',
        'terracotta-dark': '#DA8636',
        gold: '#F19F58',
        'gold-soft': '#F0A15C',
        lilac: 'rgb(var(--adm-accent) / <alpha-value>)',
        'lilac-dark': 'rgb(var(--adm-accent-deep) / <alpha-value>)',
        'gold-accent': 'rgb(var(--adm-accent) / <alpha-value>)',
        // --- Admin dashboard dark theme ---
        'teal-accent': 'rgb(var(--adm-accent-2) / <alpha-value>)',
        'teal-dark': 'rgb(var(--adm-accent) / <alpha-value>)',
        'bg-dark': 'var(--adm-bg-dark)',
        'bg-deep': 'var(--adm-bg-deep)',
        'surface-1': 'var(--adm-surface-1)',
        'surface-2': 'var(--adm-surface-2)',
        'surface-highlight': 'var(--adm-surface-highlight)',
        'text-light': 'var(--adm-text-light)',
        'text-subtle': 'var(--adm-text-subtle)',
        'adm-line': 'var(--adm-line)',
        'adm-line-2': 'var(--adm-line-2)',
        'adm-line-3': 'var(--adm-line-3)',
        'adm-hover': 'var(--adm-hover)',
        'adm-hover-2': 'var(--adm-hover-2)',
        'adm-hover-3': 'var(--adm-hover-3)',
        'adm-ink': 'var(--adm-text-light)',
      },
      animation: {
        'pulse-slow': 'pulse 5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-slower': 'pulse 7s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 15s linear infinite',
        'spin-reverse-slow': 'spin-reverse 20s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 3s infinite',
        'float-slow': 'float 10s ease-in-out infinite',
        'float-slower': 'float 14s ease-in-out infinite',
        'scroll': 'scroll 160s linear infinite',
        'bounce-slow': 'bounce 2s infinite',
        'fade-up': 'fade-up 0.55s cubic-bezier(0.22,1,0.36,1) both',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'spin-reverse': {
          'from': { transform: 'rotate(360deg)' },
          'to': { transform: 'rotate(0deg)' },
        },
        scroll: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};
