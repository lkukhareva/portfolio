import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  // Preserve the published .html URLs and existing document formatting.
  build: { format: 'file' },
  trailingSlash: 'never',
  compressHTML: false,
  server: { host: '127.0.0.1', port: 3000 },
  vite: { server: { strictPort: true } },
});
