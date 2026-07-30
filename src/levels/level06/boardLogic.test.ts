import { describe, expect, it } from 'vitest'
import tablero from '../../data/nivel6-tablero.json'
import { findCell, simulate, type Cell, type Direction } from './boardLogic'

const grid = tablero.grid

// Coordenadas de los 6 puntos de decisión y el candado, tal como los
// documenta `spec/assets/nivel6-tablero.md`.
const D0: Cell = { row: 3, col: 1 }
const D1: Cell = { row: 1, col: 8 }
const D2: Cell = { row: 5, col: 13 }
const D3: Cell = { row: 1, col: 19 }
const D4: Cell = { row: 4, col: 24 }
const D5: Cell = { row: 1, col: 30 }
const LOCK: Cell = { row: 3, col: 38 }

/**
 * Contrastado contra la tabla del grafo de decisiones de
 * `spec/assets/nivel6-tablero.md` (010-plan.md, "Decisiones": "la
 * simulación se testea contra la tabla del grafo, no contra sí misma") — el
 * documento de diseño ya declara el comportamiento esperado de las 24
 * combinaciones punto×dirección; usarlo como oráculo detecta cualquier
 * divergencia entre la semántica del juego y la del validador.
 */
describe('simulate (010-plan.md — grafo de decisiones completo)', () => {
  it('la llave (K) está en D0 y el candado (L) en LOCK — confirma que las coordenadas de este test coinciden con el tablero real', () => {
    expect(findCell(grid, 'K')).toEqual(D0)
    expect(findCell(grid, 'L')).toEqual(LOCK)
  })

  const casos: Array<[string, Cell, Direction, 'stop' | 'lock', Cell, number]> = [
    ['D0 ↑ rebote', D0, 'UP', 'stop', D0, 1],
    ['D0 ↓ rebote', D0, 'DOWN', 'stop', D0, 1],
    ['D0 ← rebote', D0, 'LEFT', 'stop', D0, 1],
    ['D0 → D1', D0, 'RIGHT', 'stop', D1, 8],

    ['D1 ↑ castigo → D0', D1, 'UP', 'stop', D0, 10],
    ['D1 ↓ → D2', D1, 'DOWN', 'stop', D2, 8],
    ['D1 ← rebote', D1, 'LEFT', 'stop', D1, 1],
    ['D1 → rebote', D1, 'RIGHT', 'stop', D1, 1],

    ['D2 ↑ rebote', D2, 'UP', 'stop', D2, 1],
    ['D2 ↓ castigo → D0', D2, 'DOWN', 'stop', D0, 15],
    ['D2 ← rebote', D2, 'LEFT', 'stop', D2, 1],
    ['D2 → D3', D2, 'RIGHT', 'stop', D3, 9],

    ['D3 ↑ castigo épico → D0', D3, 'UP', 'stop', D0, 67],
    ['D3 ↓ → D4', D3, 'DOWN', 'stop', D4, 7],
    ['D3 ← rebote', D3, 'LEFT', 'stop', D3, 1],
    ['D3 → rebote', D3, 'RIGHT', 'stop', D3, 1],

    ['D4 ↑ → D5', D4, 'UP', 'stop', D5, 8],
    ['D4 ↓ castigo → D0', D4, 'DOWN', 'stop', D0, 27],
    ['D4 ← rebote', D4, 'LEFT', 'stop', D4, 1],
    ['D4 → castigo → D0', D4, 'RIGHT', 'stop', D0, 29],

    ['D5 ↑ castigo → D0', D5, 'UP', 'stop', D0, 56],
    ['D5 ↓ castigo → D0', D5, 'DOWN', 'stop', D0, 36],
    ['D5 ← rebote', D5, 'LEFT', 'stop', D5, 1],
    ['D5 → CANDADO', D5, 'RIGHT', 'lock', LOCK, 9],
  ]

  it.each(casos)('%s', (_label, origin, dir, expectedTipo, expectedDestino, expectedPasos) => {
    const result = simulate(grid, origin, dir)
    expect(result.tipo).toBe(expectedTipo)
    // `pasos` de la tabla cuenta flechas RECORRIDAS (transiciones); `camino`
    // además incluye la casilla final de llegada, de ahí el +1.
    expect(result.camino).toHaveLength(expectedPasos + 1)
    expect(result.camino[result.camino.length - 1]).toEqual(expectedDestino)
  })

  it('la solución declarada (→ ↓ → ↓ ↑ →) lleva de D0 al candado pasando por D1..D5 en orden', () => {
    let pos = D0
    const solution: Direction[] = ['RIGHT', 'DOWN', 'RIGHT', 'DOWN', 'UP', 'RIGHT']
    const expectedStops = [D1, D2, D3, D4, D5, LOCK]
    solution.forEach((dir, i) => {
      const result = simulate(grid, pos, dir)
      const dest = result.camino[result.camino.length - 1]
      expect(dest).toEqual(expectedStops[i])
      pos = dest
    })
  })

  it('a movement toward outside the board does nothing (blocked, empty camino)', () => {
    // No hay ninguna casilla de decisión pegada al borde en este tablero;
    // se comprueba directamente desde la esquina (0,0).
    expect(simulate(grid, { row: 0, col: 0 }, 'UP')).toEqual({ tipo: 'blocked', camino: [] })
    expect(simulate(grid, { row: 0, col: 0 }, 'LEFT')).toEqual({ tipo: 'blocked', camino: [] })
  })
})

describe('findCell', () => {
  it('returns null when the symbol is not present', () => {
    expect(findCell(grid, 'Z')).toBeNull()
  })
})
