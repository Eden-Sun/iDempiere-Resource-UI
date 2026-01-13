import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const testIP = '192.168.1.47'

export default defineConfig({
  // IMPORTANT: this plugin is served under /emui
  base: '/emui/',
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: `http://${process.env.VITE_API_IP || testIP}:8080`,
        changeOrigin: true,
      },
    },
  },
  build: {
    // Output directly to plugin's web root (no extra dist layer)
    outDir: '../web-content',
    assetsDir: 'assets',
    emptyOutDir: true,
  },
})

