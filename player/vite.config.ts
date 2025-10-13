import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist', // Upewnij się, że Vite generuje pliki w /dist
    emptyOutDir: true, // Czyści katalog przed nowym buildem
  },
  server: {
    port: 5173, // Możesz zmienić port deweloperski, jeśli potrzeba
  }
})
