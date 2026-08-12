/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    darkMode: 'class', // Enable class-based dark mode
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#00B4D8',
                    50: '#E6F7FB',
                    100: '#CCF0F7',
                    200: '#99E1EF',
                    300: '#66D2E7',
                    400: '#33C3DF',
                    500: '#00B4D8',
                    600: '#0090AD',
                    700: '#006C82',
                    800: '#004856',
                    900: '#00242B',
                    950: '#001317',
                },
                navy: {
                    DEFAULT: '#3D5A99',
                    50: '#EEF1F8',
                    100: '#DDE3F1',
                    200: '#BBC7E3',
                    300: '#99ABD5',
                    400: '#6E83BC',
                    500: '#3D5A99',
                    600: '#314880',
                    700: '#253660',
                    800: '#192440',
                    900: '#0C1220',
                    950: '#060910',
                },
                accent: {
                    DEFAULT: '#ADE8F4',
                    light: '#CAEEF7',
                    dark: '#90E0EE',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
