import type { Cell } from './boardLogic'

export interface PathAnimatorOptions {
  /** Secuencia de casillas a recorrer, en orden (nunca vacía en el uso real — un `blocked` de `simulate()` ni llega a crear un animador). */
  camino: Cell[]
  /** Velocidad constante (GDD §14) — misma para avances, rebotes y castigos (010-plan.md, "Decisiones"). */
  cellsPerSecond: number
  /** Se llama una vez por casilla, en orden, a medida que la llave "entra" en ella. */
  onStep: (cell: Cell) => void
  /** Se llama una única vez, al entregar la última casilla del camino. */
  onComplete: () => void
}

export interface PathAnimator {
  setPaused: (paused: boolean) => void
  /** Runner de rAF parado y sin más callbacks pendientes — nada vivo tras llamarlo. */
  destroy: () => void
}

/**
 * Reproduce un `camino` ya calculado (010-plan.md, "Decisiones": "recorrido
 * precalculado + animador, en vez de simular tick a tick durante la
 * animación" — imposible que render y reglas discrepen, la lógica ya decidió
 * todo de golpe en `boardLogic.ts`). Acumulador sobre rAF (excepción de
 * timers vigente, AGENTS.md): si un fotograma tarda más de lo normal (pestaña
 * en segundo plano, dispositivo lento), se entregan de golpe todas las
 * casillas que tocaba cruzar en ese intervalo, nunca se salta ninguna.
 */
export function createPathAnimator({
  camino,
  cellsPerSecond,
  onStep,
  onComplete,
}: PathAnimatorOptions): PathAnimator {
  let index = 0
  let paused = false
  let accumulator = 0
  let rafId: number | null = null
  let lastTs: number | null = null
  let destroyed = false

  const stepDurationS = 1 / cellsPerSecond

  function finish() {
    if (rafId !== null) cancelAnimationFrame(rafId)
    rafId = null
    onComplete()
  }

  function tick(ts: number) {
    if (destroyed) return
    if (lastTs === null) lastTs = ts
    const dt = (ts - lastTs) / 1000
    lastTs = ts

    if (!paused) {
      accumulator += dt
      while (accumulator >= stepDurationS && index < camino.length) {
        accumulator -= stepDurationS
        onStep(camino[index])
        index++
      }
      if (index >= camino.length) {
        finish()
        return
      }
    }
    rafId = requestAnimationFrame(tick)
  }

  if (camino.length === 0) {
    // No debería ocurrir en uso real (ver arriba), pero completar de
    // inmediato en vez de quedarse colgado en silencio es más seguro que
    // asumir que el llamador nunca lo intentará.
    queueMicrotask(onComplete)
  } else {
    rafId = requestAnimationFrame(tick)
  }

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
