/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: generatePrimeVueColors(),
    },
  },
  plugins: [],
};

function generatePrimeVueColors() {
  const colors = {};
  const variants = [
    '',
    '-50',
    '-100',
    '-200',
    '-300',
    '-400',
    '-500',
    '-600',
    '-700',
    '-800',
    '-900',
  ];

  ['primary', 'secondary', 'success', 'info', 'warning', 'danger'].forEach(color => {
    variants.forEach(variant => {
      colors[`${color}${variant}`] = `var(--p-${color}${variant})`;
    });
  });

  return colors;
}
