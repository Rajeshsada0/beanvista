import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
    ],
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    // Split heavy vendor libs into separate chunks
                    'vendor-react': ['react', 'react-dom', 'react/jsx-runtime'],
                    'vendor-inertia': ['@inertiajs/react', '@inertiajs/core'],
                    'vendor-recharts': ['recharts'],
                    'vendor-lucide': ['lucide-react'],
                    'vendor-utils': ['axios'],
                },
            },
        },
        // Raise chunk size warning threshold to avoid false alerts
        chunkSizeWarningLimit: 1000,
    },
});
