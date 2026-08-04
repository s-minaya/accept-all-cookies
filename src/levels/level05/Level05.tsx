import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { useT } from '../../i18n/useT'
import { useAudio } from '../../audio/useAudio'
import { useCountdown } from '../../hooks/useCountdown'
import { createRng } from '../../utils/prng'
import { XPButton } from '../../components/xp/XPButton'
import { useLevelBoard } from '../hostChannel'
import type { LevelProps } from '../types'
import { generateReel, type ReelSymbol } from './reels'
import {
  completeRespin,
  createInitialState,
  offsetToIndex,
  REEL_COUNT,
  stopReel,
  type SlotMachineState,
} from './slotMachine'
import { Reel } from './Reel'
import styles from './Level05.module.scss'

/** Filas/segundo de giro (GDD §14, "gran velocidad") — el rodillo central es la base, los otros dos llevan un pequeño desfase decorativo. */
const REEL_BASE_SPEED_ROWS_PER_SEC = 7
const REEL_SPEED_DESFASE_ROWS_PER_SEC = 1
const REEL_SPEEDS: readonly number[] = [
  REEL_BASE_SPEED_ROWS_PER_SEC - REEL_SPEED_DESFASE_ROWS_PER_SEC,
  REEL_BASE_SPEED_ROWS_PER_SEC,
  REEL_BASE_SPEED_ROWS_PER_SEC + REEL_SPEED_DESFASE_ROWS_PER_SEC,
]
/** Pausa de rehabilitación (GDD §14, "~1 s para que el jugador vea y digiera el resultado"). */
const RESPIN_PAUSE_SECONDS = 1

type StoppedOffsets = [number | null, number | null, number | null]
type ReelSymbolSet = [ReelSymbol[], ReelSymbol[], ReelSymbol[]]

/**
 * Semillas independientes por rodillo (no un único RNG consumido 3 veces):
 * evita cualquier correlación visible entre tiras vecinas. Se llama tanto al
 * montar el nivel como en cada rehabilitación (ver `handleRespinComplete`)
 * para que ninguna tira quede "maldita" con muy pocos Agrees durante toda la
 * partida — feedback de playtesting real: el rodillo rápido podía tocar con
 * un único Agree en sus 12 casillas y quedarse prácticamente imposible de
 * cazar en todos los intentos de esa visita al nivel.
 */
function generateReelSymbols(): ReelSymbolSet {
  return [
    generateReel(createRng(Math.floor(Math.random() * 0xffffffff))),
    generateReel(createRng(Math.floor(Math.random() * 0xffffffff))),
    generateReel(createRng(Math.floor(Math.random() * 0xffffffff))),
  ]
}

/**
 * Nivel 5 — Social Media (tragaperras) (GDD Nivel 5, 009-plan.md): el texto
 * de consentimiento vive en el marco azul (mismo patrón as-built que los
 * niveles 3 y 4), el tablero (3 rodillos + 3 Stops) se publica aparte vía
 * `useLevelBoard`, sin marco propio. Sin `fillHeight`: cada rodillo tiene su
 * propia altura fija (`Reel.module.scss`), igual que el recuadro de lluvia
 * del nivel 3 — no depende de que un ancestro le dé el 100% del alto
 * disponible (mismo razonamiento que llevó a quitárselo al nivel 4).
 *
 * Máquina de estados pura en `slotMachine.ts`: este componente solo
 * traduce eventos de usuario (pulsar Stop) a transiciones de esa máquina y
 * sincroniza el resultado con sonido/`onWin`/`onLose`. El offset de scroll
 * de cada rodillo se lee de un ref mutable que el propio `Reel` escribe en
 * cada fotograma (mismo patrón que `controlXRef` del nivel 4) — nunca por
 * estado de React, para no re-renderizar 3 tiras en cada tick de rAF.
 */
export default function Level05({ onWin, onLose, paused }: LevelProps) {
  const t = useT()
  const { playCoin } = useAudio()

  const [reelSymbols, setReelSymbols] = useState<ReelSymbolSet>(generateReelSymbols)

  const [machineState, setMachineState] = useState<SlotMachineState>(() => createInitialState())
  const [stoppedOffsets, setStoppedOffsets] = useState<StoppedOffsets>([null, null, null])

  const offsetRef0 = useRef(0)
  const offsetRef1 = useRef(0)
  const offsetRef2 = useRef(0)
  const offsetRefFor = useCallback(
    (index: number): MutableRefObject<number> =>
      index === 0 ? offsetRef0 : index === 1 ? offsetRef1 : offsetRef2,
    [],
  )

  const handleStop = useCallback(
    (reelIndex: number) => {
      if (paused) return
      const reelState = machineState.reels[reelIndex]
      if (!reelState || reelState.status !== 'spinning') return

      const symbols = reelSymbols[reelIndex]
      const index = offsetToIndex(offsetRefFor(reelIndex).current, symbols.length)
      const symbol = symbols[index]

      const { state: nextState, outcome } = stopReel(machineState, reelIndex, symbol)
      setMachineState(nextState)
      setStoppedOffsets((prev) => {
        const next: StoppedOffsets = [...prev]
        next[reelIndex] = index
        return next
      })

      // Sonido de "moneda" en cada captura, sea Agree o Disagree (Sofía:
      // "cuando el usuario captura un botón, el que sea, debe sonar este
      // audio") — el veredicto final (ganar/perder) ya suena aparte, disparado
      // por AppShell con positive/negative.
      playCoin()

      if (outcome === 'won') onWin()
      else if (outcome === 'lost') onLose('failed')
    },
    [paused, machineState, reelSymbols, offsetRefFor, onWin, onLose, playCoin],
  )

  const handleRespinComplete = useCallback(() => {
    setMachineState((prev) => completeRespin(prev))
    setStoppedOffsets([null, null, null])
    // Tiras nuevas en cada rehabilitación (GDD Nivel 5, corrección de
    // playtesting): cada ronda es un sorteo independiente, así que ninguna
    // tira desfavorable persiste durante toda la visita al nivel.
    setReelSymbols(generateReelSymbols())
  }, [])

  const respinCountdown = useCountdown(RESPIN_PAUSE_SECONDS, {
    autoStart: true,
    onComplete: handleRespinComplete,
  })
  // Ya arrancada para este episodio de `respinPause` (evita que un `paused`
  // que va y viene reinicie la cuenta desde el principio cada vez).
  const respinTimerStartedRef = useRef(false)

  // Une arranque, pausa y reanudación de la cuenta de rehabilitación en un
  // solo efecto para evitar la combinación `reset()` + `resume()` en el
  // mismo tick: `resume()` lee `remaining` de su propio cierre de React, que
  // en ese instante todavía no refleja el `reset()` recién llamado (bug de
  // cierre obsoleto) — aquí cada uno se llama por separado, nunca los dos a
  // la vez para el mismo episodio.
  useEffect(() => {
    if (machineState.phase !== 'respinPause') {
      respinTimerStartedRef.current = false
      return
    }
    if (paused) {
      if (respinTimerStartedRef.current) respinCountdown.pause()
      return
    }
    if (!respinTimerStartedRef.current) {
      respinTimerStartedRef.current = true
      respinCountdown.reset(RESPIN_PAUSE_SECONDS) // autoStart:true del hook la arranca sola
    } else {
      respinCountdown.resume()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `respinCountdown` cambia de identidad cada render (no es memo); solo debe reaccionar a la fase y a `paused`.
  }, [machineState.phase, paused])

  const board = useMemo(() => {
    const reelIndices = Array.from({ length: REEL_COUNT }, (_, reelIndex) => reelIndex)
    return (
      <div className={styles['level-05']}>
        <div className={styles['level-05__reels']}>
          {reelIndices.map((reelIndex) => {
            const reelState = machineState.reels[reelIndex]
            const isStopped = reelState?.status === 'stopped'
            return (
              <Reel
                key={reelIndex}
                symbols={reelSymbols[reelIndex]}
                stoppedAtOffset={isStopped ? stoppedOffsets[reelIndex] : null}
                speedRowsPerSecond={REEL_SPEEDS[reelIndex]}
                paused={paused}
                offsetRef={offsetRefFor(reelIndex)}
              />
            )
          })}
        </div>
        <div className={styles['level-05__stops']}>
          {reelIndices.map((reelIndex) => {
            const reelState = machineState.reels[reelIndex]
            return (
              <XPButton
                key={reelIndex}
                variant="neutral"
                className={styles['level-05__stop']}
                disabled={paused || !reelState || reelState.status !== 'spinning'}
                onClick={() => handleStop(reelIndex)}
              >
                {t('game.stop')}
              </XPButton>
            )
          })}
        </div>
      </div>
    )
  }, [reelSymbols, machineState, stoppedOffsets, paused, offsetRefFor, handleStop, t])
  useLevelBoard(board)

  return (
    <div className={styles['level-05-consent']}>
      <p className={styles['level-05-consent__text']}>{t('levels.5.consent')}</p>
    </div>
  )
}
