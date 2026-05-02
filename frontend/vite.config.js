import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        open: true,
        proxy: {
            '/app-version': 'http://localhost:50000',
            '/normalize-book': 'http://localhost:50000',
            '/review-book': 'http://localhost:50000',
            '/bind-book': 'http://localhost:50000',
            '/out': 'http://localhost:50000',
            '/js': 'http://localhost:50000',
            '/css': 'http://localhost:50000',
            '/view': 'http://localhost:50000',
        }
    },
    build: {
        outDir: '../public',
        emptyOutDir: false
    }
});
