import { Suspense, useEffect, useReducer, useRef, useState } from 'react'
import { XPWindow } from '../components/xp/XPWindow'
import { GiantVerdict } from '../components/xp/GiantVerdict'
import { useCountdown } from '../hooks/useCountdown'
import { useT } from '../i18n/useT'
import { LEVEL_DURATION_SECONDS, type LevelDefinition, type LoseReason } from '../levels/types'
import { INITIAL_RUN_FLOW_STATE, isCounterRunning, isLevelPaused, runFlowReducer } from './runFlow'
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
  /** Se llama en cada tick del contador, para que el shell persista el tiempo restante. */
  onTick?: (secondsLeft: number) => void
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
  onTick,
  onExit,
}: LevelHostProps) {
  const t = useT()
  const [flow, dispatch] = useReducer(runFlowReducer, INITIAL_RUN_FLOW_STATE)
  const [loseReason, setLoseReason] = useState<LoseReason>('failed')
  const hasExitedRef = useRef(false)

  const { remaining, pause: pauseCountdown } = useCountdown(initialSeconds, {
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
    if (flow.phase !== 'select' || hasExitedRef.current) return
    hasExitedRef.current = true
    onExit(flow.result === 'win' ? { outcome: 'win' } : { outcome: 'lose', reason: loseReason })
  }, [flow, loseReason, onExit])

  const handleWin = () => dispatch({ type: 'OUTCOME', result: 'win' })
  const handleLose = (reason: LoseReason) => {
    setLoseReason(reason)
    dispatch({ type: 'OUTCOME', result: 'lose' })
  }

  const LevelComponent = level.component
  const categoryName = t(level.titleKey)

  return (
    <>
      <div className={styles['level-host']}>
        <XPWindow
          title={categoryName}
          counter={remaining}
          closeLabel={t('shell.level.close')}
          onClose={flow.phase === 'playing' ? () => handleLose('closed') : undefined}
          consentText={t(level.consentKey)}
        >
          <Suspense fallback={<span>{t('shell.level.loading')}</span>}>
            <LevelComponent
              timeLeft={remaining}
              onWin={handleWin}
              onLose={handleLose}
              paused={isLevelPaused(flow)}
            />
          </Suspense>

          {flow.phase === 'verdict' && flow.result && (
            <GiantVerdict result={flow.result} onDone={() => dispatch({ type: 'VERDICT_DONE' })} />
          )}
        </XPWindow>
      </div>

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
