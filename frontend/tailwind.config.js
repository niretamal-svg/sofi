export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'sofi-purple': '#6B3FA0',
        'sofi-purple-light': '#F3ECFF',
        'sofi-purple-dark': '#4A2366',
        'sofi-teal': '#00C9A7',
        'sofi-teal-light': '#E8FDF7',
        'sofi-teal-dark': '#008A70',
        'status-free': '#10B981',
        'status-paid': '#FBBF24',
        'status-freemium': '#3B82F6',
      },
      fontFamily: {
        'dm-sans': ['DM Sans', 'sans-serif'],
        'dm-mono': ['DM Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      transitionDuration: {
        '150': '150ms',
      },
      spacing: {
        'safe': 'max(1rem, env(safe-area-inset-bottom))',
      },
    },
  },
  plugins: [],
};
