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
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            // Block regressions while leaving headroom for ongoing test work.
            // Current baseline: ~75% stmts / 75% branch / 65% funcs / 77% lines.
            thresholds: {
                statements: 70,
                branches: 65,
                functions: 60,
                lines: 72,
            },
        },
    },
    server: {
        allowedHosts: true,
    },
});
