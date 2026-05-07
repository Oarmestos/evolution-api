import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const backendTarget = 'http://localhost:8080';

const proxyWithErrorHandling = (target: string) => ({
  target,
  changeOrigin: true,
  configure: (proxy: any) => {
    proxy.on('error', (_err: Error, _req: any, res: any) => {
      // Silently handle ECONNREFUSED while backend is starting
      if (res && !res.headersSent) {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 503, error: 'Backend no disponible', message: 'El servidor está iniciando, intenta en unos segundos.' }));
      }
    });
  },
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api':       proxyWithErrorHandling(backendTarget),
      '/instance':  proxyWithErrorHandling(backendTarget),
      '/webhook':   proxyWithErrorHandling(backendTarget),
      '/chatwoot':  proxyWithErrorHandling(backendTarget),
      '/user':      proxyWithErrorHandling(backendTarget),
      '/message':   proxyWithErrorHandling(backendTarget),
      '/lead':      proxyWithErrorHandling(backendTarget),
      '/contact':   proxyWithErrorHandling(backendTarget),
      '^/product(/.*|$)': proxyWithErrorHandling(backendTarget),
      '^/order(/.*|$)':   proxyWithErrorHandling(backendTarget),
      '/store-api': proxyWithErrorHandling(backendTarget),
      '^/chat/.*':  proxyWithErrorHandling(backendTarget),
      '^/theme/.*': proxyWithErrorHandling(backendTarget),
      // NOTE: /store is intentionally NOT proxied — it's handled by React Router (/store/:instanceName)
    }
  }
})
