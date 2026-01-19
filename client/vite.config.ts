import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: {
        quietDeps: true,
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5185',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    // Warn at a higher threshold but also split large vendor chunks.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined
          const parts = id.split('node_modules/')[1]?.split('/')
          const pkg = parts ? parts[0] : ''
          if (pkg === 'react' || pkg === 'react-dom' || pkg === 'scheduler') return 'vendor-react'
          if (pkg === 'react-bootstrap' || pkg === 'bootstrap') return 'vendor-ui'
          if (pkg.startsWith('@fortawesome')) return 'vendor-icons'
          return undefined
        },
      },
    },
  },
})
