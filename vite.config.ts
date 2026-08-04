import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/accept-all-cookies/',
  plugins: [react()],
  build: {
    // Explícito aunque sea el valor por defecto (017-plan.md, bloque B,
    // "higiene del build"): es la diferencia real entre "minificado
    // ilegible" y "el proyecto entero legible desde DevTools" — el único
    // punto donde el antiespoiler tiene un efecto grande y barato. No se
    // persigue ofuscación real (imposible y contrario al principio "el
    // engaño es del juego, no del código"), solo no regalar el mapa.
    sourcemap: false,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
