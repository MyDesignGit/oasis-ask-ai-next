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
          purple: '#874487',
          'purple-dark': '#673367',
          pink: '#FF9B9B',
          'pink-light': '#FFE5E5',
        }
      }
    },
  },
  plugins: [],
} satisfies Config;
