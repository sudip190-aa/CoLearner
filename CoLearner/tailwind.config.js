/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: '24px',
      screens: {
        '2xl': '1200px',
      },
    },
    extend: {
      colors: {
        // Mapped through RGB channel variables so Tailwind opacity modifiers
        // (e.g. bg-c-blue-soft/80) work. Hex tokens remain in :root for raw CSS.
        'c-blue': 'rgb(var(--c-blue-rgb) / <alpha-value>)',
        'c-blue-hover': 'rgb(var(--c-blue-hover-rgb) / <alpha-value>)',
        'c-blue-soft': 'rgb(var(--c-blue-soft-rgb) / <alpha-value>)',
        'c-blue-wash': 'rgb(var(--c-blue-wash-rgb) / <alpha-value>)',
        // Alias used by landing sections for alternating / tinted bands.
        // Points at the brand "section wash" token so it stays on-palette.
        'c-bg-subtle': 'rgb(var(--c-blue-wash-rgb) / <alpha-value>)',
        'c-yellow': 'rgb(var(--c-yellow-rgb) / <alpha-value>)',
        'c-yellow-soft': 'rgb(var(--c-yellow-soft-rgb) / <alpha-value>)',
        'c-bg': 'rgb(var(--c-bg-rgb) / <alpha-value>)',
        'c-border': 'rgb(var(--c-border-rgb) / <alpha-value>)',
        'c-text': 'rgb(var(--c-text-rgb) / <alpha-value>)',
        'c-text-muted': 'rgb(var(--c-text-muted-rgb) / <alpha-value>)',
        'c-success': 'rgb(var(--c-success-rgb) / <alpha-value>)',
        'c-warning': 'rgb(var(--c-warning-rgb) / <alpha-value>)',
        'c-danger': 'rgb(var(--c-danger-rgb) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        lg: 'var(--radius-lg)',
        brand: 'var(--radius)',
        'brand-lg': 'var(--radius-lg)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
      },
      maxWidth: {
        content: '1200px',
      },
    },
  },
  plugins: [],
};