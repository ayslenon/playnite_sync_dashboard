import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dashboardDir = path.dirname(fileURLToPath(import.meta.url))
const certFile = process.env.SSL_CERTFILE || path.resolve(dashboardDir, '../server/certs/ayslenon-pc.pem')
const keyFile = process.env.SSL_KEYFILE || path.resolve(dashboardDir, '../server/certs/ayslenon-pc-key.pem')
const useHttps = process.env.LOCAL_HTTPS === 'true' && fs.existsSync(certFile) && fs.existsSync(keyFile)
const https = useHttps
  ? { cert: fs.readFileSync(certFile), key: fs.readFileSync(keyFile) }
  : undefined

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: '0.0.0.0',
    port: 4173,
    ...(https ? { https } : {}),
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    ...(https ? { https } : {}),
  },
})
