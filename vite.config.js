import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
<<<<<<< HEAD
import tailwindcss from '@tailwindcss/vite';
=======
import react from '@vitejs/plugin-react';
>>>>>>> origin/final

export default defineConfig({
    plugins: [
        laravel({
<<<<<<< HEAD
            input: ['resources/css/app.css', 'resources/js/app.js'],
            refresh: true,
        }),
        tailwindcss(),
=======
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
>>>>>>> origin/final
    ],
});
