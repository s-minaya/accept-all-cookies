import { useEffect, useLayoutEffect, type MutableRefObject, type RefObject } from 'react'
import { tickAcceptAll, type AcceptAllState, type Phase } from './acceptAll'
import styles from './Level12.module.scss'

/** GDD §14: duración de la animación de llenado final (016-plan.md, "Decisiones": recompensa antes del AGREE gigante). */
export const WIN_FILL_MS = 400

export interface ProgressBarProps {
  /** Modelo compartido con `Level12.tsx` (el pie escribe en él al pulsar); este componente es el único que lo hace avanzar con el tiempo. */
  modelRef: MutableRefObject<AcceptAllState>
  /**
   * Ref al nodo real del relleno, creada en `Level12.tsx` (no aquí): el pie
   * también escribe en ella al pulsar, para que el clic se refleje al
   * instante en vez de esperar al siguiente fotograma del reloj — un salto
   * de un fotograma es imperceptible en un navegador real, pero sin esto la
   * barra parece ir "un tic por detrás" del propio dedo del jugador.
   */
  fillRef: RefObject<HTMLDivElement>
  paused: boolean
  /** Tras la pulsación ganadora: deja de decaer, anima el relleno al 100% y avisa a `onWin` al terminar. */
  winning: boolean
  onWin: () => void
  /**
   * El paso de `trap` a `restored` lo decide el propio reloj (pasan los 2s
   * sin pulsar), no un clic — así que este es el único sitio que puede
   * enterarse. Avisa al nivel para que el botón protagonista del pie
   * (`Level12.tsx`) vuelva a Agree sin que el jugador tenga que tocar nada.
   */
  onPhaseChange: (phase: Phase) => void
}

/**
 * La barra, publicada vía `useLevelBoard` (016-plan.md): relleno escrito por
 * ref en la custom property `--progress`, sin pasar por `setState` en cada
 * fotograma (patrón as-built 009-015). Es el único sitio que hace avanzar el
 * reloj puro de `acceptAll.ts` — el pie (`Level12.tsx`) solo lee/escribe el
 * mismo `modelRef` al pulsar, nunca tiene su propio bucle.
 */
export function ProgressBar({
  modelRef,
  fillRef,
  paused,
  winning,
  onWin,
  onPhaseChange,
}: ProgressBarProps) {
  // Refleja el progreso real al montar (recarga a mitad, o simplemente el primer pintado).
  useLayoutEffect(() => {
    fillRef.current?.style.setProperty('--progress', String(modelRef.current.progress))
  }, [modelRef, fillRef])

  // Al ganar, un único empujón a 100 — la transición CSS de `--winning` se encarga del tween.
  useEffect(() => {
    if (winning) fillRef.current?.style.setProperty('--progress', '100')
  }, [winning, fillRef])

  // Reloj de decaimiento/restauración: se detiene en cuanto se gana (ya no hay nada que decidir).
  useEffect(() => {
    if (paused || winning) return
    let rafId: number
    let lastTs: number | null = null
    let lastPhase = modelRef.current.phase

    const step = (ts: number) => {
      if (lastTs === null) lastTs = ts
      const dt = ts - lastTs
      lastTs = ts

      modelRef.current = tickAcceptAll(modelRef.current, dt)
      fillRef.current?.style.setProperty('--progress', String(modelRef.current.progress))
      if (modelRef.current.phase !== lastPhase) {
        lastPhase = modelRef.current.phase
        onPhaseChange(lastPhase)
      }

      rafId = requestAnimationFrame(step)
    }
    rafId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafId)
  }, [paused, winning, modelRef, fillRef, onPhaseChange])

  // Ventana de la animación final: cuenta WIN_FILL_MS y solo entonces confirma la victoria.
  useEffect(() => {
    if (!winning || paused) return
    let rafId: number
    let lastTs: number | null = null
    let elapsed = 0

    const step = (ts: number) => {
      if (lastTs === null) lastTs = ts
      const dt = ts - lastTs
      lastTs = ts
      elapsed += dt
      if (elapsed >= WIN_FILL_MS) {
        onWin()
        return
      }
      rafId = requestAnimationFrame(step)
    }
    rafId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafId)
  }, [winning, paused, onWin])

  return (
    <div className={styles['level-12__bar']}>
      <div
        ref={fillRef}
        className={[styles['level-12__bar-fill'], winning && styles['level-12__bar-fill--winning']]
          .filter(Boolean)
          .join(' ')}
      />
    </div>
  )
}
