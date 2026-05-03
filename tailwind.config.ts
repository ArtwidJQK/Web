import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'navy': '#080B10',
        'navy-light': '#111722',
        'surface': '#151B26',
        'surface-strong': '#1E2633',
        'coral': '#FF7A59',
        'coral-light': '#FF9A7E',
        'lotus': '#F4F1EA',
      },
      boxShadow: {
        'lift': '0 16px 40px rgba(0, 0, 0, 0.18)',
      },
    },
  },
  plugins: [],
}
export default config
