import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        fs: {
            // Prevenir acesso a arquivos fora do diretório do projeto
            strict: true,
            allow: ['.']
        }
    },
    build: {
        outDir: 'dist',
        sourcemap: false,
        // Otimizações para evitar processar node_modules desnecessários
        rollupOptions: {
            external: []
        }
    },
    // Prevenir que Vite processe diretórios pai
    root: path.resolve(__dirname, '.'),
    optimizeDeps: {
        exclude: []
    }
});
