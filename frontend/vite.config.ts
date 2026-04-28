import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const backendTarget = 'http://localhost:8080';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true,
      },
      '/instance': {
        target: backendTarget,
        changeOrigin: true,
      },
      '/webhook': {
        target: backendTarget,
        changeOrigin: true,
      },
      '/chatwoot': {
        target: backendTarget,
        changeOrigin: true,
      },
      '/user': {
        target: backendTarget,
        changeOrigin: true,
      },
      '/chat': {
        target: backendTarget,
        changeOrigin: true,
      },
      '/message': {
        target: backendTarget,
        changeOrigin: true,
      }
    }
  }
})
