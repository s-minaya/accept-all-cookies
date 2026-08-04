export type CellPhase = 'empty' | 'visible' | 'frozen'
export type ButtonType = 'agree' | 'disagree'

export interface CellState {
  phase: CellPhase
  /** `null` solo cuando `phase === 'empty'` o cuando `phase === 'frozen'` por congelar una casilla vacía (armada, a la espera del próximo botón). */
  type: ButtonType | null
}

export function createEmptyCell(): CellState {
  return { phase: 'empty', type: null }
}

/**
 * Entra un botón nuevo en la casilla. Si está `empty`, aparece visible. Si
 * está `frozen` armada (congelada estando vacía, `type: null`), el botón
 * entra ya congelado — la casilla lo retiene sin que el ciclo global vuelva
 * a tocarlo (013-plan.md, "congelar una casilla vacía deja la casilla
 * armada para retener el siguiente botón que entre"). Cualquier otro caso
 * (ya ocupada) es un no-op seguro: el llamador nunca debería pedirlo, pero
 * no hay ninguna casilla que pisar.
 */
export function spawn(state: CellState, type: ButtonType): CellState {
  if (state.phase === 'empty') return { phase: 'visible', type }
  if (state.phase === 'frozen' && state.type === null) return { phase: 'frozen', type }
  return state
}

/**
 * El ciclo global (`cycle.ts`) limpia todas las casillas `visible` de golpe
 * al arrancar el siguiente lote — así es como "cuando aparece uno,
 * desaparece otro". `frozen` y `empty` no tienen nada que limpiar: no-op.
 */
export function clear(state: CellState): CellState {
  if (state.phase === 'visible') return createEmptyCell()
  return state
}

/**
 * Congela la casilla: si tiene un botón visible, lo retiene tal cual. Si
 * está vacía, la arma (retiene el próximo botón que entre, ver `spawn`). Ya
 * congelada es un no-op idempotente (se llama en cada fotograma en que el
 * puntero sigue quieto, ver `usePointer`'s `onStill`).
 */
export function freeze(state: CellState): CellState {
  if (state.phase === 'frozen') return state
  return { phase: 'frozen', type: state.type }
}

/**
 * Descongela: si estaba armada sin botón dentro, vuelve a `empty` sin más.
 * Si retenía un botón, vuelve a `visible` — queda expuesta al siguiente
 * ciclo global, que podrá limpiarla como a cualquier otra.
 */
export function unfreeze(state: CellState): CellState {
  if (state.phase !== 'frozen') return state
  return state.type === null ? createEmptyCell() : { phase: 'visible', type: state.type }
}

/** Casillas que el ciclo global puede elegir como destino de un botón nuevo: vacías, o congeladas-armadas a la espera. */
export function isEligibleForSpawn(state: CellState): boolean {
  return state.phase === 'empty' || (state.phase === 'frozen' && state.type === null)
}
