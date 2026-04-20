/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx}'],
    theme: {
      extend: {
        fontFamily: {
          sans: ['DM Sans', 'sans-serif'],
          mono: ['JetBrains Mono', 'monospace'],
        },
        colors: {
          brand: {
            50:  '#eef6ff',
            100: '#d9eaff',
            200: '#bbd8ff',
            300: '#8cbeff',
            400: '#569aff',
            500: '#2f74ff',
            600: '#1a52f5',
            700: '#133de1',
            800: '#1633b6',
            900: '#172e8f',
          },
          surface: {
            DEFAULT: '#0f1117',
            card:    '#161b27',
            border:  '#222840',
            hover:   '#1e2438',
          },
        },
        animation: {
          'fade-in':    'fadeIn .3s ease',
          'slide-up':   'slideUp .3s ease',
          'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        },
        keyframes: {
          fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
          slideUp:   { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
          pulseSoft: { '0%,100%': { opacity: 1 }, '50%': { opacity: .6 } },
        },
      },
    },
    plugins: [],
  }