import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiBase = (env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  const proxy = apiBase
    ? {
        '/api': {target: apiBase, changeOrigin: true, secure: true},
        '/health': {target: apiBase, changeOrigin: true, secure: true},
      }
    : undefined;

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      proxy,
      // DISABLE_HMR=true can be used in constrained development environments.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
