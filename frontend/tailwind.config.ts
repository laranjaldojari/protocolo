import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Verde Jari — identidade do sistema
        jari: {
          50: '#EFF7F4', 100: '#D8EDE5', 200: '#B0DACB', 300: '#7FC0AA',
          400: '#4B9E85', 500: '#2C7F68', 600: '#1B6653', 700: '#134F41',
          800: '#0F3E34', 900: '#0B2F28', 950: '#061B17',
        },
        rio: { 500: '#C99B3F', 600: '#AD8331' }, // dourado do rio ao entardecer
        status: {
          aberto: '#1D6FB8', andamento: '#2C7F68', pendente: '#B8860B',
          concluido: '#3D7A2E', arquivado: '#6B7280', cancelado: '#B3402A',
        },
      },
      fontFamily: {
        display: ['var(--font-display)'],
        sans: ['var(--font-body)'],
        mono: ['var(--font-mono)'],
      },
    },
  },
  plugins: [],
} satisfies Config;
