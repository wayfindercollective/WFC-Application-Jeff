import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      // Proxy for n8n webhook (form submission)
      '/api/n8n': {
        target: 'https://wayfindercollective.app.n8n.cloud',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/n8n/, '')
      },
      // Proxy for analytics endpoint
      '/api/analytics': {
        target: 'https://wayfindercollective.app.n8n.cloud',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/analytics/, '/webhook/analytics-stats')
      }
    }
  }
})

