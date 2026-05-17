import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#08080A',
        surface: '#111116',
        'surface-2': '#18181E',
        border: '#222228',
        text: '#F4F4F5',
        muted: '#71717A',
        accent: '#FF3C5F',
        'accent-glow': 'rgba(255, 60, 95, 0.15)',
        gold: '#FFD60A',
        'vote-yes': '#4ADE80',
        'vote-no': '#F87171',
      },
      fontFamily: {
        display: ['Unbounded', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'reveal': {
          '0%': { opacity: '0', transform: 'scale(0.95) translateY(6px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'modal-in': {
          '0%': { opacity: '0', transform: 'translateY(20px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'reveal': 'reveal 0.45s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'modal-in': 'modal-in 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        shimmer: 'shimmer 2s linear infinite',
        'spin-slow': 'spin-slow 0.8s linear infinite',
      },
    },
  },
  plugins: [],
}

export default config
