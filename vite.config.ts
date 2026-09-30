import { fileURLToPath } from 'url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const root = fileURLToPath(new URL('.', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // Two HTML entry points sharing the same app (src/main.tsx) — index.html
      // (Clockmaker) and backtimer.html (Backtimer-branded, for the
      // backtimer.baish.net domain). Both need building so vercel.json has a
      // real file to rewrite to; see index.html's head comment for the rest
      // of how the two domains/files/runtime check fit together.
      input: {
        main: `${root}index.html`,
        backtimer: `${root}backtimer.html`,
      },
    },
  },
})
