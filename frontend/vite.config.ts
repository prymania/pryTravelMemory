import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor':   ['react', 'react-dom', 'react-router-dom'],
          'query':          ['@tanstack/react-query'],
          'motion':         ['framer-motion'],
          'leaflet':        ['leaflet', 'react-leaflet', 'react-leaflet-cluster'],
          'lightbox':       ['yet-another-react-lightbox'],
          'date':           ['date-fns'],
          'icons':          ['lucide-react'],
        },
      },
    },
  },
})
