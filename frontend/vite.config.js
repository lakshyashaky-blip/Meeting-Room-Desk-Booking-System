import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/Meeting-Room-Desk-Booking-System/',
  plugins: [react()],
  server: {
    port: 5173,
  },
})
