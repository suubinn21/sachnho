import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { booksTxtCatalogPlugin } from './plugins/viteBooksTxtPlugin';

export default defineConfig({
  plugins: [react(), tailwindcss(), booksTxtCatalogPlugin()],
  optimizeDeps: {
    exclude: ['pdfjs-dist'],
  },
});
