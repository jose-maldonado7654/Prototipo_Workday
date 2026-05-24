import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    // Elimina la configuración manualChunks que está causando el error
    // O usa una función en su lugar:
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor-react'
            if (id.includes('lucide-react')) return 'vendor-icons'
            if (id.includes('@supabase')) return 'vendor-supabase'
            return 'vendor'
          }
        }
      }
    }
  },
  preview: {
    port: 4173,
    host: true
  }
})