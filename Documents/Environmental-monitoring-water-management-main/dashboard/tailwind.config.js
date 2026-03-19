/** @type {import('tailwindcss').Config} */
export default {
    darkMode: "class",
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                border: "hsl(var(--border))",
                bg: {
                    main: "hsl(var(--bg-main))",
                    card: "hsl(var(--bg-card))",
                },
                text: {
                    main: "hsl(var(--text-main))",
                    muted: "hsl(var(--text-muted))",
                }
            }
        },
    },
    plugins: [],
}
