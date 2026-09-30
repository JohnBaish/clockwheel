import { fileURLToPath } from 'url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const root = fileURLToPath(new URL('.', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // Three HTML entry points — index.html and backtimer.html share the
      // full app (src/main.tsx); landing.html (the baish.net root domain)
      // is deliberately separate and lighter, importing just the CSS via
      // src/landing.ts, not the React app. All three need building so
      // middleware.ts has real files to serve per-domain; see index.html's
      // head comment and middleware.ts for how domains/files/runtime checks
      // fit together.
      input: {
        main: `${root}index.html`,
        backtimer: `${root}backtimer.html`,
        landing: `${root}landing.html`,
      },
    },
  },
})
