import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), cssInjectedByJsPlugin()],
  build: {
    lib: {
      entry: resolve(__dirname, 'lib/main.js'),
      name: 'chat-bot-ui',
      // the proper extensions will be added
      fileName: 'chat-bot-ui',
    },
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        app: './src/main.tsx'
      }
    }
  }
})
