/** Número de botones del trilero (GDD Nivel 8): 1 Agree + 11 Disagree. */
export const CELL_COUNT = 12

/**
 * Duraciones de las 3 rondas de barajado (GDD §14: "0,8 s / 0,55 s / 0,35 s"
 * — subidas dos veces tras revisión de Sofía: primero desde 2/1,5/1 s, y
 * "sigue siendo muy fácil, un poco más" desde 1,2/0,9/0,6 s).
 */
export const ROUND_DURATIONS_MS: readonly number[] = [800, 550, 350]

/**
 * Intercambios por ronda (012-plan.md, "parámetros por ronda: 4 / 6 / 8
 * intercambios, ajustables" — el checkpoint de Sofía decide el valor final;
 * más intercambios = más difícil de seguir).
 */
export const ROUND_SWAP_COUNTS: readonly number[] = [4, 6, 8]

/** Un intercambio: los botones que ocupan las celdas `a` y `b` cambian de sitio. */
export type Swap = readonly [number, number]

export interface Round {
  durationMs: number
  swaps: Swap[]
}

export interface ShuffleScript {
  /** Celda donde aparece el Agree en la fase reveal (identidad del botón: `agreeIndex` es también su id estable). */
  agreeIndex: number
  rounds: Round[]
  /** Celda donde termina el botón que originalmente era Agree, tras las 3 rondas — la que gana en la fase de elección. */
  finalAgreeCell: number
}

/**
 * Aplica una lista de intercambios (de celda, no de botón) a un mapa
 * celda→botón, en orden. Pura: la usan tanto `createShuffleScript` (para
 * calcular `finalAgreeCell`) como `Level08.tsx` (para saber dónde debe
 * terminar cada botón al final de cada ronda, con el mismo guion ya
 * generado — nunca vuelve a tirar del PRNG).
 */
export function applySwaps(buttonAtCell: readonly number[], swaps: readonly Swap[]): number[] {
  const next = [...buttonAtCell]
  for (const [a, b] of swaps) {
    const tmp = next[a]
    next[a] = next[b]
    next[b] = tmp
  }
  return next
}

function identityPermutation(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i)
}

/**
 * Guion determinista de una partida entera (012-plan.md, "separar por
 * completo coreografía de render"): dada una semilla (vía `rng`, PRNG de
 * `src/utils/prng.ts`), decide de golpe la posición inicial del Agree y las
 * 3 rondas de intercambios. El componente solo reproduce este guion — nunca
 * decide una posición por su cuenta, así que animación y "verdad" (dónde
 * está el Agree) no pueden discrepar.
 */
export function createShuffleScript(rng: () => number): ShuffleScript {
  const agreeIndex = Math.floor(rng() * CELL_COUNT)

  let buttonAtCell = identityPermutation(CELL_COUNT)
  const rounds: Round[] = ROUND_DURATIONS_MS.map((durationMs, roundIndex) => {
    const swapCount = ROUND_SWAP_COUNTS[roundIndex]
    const swaps: Swap[] = []
    for (let i = 0; i < swapCount; i++) {
      const a = Math.floor(rng() * CELL_COUNT)
      let b = Math.floor(rng() * CELL_COUNT)
      while (b === a) b = Math.floor(rng() * CELL_COUNT)
      swaps.push([a, b])
    }
    buttonAtCell = applySwaps(buttonAtCell, swaps)
    return { durationMs, swaps }
  })

  const finalAgreeCell = buttonAtCell.indexOf(agreeIndex)

  return { agreeIndex, rounds, finalAgreeCell }
}
