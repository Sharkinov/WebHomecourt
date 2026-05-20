import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'brotli-headers',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.endsWith('.br')) {
            res.setHeader('Content-Encoding', 'br')
            if (req.url.endsWith('.js.br')) {
              res.setHeader('Content-Type', 'application/javascript')
            } else if (req.url.endsWith('.wasm.br')) {
              res.setHeader('Content-Type', 'application/wasm')
            } else {
              res.setHeader('Content-Type', 'application/octet-stream')
            }
          }
          next()
        })
      }
    }
  ],
})