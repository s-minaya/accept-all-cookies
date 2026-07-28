import { useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useT } from '../../i18n/useT'
import type { ReelSymbol } from './reels'
import styles from './Reel.module.scss'

/** Alto de cada casilla en px lógicos — mantener en sincro con `Reel.module.scss`. */
export const SYMBOL_HEIGHT_PX = 48
/** Filas visibles a la vez (impar: hay una fila central exacta, el resultado) — mantener en sincro con `Reel.module.scss`. */
export const VISIBLE_ROWS = 3

export interface ReelProps {
  symbols: ReelSymbol[]
  /** `null` mientras gira; una vez parado, el offset YA encajado (`offsetToIndex`) donde debe quedarse fijo, en unidades de casilla. */
  stoppedAtOffset: number | null
  /** Filas por segundo, ya con el desfase decorativo de este rodillo incluido (`Level05.tsx`). */
  speedRowsPerSecond: number
  paused: boolean
  /**
   * Ref mutable donde este rodillo escribe su offset actual en cada tick
   * (mismo patrón que `controlXRef` del nivel 4, `board.ts`): el padre lo
   * lee de forma síncrona al pulsar Stop, sin pasar por el ciclo de render
   * de React en cada fotograma.
   */
  offsetRef: MutableRefObject<number>
}

/**
 * Rodillo de la tragaperras (GDD Nivel 5, 009-plan.md): tira duplicada
 * (`symbols` dos veces seguidas) para que el bucle visual sea perfecto — al
 * llegar al final de la primera copia, el offset se envuelve exactamente a
 * `0` (`% symbols.length`) sin ningún salto visible, porque la segunda
 * copia ya muestra lo mismo que mostraría la primera en ese punto.
 * Desplazamiento por rAF con velocidad propia; escribe `--reel-offset`
 * directamente en el DOM (nunca por estado de React) para no re-renderizar
 * en cada fotograma — mismo patrón que la física de los niveles 3 y 4.
 */
export function Reel({
  symbols,
  stoppedAtOffset,
  speedRowsPerSecond,
  paused,
  offsetRef,
}: ReelProps) {
  const t = useT()
  const trackRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  const lastTsRef = useRef<number | null>(null)
  // "Última versión conocida" de lo que puede cambiar sin que el efecto
  // necesite reiniciar el bucle de rAF (evita perder la continuidad de
  // `lastTsRef` solo porque `paused` cambió a mitad de giro).
  const latestRef = useRef({ speedRowsPerSecond, paused })
  latestRef.current = { speedRowsPerSecond, paused }

  const isSpinning = stoppedAtOffset === null
  const doubledSymbols = useMemo(() => [...symbols, ...symbols], [symbols])

  function applyOffset(offset: number) {
    trackRef.current?.style.setProperty('--reel-offset', String(offset))
  }

  useEffect(() => {
    if (!isSpinning) {
      // Parado: fija el offset ya encajado una sola vez, sin bucle de rAF
      // corriendo en vano mientras no hace nada.
      offsetRef.current = stoppedAtOffset
      applyOffset(stoppedAtOffset)
      return
    }

    lastTsRef.current = null
    function tick(ts: number) {
      if (lastTsRef.current === null) lastTsRef.current = ts
      const dt = (ts - lastTsRef.current) / 1000
      lastTsRef.current = ts

      if (!latestRef.current.paused) {
        let next = offsetRef.current + latestRef.current.speedRowsPerSecond * dt
        if (next >= symbols.length) next -= symbols.length
        offsetRef.current = next
        applyOffset(next)
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- offsetRef es estable (objeto ref del padre); speed/paused se leen de `latestRef`, no disparan reinicio.
  }, [isSpinning, stoppedAtOffset, symbols.length])

  return (
    <div className={styles['reel']}>
      <div
        ref={trackRef}
        className={[styles['reel__track'], !isSpinning ? styles['reel__track--stopped'] : '']
          .filter(Boolean)
          .join(' ')}
      >
        {doubledSymbols.map((symbol, index) => (
          <div
            key={index}
            className={[styles['reel__symbol'], styles[`reel__symbol--${symbol}`]].join(' ')}
            aria-hidden="true"
          >
            {t(symbol === 'agree' ? 'game.agree' : 'game.disagree')}
          </div>
        ))}
      </div>
      <div className={styles['reel__marker']} aria-hidden="true" />
    </div>
  )
}
