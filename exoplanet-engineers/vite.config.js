import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/gaia': {
        target: 'https://gea.esac.esa.int',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/gaia/, '/tap-server/tap/sync')
      }
    }
  }
})
