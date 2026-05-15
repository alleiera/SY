import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Ensure assets are loaded correctly in Electron
  server: {
    host: true, // Expose to network for tablet/mobile testing
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          supabase: ['@supabase/supabase-js'],
          flow: ['@xyflow/react', 'dagre'],
        },
      },
    },
  },
})
