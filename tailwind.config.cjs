/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');
const rotateX = plugin(function ({ addUtilities }) {
    addUtilities({
        '.rotate-y-180': {
            transform: 'rotateY(180deg)',
        },
    });
});
module.exports = {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    darkMode: 'class',
    theme: {
        container: {
            center: true,
        },
        extend: {
            colors: {
                // Agricultural Theme Colors
                primary: {
                    DEFAULT: '#2d8659', // Rich Green - Main agricultural color
                    light: '#e8f5e9',
                    'dark-light': 'rgba(45,134,89,.15)',
                    50: '#f0fdf4',
                    100: '#dcfce7',
                    200: '#bbf7d0',
                    300: '#86efac',
                    400: '#4ade80',
                    500: '#2d8659',
                    600: '#16a34a',
                    700: '#15803d',
                    800: '#166534',
                    900: '#14532d',
                },
                secondary: {
                    DEFAULT: '#8b6914', // Golden Wheat - Secondary agricultural color
                    light: '#fef3c7',
                    'dark-light': 'rgb(139 105 20 / 15%)',
                },
                success: {
                    DEFAULT: '#22c55e', // Fresh Green - Success state
                    light: '#dcfce7',
                    'dark-light': 'rgba(34,197,94,.15)',
                },
                danger: {
                    DEFAULT: '#ef4444',
                    light: '#fee2e2',
                    'dark-light': 'rgba(239,68,68,.15)',
                },
                warning: {
                    DEFAULT: '#f59e0b', // Amber - Warning for agricultural alerts
                    light: '#fef3c7',
                    'dark-light': 'rgba(245,158,11,.15)',
                },
                info: {
                    DEFAULT: '#3b82f6', // Sky Blue - Information
                    light: '#dbeafe',
                    'dark-light': 'rgba(59,130,246,.15)',
                },
                // Agricultural specific colors
                earth: {
                    DEFAULT: '#8b4513', // Earth brown
                    light: '#f5e6d3',
                },
                harvest: {
                    DEFAULT: '#f59e0b', // Harvest gold
                    light: '#fef3c7',
                },
                crop: {
                    DEFAULT: '#16a34a', // Crop green
                    light: '#dcfce7',
                },
                dark: {
                    DEFAULT: '#3b3f5c',
                    light: '#eaeaec',
                    'dark-light': 'rgba(59,63,92,.15)',
                },
                black: {
                    DEFAULT: '#0e1726',
                    light: '#e3e4eb',
                    'dark-light': 'rgba(14,23,38,.15)',
                },
                white: {
                    DEFAULT: '#ffffff',
                    light: '#e0e6ed',
                    dark: '#888ea8',
                },
            },
            fontFamily: {
                nunito: ['Nunito', 'sans-serif'],
            },
            spacing: {
                4.5: '18px',
            },
            boxShadow: {
                '3xl': '0 2px 2px rgb(224 230 237 / 46%), 1px 6px 7px rgb(224 230 237 / 46%)',
            },
            typography: ({ theme }) => ({
                DEFAULT: {
                    css: {
                        '--tw-prose-invert-headings': theme('colors.white.dark'),
                        '--tw-prose-invert-links': theme('colors.white.dark'),
                        h1: { fontSize: '40px', marginBottom: '0.5rem', marginTop: 0 },
                        h2: { fontSize: '32px', marginBottom: '0.5rem', marginTop: 0 },
                        h3: { fontSize: '28px', marginBottom: '0.5rem', marginTop: 0 },
                        h4: { fontSize: '24px', marginBottom: '0.5rem', marginTop: 0 },
                        h5: { fontSize: '20px', marginBottom: '0.5rem', marginTop: 0 },
                        h6: { fontSize: '16px', marginBottom: '0.5rem', marginTop: 0 },
                        p: { marginBottom: '0.5rem' },
                        li: { margin: 0 },
                        img: { margin: 0 },
                    },
                },
            }),
        },
    },
    plugins: [
        require('@tailwindcss/forms')({
            strategy: 'class',
        }),
        require('@tailwindcss/typography'),
        rotateX,
    ],
};
