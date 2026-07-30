export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'

export interface Cell {
  row: number
  col: number
}

export type SimulateOutcome = 'blocked' | 'stop' | 'lock'

export interface SimulateResult {
  tipo: SimulateOutcome
  /**
   * Secuencia completa de casillas recorridas, en orden, SIN incluir el
   * origen — desde el primer paso hasta la casilla final (inclusive). Un
   * rebote (la llave entra en una flecha que apunta de vuelta) da un camino
   * de 2 casillas ("ida y vuelta"); un paso directo a una casilla vacía da
   * un camino de 1; `blocked` da un camino vacío (no se mueve nada).
   */
  camino: Cell[]
}

const DIRECTION_VECTORS: Record<Direction, [number, number]> = {
  UP: [-1, 0],
  DOWN: [1, 0],
  LEFT: [0, -1],
  RIGHT: [0, 1],
}

const ARROW_VECTORS: Record<string, [number, number]> = {
  '^': [-1, 0],
  v: [1, 0],
  '<': [0, -1],
  '>': [0, 1],
}

function inBounds(grid: readonly string[], row: number, col: number): boolean {
  return row >= 0 && row < grid.length && col >= 0 && col < grid[row].length
}

/**
 * Simula pulsar `dir` con la llave en `origin` — misma semántica EXACTA que
 * `simular()` en `spec/tools/validate-level6.mjs` (010-plan.md, "la
 * simulación se testea contra la tabla del grafo, no contra sí misma"):
 * mismo orden de comprobaciones, mismo criterio de qué cuenta como parada
 * ('.'  y 'K', el propio origen de la llave, se tratan igual). El tablero ya
 * está validado (sin bucles, sin cadenas que salgan del tablero — invariante
 * que blinda `nivel6-tablero.test.ts`), así que esos dos casos no forman
 * parte del tipo de resultado: si ocurrieran sería un bug de datos, no algo
 * que el juego deba tratar como un resultado válido más.
 */
export function simulate(grid: readonly string[], origin: Cell, dir: Direction): SimulateResult {
  const [firstDf, firstDc] = DIRECTION_VECTORS[dir]
  let row = origin.row + firstDf
  let col = origin.col + firstDc
  if (!inBounds(grid, row, col)) return { tipo: 'blocked', camino: [] }

  const camino: Cell[] = []
  const visited = new Set<string>()
  for (;;) {
    const symbol = grid[row][col]
    camino.push({ row, col })
    if (symbol === '.' || symbol === 'K') return { tipo: 'stop', camino }
    if (symbol === 'L') return { tipo: 'lock', camino }

    const key = `${row},${col}`
    if (visited.has(key)) {
      throw new Error(
        `Bucle infinito de flechas en (${row}, ${col}) — el tablero no pasa el validador.`,
      )
    }
    visited.add(key)

    const vector = ARROW_VECTORS[symbol]
    row += vector[0]
    col += vector[1]
    if (!inBounds(grid, row, col)) {
      throw new Error(
        `Una cadena de flechas sale del tablero cerca de (${row - vector[0]}, ${col - vector[1]}) — el tablero no pasa el validador.`,
      )
    }
  }
}

/** Busca la única casilla con `symbol` en el grid (p. ej. 'K' o 'L'). `null` si no existe. */
export function findCell(grid: readonly string[], symbol: string): Cell | null {
  for (let row = 0; row < grid.length; row++) {
    const col = grid[row].indexOf(symbol)
    if (col !== -1) return { row, col }
  }
  return null
}
