import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { XPWindow } from '../components/xp/XPWindow'
import { GiantVerdict } from '../components/xp/GiantVerdict'
import { useCountdown } from '../hooks/useCountdown'
import { useT } from '../i18n/useT'
import { LEVEL_DURATION_SECONDS, type LevelDefinition, type LoseReason } from '../levels/types'
import { HostChannelContext, type HostChannelValue } from '../levels/hostChannel'
import {
  INITIAL_RUN_FLOW_STATE,
  isCounterRunning,
  isLevelPaused,
  runFlowReducer,
  type RunFlowResult,
  type RunFlowState,
} from './runFlow'
import { WinDialog } from './flow/WinDialog'
import { LoseDialog } from './flow/LoseDialog'
import styles from './LevelHost.module.scss'

export type LevelExitResult = { outcome: 'win' } | { outcome: 'lose'; reason: LoseReason }

export interface LevelHostProps {
  level: LevelDefinition
  /** El nivel 12 usa el mensaje de cierre especial de Level Complete (GDD §7.2). */
  isFinalLevel: boolean
  /** Valor de reanudación del contador (p. ej. tras una recarga); por defecto arranca en 100s. */
  initialSeconds?: number
  /**
   * Desenlace ya decidido antes de montar (p. ej. tras recargar durante el
   * veredicto o la modal): el flujo arranca directamente en la fase "modal"
   * con este resultado, sin pasar por "playing" ni repetir la animación de
   * `GiantVerdict`. Si no se pasa, el flujo arranca normalmente en "playing".
   */
  initialOutcome?: RunFlowResult
  /** Se llama en cada tick del contador, para que el shell persista el tiempo restante. */
  onTick?: (secondsLeft: number) => void
  /** Se llama una sola vez, en cuanto el nivel gana o pierde (antes del veredicto), para que el shell persista el desenlace pendiente. */
  onOutcome?: (result: RunFlowResult) => void
  /** Se llama una sola vez, cuando el flujo llega a la fase "select" (tras cerrar el veredicto). */
  onExit: (result: LevelExitResult) => void
}

/**
 * Gestiona todo lo que el contrato de nivel dice que un nivel nunca debe
 * tocar: el contador, el botón X, la carga perezosa del chunk del nivel y el
 * meta-flujo de veredicto (`runFlow`, 004-plan.md): al ganar o perder, el
 * nivel se congela (`paused`), se muestra `GiantVerdict` y después la modal
 * correspondiente; solo entonces se avisa al shell con `onExit`.
 */
export function LevelHost({
  level,
  isFinalLevel,
  initialSeconds = LEVEL_DURATION_SECONDS,
  initialOutcome,
  onTick,
  onOutcome,
  onExit,
}: LevelHostProps) {
  const t = useT()
  // Botón dev de saltar nivel (008-plan.md), mismo patrón de interruptor que
  // `?playground` (`App.tsx`): una comprobación barata de la URL, repetida
  // en cada render (nunca se usa para navegar). Vive aquí (no en un nivel)
  // para funcionar en los 12 sin tocarlos. Retirar en la feature 017 junto
  // con la Playground — hasta entonces, no "limpiar" esto pensando que es
  // código muerto (AGENTS.md).
  const isDevMode = new URLSearchParams(window.location.search).has('dev')
  const [flow, dispatch] = useReducer(runFlowReducer, initialOutcome, (outcome): RunFlowState =>
    outcome ? { phase: 'modal', result: outcome } : INITIAL_RUN_FLOW_STATE,
  )
  const [loseReason, setLoseReason] = useState<LoseReason>('failed')
  const [restartKey, setRestartKey] = useState(0)
  const [levelFooter, setLevelFooter] = useState<ReactNode>(null)
  const [levelBoard, setLevelBoard] = useState<ReactNode>(null)
  const [windowTransform, setWindowTransform] = useState<string | null>(null)
  const windowRef = useRef<HTMLDivElement>(null)
  const hasExitedRef = useRef(false)
  const hasNotifiedOutcomeRef = useRef(false)

  // Canal nivel→host consolidado (007-plan.md): un único contexto con
  // ranuras con nombre en vez de un hook/contexto suelto por necesidad.
  // Memoizado con dependencias que nunca cambian (los setters de useState y
  // el ref son estables de por vida) para que su identidad sea estable entre
  // renders — igual que el propio `footer`, una referencia nueva rompería la
  // memoización de los hooks que lo consumen (`useLevelFooter` y compañía).
  const hostChannel: HostChannelValue = useMemo(
    () => ({
      setFooter: setLevelFooter,
      setWindowTransform,
      windowRef,
      setBoard: setLevelBoard,
    }),
    [],
  )

  const {
    remaining,
    pause: pauseCountdown,
    reset: resetCountdown,
  } = useCountdown(initialSeconds, {
    onComplete: () => {
      setLoseReason('timeout')
      dispatch({ type: 'OUTCOME', result: 'lose' })
    },
  })

  useEffect(() => {
    onTick?.(remaining)
  }, [remaining, onTick])

  useEffect(() => {
    if (!isCounterRunning(flow)) pauseCountdown()
  }, [flow, pauseCountdown])

  useEffect(() => {
    if (flow.phase !== 'verdict' || !flow.result || hasNotifiedOutcomeRef.current) return
    hasNotifiedOutcomeRef.current = true
    onOutcome?.(flow.result)
  }, [flow, onOutcome])

  useEffect(() => {
    if (flow.phase !== 'select' || hasExitedRef.current) return
    hasExitedRef.current = true
    onExit(flow.result === 'win' ? { outcome: 'win' } : { outcome: 'lose', reason: loseReason })
  }, [flow, loseReason, onExit])

  // Estables entre renders (useCallback): LevelComponent los recibe como
  // props y algunos niveles los usan como dependencia al memoizar contenido
  // (p. ej. el pie de botones vía `useLevelFooter`) — una referencia nueva
  // en cada render (el contador cambia cada segundo) rompería esa memoización.
  const handleWin = useCallback(() => dispatch({ type: 'OUTCOME', result: 'win' }), [])
  const handleLose = useCallback((reason: LoseReason) => {
    setLoseReason(reason)
    dispatch({ type: 'OUTCOME', result: 'lose' })
  }, [])
  // Remonta el componente del nivel (estado interno limpio gratis) y reinicia
  // el contador a 100, siempre — nunca al valor de reanudación tras recarga
  // (005-plan.md).
  const handleRestart = useCallback(() => {
    setRestartKey((key) => key + 1)
    resetCountdown(LEVEL_DURATION_SECONDS)
  }, [resetCountdown])
  // Completa el nivel al instante, saltándose `dispatch` por completo: nunca
  // pasa por "verdict"/"modal", así que no hay animación de `GiantVerdict` ni
  // diálogo — mismo camino de datos que una victoria real (`onExit`, que el
  // shell resuelve con `completeLevel`), pero sin su ceremonia (008-plan.md,
  // "sin veredicto ni modal": es una herramienta de testeo, no juego).
  const handleDevSkip = useCallback(() => {
    if (hasExitedRef.current) return
    hasExitedRef.current = true
    onExit({ outcome: 'win' })
  }, [onExit])

  const LevelComponent = level.component
  const categoryName = t(level.titleKey)

  const levelContent = (
    <>
      <Suspense fallback={<span>{t('shell.level.loading')}</span>}>
        <HostChannelContext.Provider value={hostChannel}>
          <LevelComponent
            key={restartKey}
            timeLeft={remaining}
            onWin={handleWin}
            onLose={handleLose}
            onRestart={handleRestart}
            paused={isLevelPaused(flow)}
          />
        </HostChannelContext.Provider>
      </Suspense>

      {flow.phase === 'verdict' && flow.result && (
        <GiantVerdict result={flow.result} onDone={() => dispatch({ type: 'VERDICT_DONE' })} />
      )}
    </>
  )

  return (
    <>
      <div className={styles['level-host']}>
        <div
          ref={windowRef}
          className={styles['level-host__rotator']}
          data-draggable={windowTransform !== null ? '' : undefined}
          style={
            windowTransform
              ? ({ '--window-rotation': windowTransform } as CSSProperties)
              : undefined
          }
        >
          <XPWindow
            title={categoryName}
            counter={remaining}
            closeLabel={t('shell.level.close')}
            onClose={flow.phase === 'playing' ? () => handleLose('closed') : undefined}
            consentText={level.consentKey ? t(level.consentKey) : undefined}
            scrollableContent={!level.consentKey}
            fillHeight={level.fillHeight}
            // Frameless (nivel 4, GDD §4.4 excepción): el propio contenido del
            // nivel ocupa la ranura `boardBelowFrame` (sin marco azul) en vez
            // de `children` (que sí lo lleva) — ver `LevelDefinition.frameless`.
            children={level.frameless ? undefined : levelContent}
            boardBelowFrame={level.frameless ? levelContent : levelBoard}
            footer={levelFooter}
          />
        </div>
      </div>

      {isDevMode && (
        <button type="button" className={styles['level-host__dev-skip']} onClick={handleDevSkip}>
          {t('shell.level.devSkip')}
        </button>
      )}

      {flow.phase === 'modal' && flow.result === 'win' && (
        <WinDialog
          categoryName={categoryName}
          isFinalLevel={isFinalLevel}
          onNext={() => dispatch({ type: 'MODAL_ACTION' })}
        />
      )}

      {flow.phase === 'modal' && flow.result === 'lose' && (
        <LoseDialog onReturnToSelection={() => dispatch({ type: 'MODAL_ACTION' })} />
      )}
    </>
  )
}
