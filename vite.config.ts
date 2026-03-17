import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',   // 👈 permite conexiones externas (IPv4)
    allowedHosts: true, // 👈 Permitir acceso desde localtunnel (evita error 400)
    port: 5173,
  },
})
