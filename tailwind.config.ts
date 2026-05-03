import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'navy': '#0f172a',
        'navy-light': '#1e293b',
        'coral': '#ff6b6b',
        'coral-light': '#ff8787',
        'lotus': '#f5f5f5',
      },
    },
  },
  plugins: [],
}
export default config
