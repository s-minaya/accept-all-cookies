export interface GridClockOptions {
  /** Se llama en cada fotograma no pausado con el delta en milisegundos desde el fotograma anterior. */
  onTick: (deltaMs: number) => void
}

export interface GridClock {
  setPaused: (paused: boolean) => void
  /** Runner de rAF parado — nada vivo tras llamarlo. */
  destroy: () => void
}

/**
 * Un único reloj sobre rAF para las 12 casillas del nivel 9 (013-plan.md,
 * "Decisiones": "doce relojes serían doce fuentes de deriva y doce
 * cleanups; con uno, `paused` es una línea") — más simple que
 * `pathAnimator`/`phaseClock` (010/012) porque aquí no hay pasos discretos
 * ni segmentos que reproducir, solo delta de tiempo que el llamador aplica
 * a las 12 máquinas de casilla por igual.
 */
export function createGridClock({ onTick }: GridClockOptions): GridClock {
  let paused = false
  let rafId: number | null = null
  let lastTs: number | null = null
  let destroyed = false

  function tick(ts: number) {
    if (destroyed) return
    if (lastTs === null) lastTs = ts
    const dt = ts - lastTs
    lastTs = ts

    if (!paused) onTick(dt)
    rafId = requestAnimationFrame(tick)
  }

  rafId = requestAnimationFrame(tick)

  return {
    setPaused(nextPaused: boolean) {
      paused = nextPaused
    },
    destroy() {
      destroyed = true
      if (rafId !== null) cancelAnimationFrame(rafId)
      rafId = null
    },
  }
}
