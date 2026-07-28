/** Reparto Agree/Disagree de cada botón que cae (GDD §14: 50/50). */
export const SPAWN_AGREE_RATIO = 0.5

export type FallingType = 'agree' | 'disagree'

export interface SpawnPoint {
  type: FallingType
  /** X lógica (0..canvasWidth) donde nace el botón, arriba del tablero. */
  x: number
}

/**
 * PRNG mínimo propio, con semilla (xorshift32): determinista para tests y
 * reproducciones de bugs, sin depender de ninguna librería (008-plan.md,
 * "Decisiones"). En juego real se siembra con un número aleatorio.
 */
export function createRng(seed: number): () => number {
  let state = (seed >>> 0 || 1) >>> 0

  return function next(): number {
    state ^= state << 13
    state >>>= 0
    state ^= state >>> 17
    state ^= state << 5
    state >>>= 0
    return state / 0xffffffff
  }
}

/**
 * Siguiente botón que cae: tipo al 50/50 y X aleatoria dentro del ancho
 * lógico del tablero, con un margen a cada lado para no nacer pegado a las
 * paredes.
 */
export function nextSpawnPoint(
  rng: () => number,
  canvasWidth: number,
  marginX: number,
): SpawnPoint {
  const type: FallingType = rng() < SPAWN_AGREE_RATIO ? 'agree' : 'disagree'
  const usableWidth = Math.max(canvasWidth - marginX * 2, 0)
  const x = marginX + rng() * usableWidth
  return { type, x }
}
