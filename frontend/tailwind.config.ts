import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fef7ee',
          100: '#fdead7',
          200: '#fad2ae',
          300: '#f6b27a',
          400: '#f28844',
          500: '#ee6a1e',
          600: '#df5014',
          700: '#b93b12',
          800: '#932f16',
          900: '#772815',
          950: '#401108',
        },
      },
    },
  },
  plugins: [],
}

export default config
