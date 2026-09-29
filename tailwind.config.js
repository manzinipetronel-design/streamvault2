/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        void: 'var(--void)',
        'void-2': 'var(--void-2)',
        'void-3': 'var(--void-3)',
        glass: 'var(--glass)',
        'glass-border': 'var(--glass-border)',
        'glass-hover': 'var(--glass-hover)',
        violet: 'var(--violet)',
        'violet-light': 'var(--violet-light)',
        'violet-dim': 'var(--violet-dim)',
        magenta: 'var(--magenta)',
        gold: 'var(--gold)',
        cyan: 'var(--cyan)',
        'cyan-dim': 'var(--cyan-dim)',
        foreground: 'var(--foreground)',
        muted: 'var(--muted)',
        'muted-strong': 'var(--muted-strong)',
        'muted-2': 'var(--muted-2)',
      },
      fontFamily: {
        display: ['var(--font-unbounded)', 'sans-serif'],
        sans: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-violet': 'var(--glow-violet)',
        'glow-cyan': 'var(--glow-cyan)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('tailwindcss-animate'),
  ],
};
