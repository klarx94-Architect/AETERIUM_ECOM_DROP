/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Satoshi', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      colors: {
        phantom: {
          bg:        '#0E0E10',
          surface:   '#141416',
          surface2:  '#1C1C1F',
          border:    '#2A2A2E',
          'border-gold': 'rgba(245,158,11,0.18)',
          text:      '#E8E8EA',
          muted:     '#7A7A82',
          faint:     '#4A4A52',
          gold:      '#F59E0B',
          'gold-light': '#FCD34D',
          'gold-dim': 'rgba(245,158,11,0.12)',
          'gold-glow': 'rgba(245,158,11,0.06)',
          green:     '#10B981',
          'green-dim': 'rgba(16,185,129,0.12)',
          red:       '#EF4444',
          'red-dim': 'rgba(239,68,68,0.12)',
          yellow:    '#EAB308',
          'yellow-dim': 'rgba(234,179,8,0.12)',
        }
      },
      boxShadow: {
        'phantom-sm': '0 1px 3px rgba(0,0,0,0.4)',
        'phantom-md': '0 4px 16px rgba(0,0,0,0.5)',
        'phantom-lg': '0 12px 40px rgba(0,0,0,0.6)',
        'gold-glow':  '0 0 20px rgba(245,158,11,0.15)',
        'gold-btn':   '0 4px 14px rgba(245,158,11,0.25)',
      },
      borderRadius: {
        'xl2': '1rem',
        'xl3': '1.25rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in': 'slideIn 0.35s cubic-bezier(0.16,1,0.3,1)',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.8s ease-in-out infinite',
        'count-up': 'countUp 0.6s cubic-bezier(0.16,1,0.3,1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        pulseGold: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        countUp: {
          '0%': { opacity: '0', transform: 'translateY(10px) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' }
        }
      }
    }
  },
  plugins: [],
}
