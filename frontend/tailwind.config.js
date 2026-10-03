/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'wa-teal': '#00a884',
        'wa-teal-dark': '#008069',
        'wa-bg-chat': '#efeae2',
        'wa-bubble-in': '#ffffff',
        'wa-bubble-out': '#d9fdd3',
        'wa-bubble-bot': '#e0f2fe',
        'wa-gray-bg': '#f0f2f5',
        'wa-gray-panel': '#ffffff',
        'wa-gray-hover': '#f5f6f6',
        'wa-dark-bg': '#111b21',
        'wa-dark-panel': '#202c33',
        'wa-dark-bubble-out': '#005c4b',
        'wa-dark-bubble-in': '#202c33',
      }
    },
  },
  plugins: [],
}
