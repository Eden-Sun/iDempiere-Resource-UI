import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiIP = env.VITE_API_IP || '127.0.0.1'

  return {
    base: '/emui/',
    plugins: [vue()],
    server: {
      proxy: {
        '/api': {
          target: `http://${apiIP}:8080`,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: '../web-content',
      assetsDir: 'assets',
      emptyOutDir: true,
    },
  }
})
