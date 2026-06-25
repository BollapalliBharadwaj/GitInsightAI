/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      /* =============================================
         COLOR PALETTE — Blue-centric dark SaaS theme
         ============================================= */
      colors: {
        primary: {
          50:  '#fdf6f4',
          100: '#fbece8',
          200: '#f6d0c6',
          300: '#eba594',
          400: '#db755e',
          500: '#c8533c', // Rich terracotta/rust primary accent
          600: '#b1412b',
          700: '#94311e',
          800: '#7a2b1b',
          900: '#662619',
          950: '#38110a',
        },
        surface: {
          50:  '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#373431', // Warm charcoal
          800: '#23201d', // Very dark warm grey/graphite
          900: '#151311', // Obsidian/Earthy black
          950: '#0c0a09', // Pitch deep warm black
        },
        accent: {
          blue:   '#e07a5f', // Muted copper
          purple: '#9e7b9b', // Clay purple
          cyan:   '#81b29a', // Sage green
          green:  '#689f38', // Moss green
          orange: '#dfa06c', // Warm gold
          red:    '#d32f2f', // Muted red
          pink:   '#b0bec5', // Steel slate
        },
        /* Semantic tokens */
        success: { DEFAULT: '#689f38', light: '#f1f8e9', dark: '#33691e' },
        warning: { DEFAULT: '#dfa06c', light: '#fff8e1', dark: '#ff6f00' },
        error:   { DEFAULT: '#d32f2f', light: '#ffebee', dark: '#b71c1c' },
        info:    { DEFAULT: '#e07a5f', light: '#fbe9e7', dark: '#d84315' },
      },

      /* =============================================
         TYPOGRAPHY
         ============================================= */
      fontFamily: {
        sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
      lineHeight: {
        tighter: '1.15',
      },

      /* =============================================
         SPACING SCALE (extends Tailwind defaults)
         ============================================= */
      spacing: {
        '4.5': '1.125rem',
        '13':  '3.25rem',
        '15':  '3.75rem',
        '18':  '4.5rem',
        '22':  '5.5rem',
        '26':  '6.5rem',
        '30':  '7.5rem',
        '34':  '8.5rem',
      },

      /* =============================================
         BORDER RADIUS
         ============================================= */
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },

      /* =============================================
         BOX SHADOWS — Glassmorphism + glow effects
         ============================================= */
      boxShadow: {
        'glass':        '0 8px 32px 0 rgba(19, 15, 12, 0.35)',
        'glass-lg':     '0 12px 48px 0 rgba(19, 15, 12, 0.45)',
        'glass-xl':     '0 20px 60px 0 rgba(19, 15, 12, 0.55)',
        'glow-blue':    '0 0 20px rgba(200, 83, 60, 0.25)', // Primary terracotta glow
        'glow-blue-lg': '0 0 40px rgba(200, 83, 60, 0.4)',
        'glow-purple':  '0 0 20px rgba(158, 123, 155, 0.25)',
        'glow-cyan':    '0 0 20px rgba(129, 178, 154, 0.25)',
        'glow-green':   '0 0 20px rgba(104, 159, 56, 0.25)',
        'glow-red':     '0 0 20px rgba(211, 47, 47, 0.25)',
        'inner-glow':   'inset 0 1px 0 rgba(255,255,255,0.05)',
        'card':         '0 4px 24px rgba(0, 0, 0, 0.5)',
        'card-hover':   '0 8px 40px rgba(0, 0, 0, 0.7)',
        'modal':        '0 24px 80px rgba(0, 0, 0, 0.8)',
      },

      /* =============================================
         BACKDROP BLUR
         ============================================= */
      backdropBlur: {
        xs: '2px',
        '4xl': '72px',
      },

      /* =============================================
         ANIMATIONS
         ============================================= */
      animation: {
        'fade-in':         'fadeIn 0.4s ease-out',
        'fade-out':        'fadeOut 0.3s ease-in',
        'slide-up':        'slideUp 0.45s ease-out',
        'slide-down':      'slideDown 0.3s ease-out',
        'slide-left':      'slideLeft 0.35s ease-out',
        'slide-right':     'slideRight 0.35s ease-out',
        'scale-in':        'scaleIn 0.3s ease-out',
        'scale-out':       'scaleOut 0.2s ease-in',
        'pulse-soft':      'pulseSoft 2.5s ease-in-out infinite',
        'gradient-shift':  'gradientShift 8s ease infinite',
        'shimmer':         'shimmer 2s linear infinite',
        'spin-slow':       'spin 3s linear infinite',
        'bounce-soft':     'bounceSoft 1s ease-in-out infinite',
        'float':           'float 3s ease-in-out infinite',
        'toast-in':        'toastIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'toast-out':       'toastOut 0.3s ease-in',
        'progress':        'progress 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:       { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        fadeOut:      { '0%': { opacity: '1' }, '100%': { opacity: '0' } },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%':   { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeft: {
          '0%':   { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideRight: {
          '0%':   { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn:   {
          '0%':   { opacity: '0', transform: 'scale(0.93)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        scaleOut:  {
          '0%':   { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.93)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.65' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-700px 0' },
          '100%': { backgroundPosition: '700px 0' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        toastIn: {
          '0%':   { opacity: '0', transform: 'translateX(100%) scale(0.9)' },
          '100%': { opacity: '1', transform: 'translateX(0) scale(1)' },
        },
        toastOut: {
          '0%':   { opacity: '1', transform: 'translateX(0) scale(1)' },
          '100%': { opacity: '0', transform: 'translateX(100%) scale(0.9)' },
        },
        progress: {
          '0%':   { transform: 'translateX(-100%)' },
          '50%':  { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },

      /* =============================================
         Z-INDEX SCALE
         ============================================= */
      zIndex: {
        '60':  '60',
        '70':  '70',
        '80':  '80',
        '90':  '90',
        '100': '100',
      },
    },
  },
  plugins: [],
}
