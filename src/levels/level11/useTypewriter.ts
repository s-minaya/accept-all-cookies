import { useEffect, useState } from 'react'
import { useAudio } from '../../audio/useAudio'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import {
  createTypewriterState,
  isTypewriterDone,
  isTypewriterUnlocked,
  skipTypewriter,
  tickTypewriter,
  visibleCharCount,
} from './typewriter'

/** GDD §14: velocidad del efecto de escritura de Sans. */
export const MS_PER_CHARACTER = 25
/** GDD §14: margen tras terminar de escribir antes de aceptar respuesta (015-spec.md: "la trampa debe ser psicológica, no mecánica"). */
export const ANSWER_UNLOCK_MS = 200
/** GDD §14: a qué fracción de su volumen normal baja la música mientras Sans habla. */
export const DUCK_FACTOR = 0.2

export interface UseTypewriterResult {
  visibleText: string
  done: boolean
  unlocked: boolean
  /** Tocar el bocadillo: completa el texto de golpe, corta la voz y restaura la música. */
  skip: () => void
}

/**
 * Efecto de escritura letra a letra sobre el reloj rAF puro de
 * `typewriter.ts` (015-plan.md, patrón `clock.ts` de la 013). `text` es la
 * única señal de "frase nueva" — `conversation.ts` garantiza que dos pasos
 * consecutivos del guion nunca comparten texto, así que un cambio de `text`
 * siempre significa "empieza una pregunta distinta", nunca un re-render de
 * la misma.
 *
 * La voz en bucle y el ducking de música están activos exactamente mientras
 * hay una frase a medio escribir sin pausa (`!paused && !done`): un único
 * efecto los sincroniza a ese booleano derivado, con un cleanup
 * incondicional que los para/restaura en cualquier salida — cambio de
 * frase, pausa o desmontaje del nivel entero (victoria, derrota, X). Es la
 * pieza que garantiza el criterio de aceptación "la música nunca se queda
 * agachada" sin necesitar un caso especial por cada forma de salir.
 */
export function useTypewriter(text: string, paused: boolean): UseTypewriterResult {
  const { startVoiceLoop, stopVoiceLoop, duckMusic, unduckMusic } = useAudio()
  const reducedMotion = usePrefersReducedMotion()
  const totalMs = text.length * MS_PER_CHARACTER
  const [state, setState] = useState(createTypewriterState)

  // Frase nueva: reinicia el progreso desde cero.
  useEffect(() => {
    setState(createTypewriterState())
  }, [text])

  const done = isTypewriterDone(state)
  const unlocked = isTypewriterUnlocked(state, ANSWER_UNLOCK_MS)

  useEffect(() => {
    if (!paused && !done) {
      startVoiceLoop()
      duckMusic(DUCK_FACTOR)
    }
    return () => {
      stopVoiceLoop()
      unduckMusic()
    }
  }, [paused, done, startVoiceLoop, stopVoiceLoop, duckMusic, unduckMusic])

  // Reloj rAF: se detiene en cuanto se desbloquea (nada más que calcular a partir de ahí) o mientras está en pausa.
  useEffect(() => {
    if (paused || unlocked) return
    let rafId: number
    let lastTs: number | null = null
    const tick = (ts: number) => {
      if (lastTs === null) lastTs = ts
      const dt = ts - lastTs
      lastTs = ts
      setState((prev) => tickTypewriter(prev, dt, totalMs))
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [paused, unlocked, totalMs])

  function skip(): void {
    setState((prev) => (isTypewriterDone(prev) ? prev : skipTypewriter(totalMs)))
  }

  // `prefers-reduced-motion` (017-plan.md, bloque F): el texto aparece de
  // golpe, pero `state`/`done`/`unlocked` siguen avanzando exactamente
  // igual — el bloqueo de input (No/Yes deshabilitados hasta `unlocked`) no
  // cambia ni un milisegundo. Ninguna regla de juego cambia, solo lo que se
  // pinta mientras tanto.
  const visibleText =
    done || reducedMotion
      ? text
      : text.slice(0, visibleCharCount(state, MS_PER_CHARACTER, text.length))

  return { visibleText, done, unlocked, skip }
}
