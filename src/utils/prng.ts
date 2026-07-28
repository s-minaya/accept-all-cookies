/**
 * PRNG mínimo propio, con semilla (xorshift32): determinista para tests y
 * reproducciones de bugs, sin depender de ninguna librería (008-plan.md,
 * "Decisiones"). En juego real se siembra con un número aleatorio.
 * Extraído del nivel 4 a módulo común (009-plan.md): segunda consumidora
 * (el nivel 5, `reels.ts`) — regla de "2+ sitios → se extrae" (AGENTS.md).
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
