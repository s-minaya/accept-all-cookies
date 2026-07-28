import { createRng } from '../../utils/prng'

/** Reexportado por compatibilidad: el resto del nivel 4 lo importa de aquí (009-plan.md, PRNG extraído a módulo común). */
export { createRng }

/** Reparto Agree/Disagree de cada botón que cae (GDD §14: 50/50). */
export const SPAWN_AGREE_RATIO = 0.5

export type FallingType = 'agree' | 'disagree'

export interface SpawnPoint {
  type: FallingType
  /** X lógica (0..canvasWidth) donde nace el botón, arriba del tablero. */
  x: number
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
