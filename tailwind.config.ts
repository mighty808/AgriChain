import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['selector', '[class~="dark"]'],
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}

export default config
