import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  // Allow preview to accept requests for the Railway-generated host.
  // Add any other frontend hostnames you configure in Railway here.
  preview: {
    // Replace or extend this list with your production frontend host if needed
    allowedHosts: ['cvr-asesoria-legal-y-contable-production.up.railway.app']
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser'
  },
  define: {
    'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || '')
  }
})
