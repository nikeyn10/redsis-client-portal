import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        monday: {
          blue: '#0073EA',
          'blue-dark': '#0060B9',
          'blue-light': '#E6F3FF',
        },
      },
    },
  },
  plugins: [forms],
}
export default config