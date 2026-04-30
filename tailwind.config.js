/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/hooks/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ════════════════════════════════════════════════════════════════════
        // ProofGrid Worker Prototype — Clean Deep Void Theme
        // ════════════════════════════════════════════════════════════════════
        
        void: '#07090E',    // Main background
        base: '#0B0D14',    // Subtle raised
        surface: '#0F1119', // Cards secondary
        card: '#131720',    // Primary card bg
        'card-h': '#171C28', // Card hover
        raised: '#1C2130',  // Elevated bg
        
        // Text colors
        't1': '#EEF2FF',    // Primary text
        't2': '#8892A8',    // Secondary text
        't3': '#454F64',    // Tertiary/muted text
        't4': '#252C3D',    // Extra muted
        
        // Primary brand color (Pi Network Blue)
        pi: '#0095FF',      // Base
        'pi-lt': '#38B2FF', // Light variant
        'pi-dim': 'rgba(0,149,255,0.13)',
        'pi-glow': 'rgba(0,149,255,0.22)',
        
        // Success/Go green
        go: '#00D68F',
        'go-dim': 'rgba(0,214,143,0.13)',
        
        // Warning amber
        warn: '#FFB020',
        'warn-dim': 'rgba(255,176,32,0.13)',
        
        // Stop/error red
        stop: '#FF4757',
        'stop-dim': 'rgba(255,71,87,0.13)',
        
        // Pulse purple
        pulse: '#A78BFA',
        'pulse-dim': 'rgba(167,139,250,0.13)',
        
        // Borders
        line: 'rgba(255,255,255,0.07)',
        'line-md': 'rgba(255,255,255,0.12)',
        'line-hi': 'rgba(255,255,255,0.18)',
      },

      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '18px',
        'xl': '24px',
        'pill': '100px',
      },

      boxShadow: {
        // Glassmorphism
        'glass': '0 12px 40px rgba(0,0,0,.5)',
      },

      animation: {
        // Glow and motion
        'glow': 'glow 2s ease-in-out infinite',
      },

      keyframes: {
        glow: {
          '0%, 100%': { boxShadow: '0 0 12px rgba(0, 229, 229, 0.15)' },
          '50%': { boxShadow: '0 0 20px rgba(0, 229, 229, 0.25)' },
        },
      },
    },
  },
  plugins: [
    // Custom plugin to ensure brand colors consistency
    function({ addBase, theme }) {
      addBase({
        body: {
          backgroundColor: theme('colors.brand.dark'),
          color: theme('colors.brand.text'),
        },
      });
    },
  ],
};
