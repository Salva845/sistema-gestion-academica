import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ✅ Configuración correcta para TailwindCSS v3
export default defineConfig({
  plugins: [react()],
})
