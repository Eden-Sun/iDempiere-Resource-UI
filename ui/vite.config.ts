import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // IMPORTANT: this plugin is served under /emui
  base: '/emui/',
  plugins: [vue()],
  build: {
    outDir: '../web-content/dist',
    assetsDir: 'assets',
    emptyOutDir: true,
  },
})

