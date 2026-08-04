import { clear, isEligibleForSpawn, spawn, type ButtonType, type CellState } from './cell'

/** Casillas del grid (GDD Nivel 9). */
export const CELL_COUNT = 12

/** Cuántas casillas reciben un botón nuevo en cada ciclo — "varios simultáneos", parámetro ajustable en el checkpoint. */
export const SIMULTANEOUS_COUNT = 4

/** Reparto Agree/Disagree de cada botón asignado (GDD §14: 50/50), salvo la garantía de más abajo. */
export const AGREE_RATIO = 0.5

export interface CycleAssignment {
  index: number
  type: ButtonType
}

/**
 * Elige qué casillas ELEGIBLES reciben un botón nuevo este ciclo (como
 * mucho `count`, menos si no hay tantas libres) y les asigna tipo al 50/50
 * — con la garantía de que al menos una del lote sea Agree: si el sorteo
 * independiente no produjo ninguno, se fuerza uno al azar dentro del propio
 * lote.
 */
export function chooseCycleBatch(
  eligibleIndices: readonly number[],
  rng: () => number,
  count: number,
): CycleAssignment[] {
  const pool = [...eligibleIndices]
  const chosen: number[] = []
  const k = Math.min(count, pool.length)
  for (let i = 0; i < k; i++) {
    const pick = Math.floor(rng() * pool.length)
    chosen.push(pool.splice(pick, 1)[0])
  }

  const types: ButtonType[] = chosen.map(() => (rng() < AGREE_RATIO ? 'agree' : 'disagree'))
  if (types.length > 0 && !types.includes('agree')) {
    types[Math.floor(rng() * types.length)] = 'agree'
  }

  return chosen.map((index, i) => ({ index, type: types[i] }))
}

/**
 * Un ciclo completo sobre las 12 casillas (013-plan.md, corregido): limpia
 * de golpe todo lo `visible` (las congeladas se quedan tal cual) y reparte
 * un lote nuevo entre las casillas que hayan
 * quedado elegibles — incluidas las congeladas-armadas, que así capturan su
 * botón sin esperar a que el ciclo las libere. Pura: recibe el `rng` propio
 * del nivel (semilla del montaje), nunca decide nada por su cuenta fuera de
 * esta llamada.
 */
export function runCycle(cells: readonly CellState[], rng: () => number): CellState[] {
  const cleared = cells.map(clear)
  const eligible = cleared.reduce<number[]>((acc, cell, index) => {
    if (isEligibleForSpawn(cell)) acc.push(index)
    return acc
  }, [])

  const batch = chooseCycleBatch(eligible, rng, SIMULTANEOUS_COUNT)
  const next = [...cleared]
  for (const { index, type } of batch) next[index] = spawn(next[index], type)
  return next
}
