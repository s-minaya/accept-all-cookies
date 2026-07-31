export interface TimedSegment {
  durationMs: number
}

export interface PhaseClockOptions<S extends TimedSegment> {
  segments: S[]
  /** Se llama una vez, en cuanto se entra en un segmento (antes de su primer `onFrame`). */
  onSegmentStart: (segment: S, index: number) => void
  /** Se llama en cada fotograma no pausado mientras dura un segmento, con el progreso 0..1 dentro de él. */
  onFrame: (segment: S, index: number, progress: number) => void
  /** Se llama una única vez, al entregar el último fotograma del último segmento. */
  onComplete: () => void
}

export interface PhaseClock {
  setPaused: (paused: boolean) => void
  /** Runner de rAF parado y sin más callbacks pendientes — nada vivo tras llamarlo. */
  destroy: () => void
}

/**
 * Reproduce una lista de segmentos con duración ya calculada (012-plan.md,
 * "reloj de fases... patrón de `pathAnimator` de la 010"): a diferencia de
 * `pathAnimator` (que entrega pasos discretos), aquí cada fotograma no
 * pausado entrega el progreso 0..1 dentro del segmento actual, para que el
 * llamador pueda interpolar una posición continua (el barajado del nivel 8)
 * en vez de saltar de casilla en casilla. Acumulador sobre rAF (excepción de
 * timers vigente, AGENTS.md): `paused` simplemente deja de sumar tiempo al
 * acumulador, así que ni el `progress` ni la fase en curso avanzan mientras
 * está en pausa — se retoma exactamente donde se dejó, sin saltos.
 */
export function createPhaseClock<S extends TimedSegment>({
  segments,
  onSegmentStart,
  onFrame,
  onComplete,
}: PhaseClockOptions<S>): PhaseClock {
  let index = 0
  let elapsedInSegment = 0
  let paused = false
  let rafId: number | null = null
  let lastTs: number | null = null
  let destroyed = false

  function tick(ts: number) {
    if (destroyed) return
    if (lastTs === null) lastTs = ts
    const dt = ts - lastTs
    lastTs = ts

    if (!paused) {
      elapsedInSegment += dt
      let segment = segments[index]
      // Si un fotograma tarda más de lo normal (pestaña en segundo plano,
      // dispositivo lento) y cruza dos o más segmentos de golpe, cada uno
      // entregado recibe su `onFrame(..., 1)` final antes de pasar al
      // siguiente — sin este bucle, un salto lo bastante largo podría saltarse
      // por completo el fotograma "progreso=1" de un segmento intermedio (p.
      // ej. el flip: el cambio de cara a mitad de giro depende de observar
      // progress >= 0.5 en algún fotograma real).
      while (elapsedInSegment >= segment.durationMs) {
        elapsedInSegment -= segment.durationMs
        onFrame(segment, index, 1)
        index++
        if (index >= segments.length) {
          if (rafId !== null) cancelAnimationFrame(rafId)
          rafId = null
          onComplete()
          return
        }
        segment = segments[index]
        onSegmentStart(segment, index)
      }

      const progress = segment.durationMs <= 0 ? 1 : elapsedInSegment / segment.durationMs
      onFrame(segment, index, progress)
    }
    rafId = requestAnimationFrame(tick)
  }

  if (segments.length === 0) {
    // No debería ocurrir en uso real (el nivel siempre pasa flip + 3
    // rondas), pero completar de inmediato en vez de quedarse colgado en
    // silencio es más seguro que asumir que el llamador nunca lo intentará.
    queueMicrotask(onComplete)
  } else {
    // Síncrono, antes del primer fotograma de rAF: el segmento 0 (p. ej. el
    // flip) empieza en cuanto se crea el reloj, no un fotograma después —
    // el llamador (`Level08.tsx`) necesita reflejar la fase nueva de
    // inmediato (deshabilitar la cuadrícula), no tras un salto de ~16ms.
    onSegmentStart(segments[0], 0)
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
