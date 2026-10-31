import { defineConfig } from 'vite';

export default defineConfig({
  // Serve real pages only; removed pages/assets must not return the homepage.
  appType: 'mpa',
});
