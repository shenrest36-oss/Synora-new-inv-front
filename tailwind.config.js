// tailwind.config.js — loaded by Tailwind CLI via require(), so module.exports is correct
// even though the rest of the project uses ESM ("type": "module").
let preset;

try {
  preset = require('./shared-theme/tailwind-preset.js');
} catch (err) {
  preset = undefined;
}

/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: 'class',
  presets: preset ? [preset] : [],
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};

module.exports = config;
