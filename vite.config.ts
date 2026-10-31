import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// 固定 1420 埠，Tauri 開發模式會連到這裡
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: { port: 1420, strictPort: true },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
})
