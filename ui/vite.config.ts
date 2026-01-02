import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // IMPORTANT: this plugin is served under /emui
  base: '/emui/',
  plugins: [vue()],
  build: {
    // Output directly to plugin's web root (no extra dist layer)
    outDir: '../web-content',
    assetsDir: 'assets',
    emptyOutDir: true,
  },
})

