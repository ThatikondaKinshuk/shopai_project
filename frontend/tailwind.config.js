/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        ink: '#0D0D0D',
        paper: '#F5F0E8',
        cream: '#FAF7F2',
        amber: { DEFAULT: '#D97706', light: '#FDE68A', dark: '#92400E' },
        forest: { DEFAULT: '#065F46', light: '#D1FAE5', dark: '#022C22' },
        rouge: { DEFAULT: '#9B1C1C', light: '#FEE2E2' },
        slate: { 50: '#F8FAFC', 100: '#F1F5F9', 200: '#E2E8F0', 700: '#334155', 900: '#0F172A' },
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease forwards',
        'slide-up': 'slideUp 0.5s ease forwards',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        pulseSoft: { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.6 } },
      },
    },
  },
  plugins: [],
}
