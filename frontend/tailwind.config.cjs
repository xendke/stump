const config = {
    mode: 'jit',
    content: ['./src/**/*.{html,js,svelte,ts}'],

    theme: {
        extend: {
            colors: {
                brand: {
                    // quickly threw together based on logo, might have to tweak it
                    DEFAULT: '#C48259',
                    50: '#F4E8E0',
                    100: '#EFDDD1',
                    200: '#E4C6B3',
                    300: '#D9AF95',
                    400: '#CF9977',
                    500: '#C48259',
                    600: '#A9663C',
                    700: '#7F4D2D',
                    800: '#56341F',
                    900: '#2D1B10'
                }
            }
        }
    },

    plugins: [
        require('tailwind-scrollbar-hide'),
        require('@tailwindcss/forms'),
        require('@tailwindcss/typography')
    ]
};

module.exports = config;
