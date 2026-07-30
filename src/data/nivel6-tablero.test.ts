import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const here = dirname(fileURLToPath(import.meta.url))
const rutaFuente = resolve(here, '../../spec/assets/nivel6-tablero.json')
const rutaCopia = resolve(here, './nivel6-tablero.json')
const rutaValidador = resolve(here, '../../spec/tools/validate-level6.mjs')

/**
 * Dos blindajes automatizados (010-plan.md, "Decisiones"): la invariante "no
 * se modifica el tablero sin pasar el validador" deja de depender de la
 * disciplina humana. Si se edita el tablero, hay que tocar
 * `spec/assets/nivel6-tablero.json`, volver a copiarlo aquí y actualizar la
 * tabla del grafo en `nivel6-tablero.md` (los tests-oráculo de
 * `boardLogic.test.ts` la usan) — ver AGENTS.md.
 */
describe('nivel6-tablero.json (010-plan.md, blindajes de datos)', () => {
  it('es idéntico byte a byte a spec/assets/nivel6-tablero.json (sin deriva entre fuente de verdad y copia)', () => {
    const fuente = readFileSync(rutaFuente, 'utf8')
    const copia = readFileSync(rutaCopia, 'utf8')
    expect(copia).toBe(fuente)
  })

  it('pasa el validador (spec/tools/validate-level6.mjs) con éxito', () => {
    let output = ''
    let failed = false
    try {
      output = execSync(`node "${rutaValidador}" "${rutaCopia}"`, { encoding: 'utf8' })
    } catch (error) {
      failed = true
      output = String((error as { stdout?: string }).stdout ?? error)
    }
    expect(failed, output).toBe(false)
  })
})
