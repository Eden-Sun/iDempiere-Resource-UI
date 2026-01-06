import daisyui from 'daisyui'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,vue}'],
  safelist: [
    // Dynamic resource colors
    { pattern: /bg-(blue|red|green|purple|orange|cyan|pink)-(100|200|500)/ },
    { pattern: /text-(blue|red|green|purple|orange|cyan|pink)-(600|700)/ },
    { pattern: /border-(blue|red|green|purple|orange|cyan|pink)-500/ },
  ],
  plugins: [daisyui],
  daisyui: {},
}

