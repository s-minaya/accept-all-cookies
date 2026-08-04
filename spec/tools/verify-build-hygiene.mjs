#!/usr/bin/env node
/**
 * Higiene del build de producción (017-plan.md, bloque B).
 *
 * Uso: node spec/tools/verify-build-hygiene.mjs [ruta/a/dist]
 *      (si no se pasa ruta, usa ./dist)
 *
 * Falla (código de salida 1) si `dist/` contiene cualquier rastro de:
 *   1. Sourcemaps: ficheros `.map` o comentarios `//# sourceMappingURL=`
 *      dentro de un `.js`/`.css` (harían el código fuente legible entero
 *      desde DevTools).
 *   2. Archivos de test: cualquier ruta con `.test.` en el nombre.
 *   3. La Playground o el nivel de prueba: nada en el JS emitido debe
 *      mencionar "Playground" ni "TestLevel" — ambos deben quedar fuera del
 *      grafo del build (`import.meta.env.DEV`, `src/App.tsx`).
 *
 * "Nada se da por bueno por deducción" (017-plan.md, enfoque): esto convierte
 * una suerte de cómo funciona Vite hoy en una garantía comprobada en cada
 * build, no en un supuesto.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = fileURLToPath(new URL('.', import.meta.url))
const distDir = process.argv[2] ? resolve(process.argv[2]) : resolve(scriptDir, '../../dist')

function walk(dir) {
  const entries = readdirSync(dir)
  const files = []
  for (const entry of entries) {
    const fullPath = join(dir, entry)
    if (statSync(fullPath).isDirectory()) files.push(...walk(fullPath))
    else files.push(fullPath)
  }
  return files
}

let files
try {
  files = walk(distDir)
} catch (err) {
  console.error(`No se pudo leer ${distDir}: ${err.message}`)
  console.error('¿Se ejecutó "vite build" antes de este script?')
  process.exit(1)
}

const problems = []
const codeExtensions = new Set(['.js', '.css'])

for (const file of files) {
  const rel = relative(distDir, file)
  const ext = extname(file)

  if (ext === '.map') {
    problems.push(`Sourcemap presente: ${rel}`)
    continue
  }
  if (rel.includes('.test.')) {
    problems.push(`Archivo de test presente: ${rel}`)
    continue
  }

  if (codeExtensions.has(ext)) {
    const content = readFileSync(file, 'utf-8')
    if (content.includes('sourceMappingURL=')) {
      problems.push(`Referencia a sourcemap dentro de: ${rel}`)
    }
    if (content.includes('Playground') || content.includes('TestLevel')) {
      problems.push(`Restos de la Playground / nivel de prueba dentro de: ${rel}`)
    }
  }
}

if (problems.length > 0) {
  console.error(`✗ Higiene del build: ${problems.length} problema(s) en ${distDir}\n`)
  for (const problem of problems) console.error(`  - ${problem}`)
  process.exit(1)
}

console.log(`✓ Higiene del build: ${distDir} está limpio (sin sourcemaps, tests ni Playground).`)
