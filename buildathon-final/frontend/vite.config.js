import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on all local IPs
    port: 5173, // Force port 5173
    proxy: {
      '/chat': { target: 'http://localhost:8003', changeOrigin: true, secure: false },
      '/triage': { target: 'http://localhost:8003', changeOrigin: true, secure: false },
      '/save_summary': { target: 'http://localhost:8003', changeOrigin: true, secure: false },
      '/book_appointment': { target: 'http://localhost:8003', changeOrigin: true, secure: false },
      '/generate_summary': { target: 'http://localhost:8003', changeOrigin: true, secure: false },
      '/process_audio': { target: 'http://localhost:8003', changeOrigin: true, secure: false },
      '/translate_text': { target: 'http://localhost:8003', changeOrigin: true, secure: false },
      '/get_records': { target: 'http://localhost:8003', changeOrigin: true, secure: false },
      '/upload_record': { target: 'http://localhost:8003', changeOrigin: true, secure: false },
      '/get_location': { target: 'http://localhost:8003', changeOrigin: true, secure: false },
      '/get_doctor': { target: 'http://localhost:8003', changeOrigin: true, secure: false },
      '/create_slot': { target: 'http://localhost:8003', changeOrigin: true, secure: false },
      '/create_slots_batch': { target: 'http://localhost:8003', changeOrigin: true, secure: false },
      '/get_slots': { target: 'http://localhost:8003', changeOrigin: true, secure: false },
      '/get_appointments': { target: 'http://localhost:8003', changeOrigin: true, secure: false },
      '/get_patients': { target: 'http://localhost:8003', changeOrigin: true, secure: false },
      '/get_emergencies': { target: 'http://localhost:8003', changeOrigin: true, secure: false },
      '/get_doctors': { target: 'http://localhost:8003', changeOrigin: true, secure: false },
      '/get_case': { target: 'http://localhost:8003', changeOrigin: true, secure: false }
    }
  }
})
