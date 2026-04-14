/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: '#0a0e1a',
        'ios-blue': '#0A84FF',
        'ios-green': '#30D158',
        'ios-orange': '#FF9F0A',
        'ios-red': '#FF453A',
        'ios-purple': '#BF5AF2',
      },
      borderRadius: {
        card: '20px',
        input: '12px',
        badge: '24px',
        pill: '999px',
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-out both',
        fadeInUp: 'fadeInUp 0.4s ease-out both',
        slideUp: 'slideUp 0.3s ease-out both',
        heartBurst: 'heartBurst 0.3s ease-in-out',
        shimmer: 'shimmer 1.5s infinite',
        floatOrb: 'floatOrb 15s ease-in-out infinite alternate',
        floatOrb2: 'floatOrb2 15s ease-in-out infinite alternate',
        floatOrb3: 'floatOrb3 15s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        heartBurst: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.3)' },
          '100%': { transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        floatOrb: {
          '0%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(30px, -20px) scale(1.05)' },
          '100%': { transform: 'translate(0, 0) scale(1)' },
        },
        floatOrb2: {
          '0%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(-20px, 15px) scale(1.08)' },
          '100%': { transform: 'translate(0, 0) scale(1)' },
        },
        floatOrb3: {
          '0%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(15px, 25px) scale(0.95)' },
          '100%': { transform: 'translate(0, 0) scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
