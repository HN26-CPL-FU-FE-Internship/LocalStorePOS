import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        tsconfigPaths: true,
    },
    base: '/restaurant-pos',
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test-setup.ts',
    },
    server: {
        allowedHosts: true,
    },
});
