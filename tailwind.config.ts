import type { Config } from "tailwindcss";

export default {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        oasis: {
          
          purple: '#7e3e7e',
          'purple-dark': '#7e3e7e',
          pink: '#FF9B9B',
          'pink-light': '#FFE5E5',
          'oasis-dark': '#131314',
          'oasis-light-dark': '#1d1e1f',
        }
      }
    },
  },
  plugins: [],
} satisfies Config;
