/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      // Behåll alla dina befintliga färger och andra inställningar
      colors: {
        'space': {
          black: '#0A0D14',
          darker: '#12151C',
          dark: '#1A1E27',
          DEFAULT: '#232837',
          light: '#2C3444',
          lighter: '#354052'
        },
        'saber': {
          blue: {
            100: '#E3F2FD',
            200: '#90CAF9',
            300: '#42A5F5',
            400: '#1E88E5',
            500: '#0D47A1',
            600: '#082C6B',
            glow: '#1E88E580'
          },
          red: {
            100: '#FFEBEE',
            200: '#EF9A9A',
            300: '#E57373',
            400: '#DC2626',
            500: '#B91C1C',
            600: '#7F1D1D',
            glow: '#DC262680'
          }
        },
        'holo': {
          blue: '#64B5F6',
          purple: '#B39DDB',
          cyan: '#4DD0E1',
          glow: '#64B5F640'
        },
        'space-dark': '#1a1b26',
        'space-darker': '#16161e',
      },
      fontFamily: {
        orbitron: ['Orbitron', 'system-ui', '-apple-system', 'sans-serif'],
        titillium: ['Titillium Web', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backgroundImage: {
        'space-gradient': 'linear-gradient(to bottom, rgba(10, 13, 20, 0.8), rgba(26, 30, 39, 0.8))',
        'hero-pattern': `radial-gradient(circle at 50% 50%, 
          rgba(30, 136, 229, 0.1) 0%, 
          rgba(10, 13, 20, 0) 50%
        )`,
        'grid-pattern': `linear-gradient(to right, rgba(255,255,255,.05) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255,255,255,.05) 1px, transparent 1px)`,
        'dots-pattern': `radial-gradient(circle at 1px 1px, rgba(255,255,255,.05) 1px, transparent 0)`,
        'glow-pattern': `
          radial-gradient(circle at 50% 0%, rgba(30, 136, 229, 0.15), transparent 40%),
          radial-gradient(circle at 0% 50%, rgba(220, 38, 38, 0.1), transparent 40%)
        `,
        'space-pattern': "url('/patterns/space.svg')",
      },
      backgroundSize: {
        'grid': '30px 30px',
        'dots': '20px 20px',
      },
      boxShadow: {
        'neon-blue': '0 0 15px rgba(59, 130, 246, 0.5)',
        'neon-red': '0 0 15px rgba(239, 68, 68, 0.5)',
        'neon-yellow': '0 0 15px rgba(234, 179, 8, 0.5)',
        'holo': '0 0 15px theme(colors.holo.glow)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'hologram': 'hologram 2s ease-in-out infinite alternate'
      },
      // Nya tillägg för bättre z-index hantering
      zIndex: {
        '0': '0',
        '10': '10',
        '20': '20',
        '30': '30',
        '40': '40',
        '50': '50',
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
        'auto': 'auto',
        'dropdown': '1000',
        'modal': '1100',
        'tooltip': '1200'
      },
      // Förbättrad layout-kontroll
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      height: {
        'screen-dynamic': ['100vh', '100dvh'],
        'screen-small': ['100vh', '-webkit-fill-available'],
      },
      // Keyframes för animationer
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(100, 181, 246, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(100, 181, 246, 0.8)' }
        },
        hologram: {
          '0%': { opacity: 0.8, filter: 'brightness(1) blur(0px)' },
          '100%': { opacity: 1, filter: 'brightness(1.2) blur(0.5px)' }
        }
      }
    }
  },
  variants: {
    extend: {
      height: ['responsive'],
      overflow: ['responsive'],
    },
  },
}