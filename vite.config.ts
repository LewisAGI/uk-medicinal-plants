import { defineConfig, type Plugin } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { buildPublicPack } from './scripts/public-pack.ts'

function publicPack(): Plugin {
  const resolved = '\0virtual:public-pack'
  return {
    name: 'public-pack',
    resolveId(id) {
      if (id === 'virtual:public-pack') return resolved
    },
    load(id) {
      if (id !== resolved) return null
      return `export default ${JSON.stringify(buildPublicPack())}`
    },
  }
}

export default defineConfig({
  plugins: [publicPack(), react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
})
