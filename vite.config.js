import { fileURLToPath, URL } from 'node:url'
import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyConvex = env.VITE_CONVEX_PROXY === '1' && env.VITE_CONVEX_URL

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@convex': fileURLToPath(new URL('./convex', import.meta.url)),
      },
    },
    server: {
      port: 4000,
      // See `src/shared/lib/convex/client.js`: with VITE_CONVEX_PROXY=1 the browser talks to
      // this dev server, and Node forwards the HTTP + WebSocket traffic to Convex.
      proxy: proxyConvex
        ? { '/api': { target: env.VITE_CONVEX_URL, changeOrigin: true, ws: true, secure: true } }
        : undefined,
    },
  }
})
