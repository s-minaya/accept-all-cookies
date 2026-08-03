export interface TypewriterState {
  /** ms transcurridos escribiendo, saturado en `totalMs`. */
  elapsedMs: number
  /** ms transcurridos desde que terminó de escribirse; -1 mientras todavía escribe. */
  sinceDoneMs: number
}

export function createTypewriterState(): TypewriterState {
  return { elapsedMs: 0, sinceDoneMs: -1 }
}

export function isTypewriterDone(state: TypewriterState): boolean {
  return state.sinceDoneMs >= 0
}

/**
 * Máquina pura del efecto de escritura (015-plan.md, "reloj rAF de la casa",
 * patrón de `clock.ts`/`phaseClock.ts`): mientras escribe, avanza
 * `elapsedMs` hasta `totalMs`; al llegar, se congela ahí y en su lugar
 * empieza a avanzar `sinceDoneMs` — el margen que usa `useTypewriter.ts`
 * para el desbloqueo de los botones (`ANSWER_UNLOCK_MS`, 015-spec.md: "la
 * trampa debe ser psicológica, no mecánica").
 */
export function tickTypewriter(
  state: TypewriterState,
  deltaMs: number,
  totalMs: number,
): TypewriterState {
  if (state.sinceDoneMs >= 0) {
    return { ...state, sinceDoneMs: state.sinceDoneMs + deltaMs }
  }
  const elapsedMs = Math.min(totalMs, state.elapsedMs + deltaMs)
  return { elapsedMs, sinceDoneMs: elapsedMs >= totalMs ? 0 : -1 }
}

/** Tocar el bocadillo: completa el texto de golpe, como si el reloj hubiera llegado al final de una vez. */
export function skipTypewriter(totalMs: number): TypewriterState {
  return { elapsedMs: totalMs, sinceDoneMs: 0 }
}

export function visibleCharCount(
  state: TypewriterState,
  msPerCharacter: number,
  textLength: number,
): number {
  return Math.min(textLength, Math.floor(state.elapsedMs / msPerCharacter))
}

export function isTypewriterUnlocked(state: TypewriterState, unlockMs: number): boolean {
  return isTypewriterDone(state) && state.sinceDoneMs >= unlockMs
}
