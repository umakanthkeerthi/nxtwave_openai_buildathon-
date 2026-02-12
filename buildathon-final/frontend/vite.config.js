import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on all local IPs
    port: 3000, // Force port 3000
    proxy: {
      '/chat': { target: 'http://127.0.0.1:8004', changeOrigin: true, secure: false },
      '/triage': { target: 'http://127.0.0.1:8004', changeOrigin: true, secure: false },
      '/save_summary': { target: 'http://127.0.0.1:8004', changeOrigin: true, secure: false },
      '/book_appointment': { target: 'http://127.0.0.1:8004', changeOrigin: true, secure: false },
      '/generate_summary': { target: 'http://127.0.0.1:8004', changeOrigin: true, secure: false },
      '/process_audio': { target: 'http://127.0.0.1:8004', changeOrigin: true, secure: false },
      '/translate_text': { target: 'http://127.0.0.1:8004', changeOrigin: true, secure: false },
      '/get_records': { target: 'http://127.0.0.1:8004', changeOrigin: true, secure: false },
      '/upload_record': { target: 'http://127.0.0.1:8004', changeOrigin: true, secure: false },
      '/get_location': { target: 'http://127.0.0.1:8004', changeOrigin: true, secure: false },
      '/get_doctor': { target: 'http://127.0.0.1:8004', changeOrigin: true, secure: false },
      '/create_slot': { target: 'http://127.0.0.1:8004', changeOrigin: true, secure: false },
      '/create_slots_batch': { target: 'http://127.0.0.1:8004', changeOrigin: true, secure: false },
      '/get_slots': { target: 'http://127.0.0.1:8004', changeOrigin: true, secure: false },
      '/get_appointments': { target: 'http://127.0.0.1:8004', changeOrigin: true, secure: false },
      '/get_patients': { target: 'http://127.0.0.1:8004', changeOrigin: true, secure: false },
      '/get_emergencies': { target: 'http://127.0.0.1:8004', changeOrigin: true, secure: false },
      '/get_doctors': { target: 'http://127.0.0.1:8004', changeOrigin: true, secure: false },
      '/get_case': { target: 'http://127.0.0.1:8004', changeOrigin: true, secure: false },
      '/init_session': { target: 'http://127.0.0.1:8004', changeOrigin: true, secure: false }
    }
  }
})
