/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    50: '#f9f8f6', // Cream base
                    100: '#f2efe9',
                    200: '#e6ded4', // Sandstone
                    300: '#d5c6b5',
                    400: '#bea490', // Taupe
                    500: '#a98069',
                    600: '#946353',
                    700: '#7b4e43',
                    800: '#65403a',
                    900: '#533633',
                },
                ink: {
                    900: '#0f172a', // Ink Blue/Black
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
